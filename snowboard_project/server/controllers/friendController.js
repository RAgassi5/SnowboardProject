'use strict';
const { Op, UniqueConstraintError } = require('sequelize');
const { User, FriendRequest, Friendship } = require('../db');
const { getIO, getUserSocketId } = require('../socket');

const ALL_ROLES = ['user', 'manager', 'admin'];

// GET /users/search?q=<name or email>
const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameter q is required.', details: {} }
      });
    }

    const currentUserId = parseInt(req.headers['x-user-id']);
    const like = `%${q}%`;

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: isNaN(currentUserId) ? 0 : currentUserId } },
          {
            [Op.or]: [
              { firstName: { [Op.like]: like } },
              { lastName:  { [Op.like]: like } },
              { email:     { [Op.like]: like } }
            ]
          }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'],
      limit: 20
    });

    return res.status(200).json({
      success: true,
      data: users.map(u => ({
        userId:     u.id,
        firstName:  u.firstName,
        lastName:   u.lastName,
        email:      u.email,
        sportType:  u.sportType,
        skillLevel: u.skillLevel
      })),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// POST /friend-requests  body: { receiverId }
const sendFriendRequest = async (req, res, next) => {
  try {
    const senderId    = parseInt(req.headers['x-user-id']);
    const receiverId  = parseInt(req.body.receiverId);

    if (isNaN(senderId)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'x-user-id header is required.', details: {} } });
    }
    if (isNaN(receiverId)) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'receiverId is required.', details: { field: 'receiverId' } } });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'You cannot send a friend request to yourself.', details: {} } });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `User ${receiverId} not found.`, details: {} } });
    }

    // ── Already friends? ──────────────────────────────────────────────────────
    const u1 = Math.min(senderId, receiverId);
    const u2 = Math.max(senderId, receiverId);
    const existingFriendship = await Friendship.findOne({ where: { user1Id: u1, user2Id: u2 } });
    if (existingFriendship) {
      return res.status(409).json({
        success: false, data: null,
        error: { code: 'ALREADY_FRIENDS', message: 'You are already friends with this user.', details: {} }
      });
    }

    // ── Check same-direction row regardless of status ─────────────────────────
    // The DB has a unique key on (sender_id, receiver_id) — we must catch any
    // existing row before attempting an INSERT, not just pending ones.
    const sameDir = await FriendRequest.findOne({ where: { senderId, receiverId } });
    if (sameDir) {
      if (sameDir.status === 'pending') {
        return res.status(409).json({
          success: false, data: null,
          error: { code: 'FRIEND_REQUEST_ALREADY_EXISTS', message: 'You already sent a friend request to this user.', details: {} }
        });
      }
      if (sameDir.status === 'accepted') {
        // Friendship table check above already passed (no active friendship),
        // so the users have since unfriended. Re-use the row.
      }
      // status === 'rejected' or 'accepted' (post-unfriend): re-use the row
      // instead of inserting a new one (INSERT would fail the unique constraint).
      await sameDir.update({ status: 'pending' });
      const emitRequest = sameDir;
      try {
        const io  = getIO();
        const sid = getUserSocketId(receiverId);
        if (io && sid) {
          const sender = await User.findByPk(senderId, { attributes: ['firstName', 'lastName'] });
          io.to(sid).emit('friend:request', {
            requestId: emitRequest.id, senderId,
            firstName: sender.firstName, lastName: sender.lastName
          });
        }
      } catch (_) { /* non-critical */ }
      return res.status(201).json({ success: true, data: { requestId: emitRequest.id }, error: null });
    }

    // ── Check reverse-direction pending request ────────────────────────────────
    // If receiver already sent a pending request to sender, tell sender to
    // accept that one instead of creating a new one the other way.
    const reverseReq = await FriendRequest.findOne({
      where: { senderId: receiverId, receiverId: senderId, status: 'pending' }
    });
    if (reverseReq) {
      return res.status(409).json({
        success: false, data: null,
        error: {
          code: 'FRIEND_REQUEST_ALREADY_EXISTS',
          message: 'This user has already sent you a friend request. Check your incoming requests to accept it.',
          details: { requestId: reverseReq.id }
        }
      });
    }

    // ── Create new request ────────────────────────────────────────────────────
    let request;
    try {
      request = await FriendRequest.create({ senderId, receiverId, status: 'pending' });
    } catch (createErr) {
      // Final safety net — if a race condition still triggers the unique constraint
      if (createErr instanceof UniqueConstraintError) {
        return res.status(409).json({
          success: false, data: null,
          error: { code: 'FRIEND_REQUEST_ALREADY_EXISTS', message: 'A friend request already exists between these users.', details: {} }
        });
      }
      throw createErr;
    }

    // Real-time notification to receiver if online (custom event: friend:request)
    try {
      const io  = getIO();
      const sid = getUserSocketId(receiverId);
      if (io && sid) {
        const sender = await User.findByPk(senderId, { attributes: ['firstName', 'lastName'] });
        io.to(sid).emit('friend:request', {
          requestId: request.id, senderId,
          firstName: sender.firstName, lastName: sender.lastName
        });
      }
    } catch (_) { /* non-critical */ }

    return res.status(201).json({ success: true, data: { requestId: request.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/friend-requests/received
const getReceivedRequests = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const requests = await FriendRequest.findAll({
      where: { receiverId: userId, status: 'pending' },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'] }]
    });

    return res.status(200).json({
      success: true,
      data: requests.map(r => ({
        requestId: r.id,
        senderId:  r.senderId,
        sender: {
          userId:     r.sender.id,
          firstName:  r.sender.firstName,
          lastName:   r.sender.lastName,
          email:      r.sender.email,
          sportType:  r.sender.sportType,
          skillLevel: r.sender.skillLevel
        },
        createdAt: r.createdAt
      })),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/friend-requests/sent
const getSentRequests = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const requests = await FriendRequest.findAll({
      where: { senderId: userId, status: 'pending' },
      include: [{ model: User, as: 'receiver', attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'] }]
    });

    return res.status(200).json({
      success: true,
      data: requests.map(r => ({
        requestId:  r.id,
        receiverId: r.receiverId,
        receiver: {
          userId:     r.receiver.id,
          firstName:  r.receiver.firstName,
          lastName:   r.receiver.lastName,
          email:      r.receiver.email,
          sportType:  r.receiver.sportType,
          skillLevel: r.receiver.skillLevel
        },
        createdAt: r.createdAt
      })),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// PUT /friend-requests/:id/accept
const acceptFriendRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    const request = await FriendRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Friend request ${requestId} not found.`, details: {} } });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'This request has already been handled.', details: {} } });
    }
    if (request.receiverId !== currentUserId) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the recipient can accept a friend request.', details: {} } });
    }

    await request.update({ status: 'accepted' });

    const u1 = Math.min(request.senderId, request.receiverId);
    const u2 = Math.max(request.senderId, request.receiverId);
    const friendship = await Friendship.create({ user1Id: u1, user2Id: u2 });

    return res.status(200).json({ success: true, data: { requestId, friendshipId: friendship.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /friend-requests/:id/reject
const rejectFriendRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    const request = await FriendRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Friend request ${requestId} not found.`, details: {} } });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'This request has already been handled.', details: {} } });
    }
    if (request.receiverId !== currentUserId) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the recipient can reject a friend request.', details: {} } });
    }

    await request.update({ status: 'rejected' });
    return res.status(200).json({ success: true, data: { requestId }, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/friends
const getFriends = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const friendships = await Friendship.findAll({
      where: { [Op.or]: [{ user1Id: userId }, { user2Id: userId }] },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'] },
        { model: User, as: 'user2', attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'] }
      ]
    });

    const friends = friendships.map(f => {
      const friend = f.user1Id === userId ? f.user2 : f.user1;
      return {
        friendshipId: f.id,
        userId:       friend.id,
        firstName:    friend.firstName,
        lastName:     friend.lastName,
        email:        friend.email,
        sportType:    friend.sportType,
        skillLevel:   friend.skillLevel
      };
    });

    return res.status(200).json({ success: true, data: friends, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /friendships/:id
const removeFriend = async (req, res, next) => {
  try {
    const friendshipId  = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    const friendship = await Friendship.findByPk(friendshipId);
    if (!friendship) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Friendship ${friendshipId} not found.`, details: {} } });
    }

    if (friendship.user1Id !== currentUserId && friendship.user2Id !== currentUserId) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'You are not part of this friendship.', details: {} } });
    }

    await friendship.destroy();
    return res.status(200).json({ success: true, data: { friendshipId }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
};
