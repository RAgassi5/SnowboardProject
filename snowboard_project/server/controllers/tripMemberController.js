'use strict';
const { Op } = require('sequelize');
const { sequelize, Trip, User, Resort, TripMember, Friendship } = require('../db');
const { getIO, getUserSocketId } = require('../socket');

const ANY = ['user', 'manager', 'admin'];

// ── helpers ────────────────────────────────────────────────────────────────────

async function getFriendIds(userId) {
  const rows = await Friendship.findAll({
    where: { [Op.or]: [{ user1Id: userId }, { user2Id: userId }] },
    attributes: ['user1Id', 'user2Id']
  });
  return rows.map(r => (r.user1Id === userId ? r.user2Id : r.user1Id));
}

function fmtTrip(t, membershipStatus = null, memberId = null, memberCount = 0) {
  return {
    tripId:          t.id,
    userId:          t.userId,
    resortId:        t.resortId,
    startDate:       t.startDate,
    endDate:         t.endDate,
    title:           t.title      ?? null,
    skillLevel:      t.skillLevel ?? null,
    sportType:       t.sportType  ?? null,
    privacy:         t.privacy,
    maxMembers:      t.maxMembers ?? null,
    memberCount,
    membershipStatus,
    memberId,
    creator: t.creator ? {
      userId:    t.creator.id,
      firstName: t.creator.firstName,
      lastName:  t.creator.lastName
    } : null,
    resort: t.Resort ? {
      resortId:         t.Resort.id,
      name:             t.Resort.name,
      country:          t.Resort.country,
      difficultyLevel:  t.Resort.difficultyLevel,
      snowboardFriendly: t.Resort.snowboardFriendly
    } : null
  };
}

// ── GET /trips/discover ────────────────────────────────────────────────────────
const discoverTrips = async (req, res, next) => {
  try {
    const currentUserId = parseInt(req.headers['x-user-id']);
    if (isNaN(currentUserId)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'x-user-id header required.', details: {} } });
    }

    const friendIds = await getFriendIds(currentUserId);

    // Privacy: public always visible; friends-only only if creator is a friend
    const privacyOptions = [{ privacy: 'public' }];
    if (friendIds.length > 0) {
      privacyOptions.push({ privacy: 'friends-only', userId: { [Op.in]: friendIds } });
    }

    const today = new Date().toISOString().split('T')[0];

    const where = {
      userId: { [Op.ne]: currentUserId },
      [Op.or]: privacyOptions,
      endDate: { [Op.gte]: today }
    };

    const { sportType, skillLevel } = req.query;
    if (sportType)  where.sportType  = sportType;
    if (skillLevel) where.skillLevel = parseInt(skillLevel);

    const trips = await Trip.findAll({
      where,
      include: [
        { model: User,   as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Resort, attributes: ['id', 'name', 'country', 'difficultyLevel', 'snowboardFriendly'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    if (trips.length === 0) {
      return res.status(200).json({ success: true, data: [], error: null });
    }

    const tripIds = trips.map(t => t.id);

    // Current user's membership status for each trip
    const myMemberships = await TripMember.findAll({
      where: { tripId: { [Op.in]: tripIds }, userId: currentUserId },
      attributes: ['tripId', 'id', 'status']
    });
    const membershipMap = new Map(myMemberships.map(m => [m.tripId, { memberId: m.id, status: m.status }]));

    // Approved member counts per trip
    const approvedRows = await TripMember.findAll({
      where: { tripId: { [Op.in]: tripIds }, status: 'approved' },
      attributes: ['tripId']
    });
    const countMap = {};
    approvedRows.forEach(r => { countMap[r.tripId] = (countMap[r.tripId] || 0) + 1; });

    return res.status(200).json({
      success: true,
      data: trips.map(t => {
        const m = membershipMap.get(t.id);
        return fmtTrip(t, m?.status ?? null, m?.memberId ?? null, countMap[t.id] ?? 0);
      }),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /trips/:id/join ───────────────────────────────────────────────────────
const joinTrip = async (req, res, next) => {
  try {
    const tripId        = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    if (isNaN(currentUserId)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'x-user-id header required.', details: {} } });
    }

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Trip ${tripId} not found.`, details: {} } });
    }

    if (trip.userId === currentUserId) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'You cannot join your own trip.', details: {} } });
    }

    // Validate privacy
    if (trip.privacy === 'private') {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'This trip is private.', details: {} } });
    }
    if (trip.privacy === 'friends-only') {
      const friendIds = await getFriendIds(currentUserId);
      if (!friendIds.includes(trip.userId)) {
        return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'This trip is only open to friends of the creator.', details: {} } });
      }
    }

    // Already a member?
    const existing = await TripMember.findOne({ where: { tripId, userId: currentUserId } });
    if (existing) {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: `You already have a ${existing.status} membership for this trip.`, details: {} } });
    }

    // Check capacity (if maxMembers is set)
    if (trip.maxMembers != null) {
      const approvedCount = await TripMember.count({ where: { tripId, status: 'approved' } });
      if (approvedCount >= trip.maxMembers) {
        return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'This trip is full.', details: {} } });
      }
    }

    const member = await TripMember.create({ tripId, userId: currentUserId, status: 'pending' });

    // Real-time notification to trip creator if online (Step 7 — custom event: trip:join-request)
    try {
      const io  = getIO();
      const sid = getUserSocketId(trip.userId);
      if (io && sid) {
        const requester = await User.findByPk(currentUserId, { attributes: ['firstName', 'lastName'] });
        io.to(sid).emit('trip:join-request', {
          memberId:  member.id,
          tripId,
          userId:    currentUserId,
          firstName: requester.firstName,
          lastName:  requester.lastName
        });
      }
    } catch (_) { /* non-critical */ }

    return res.status(201).json({ success: true, data: { memberId: member.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// ── GET /trips/:id/members ─────────────────────────────────────────────────────
const getTripMembers = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);

    const members = await TripMember.findAll({
      where: { tripId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'sportType', 'skillLevel'] }]
    });

    return res.status(200).json({
      success: true,
      data: members.map(m => ({
        memberId:     m.id,
        tripId:       m.tripId,
        userId:       m.userId,
        status:       m.status,
        isInvitation: m.isInvitation,
        createdAt:    m.createdAt,
        user: {
          userId:     m.User.id,
          firstName:  m.User.firstName,
          lastName:   m.User.lastName,
          email:      m.User.email,
          sportType:  m.User.sportType,
          skillLevel: m.User.skillLevel
        }
      })),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /trip-members/:id/approve ─────────────────────────────────────────────
const approveMember = async (req, res, next) => {
  try {
    const memberId      = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    const membership = await TripMember.findByPk(memberId);
    if (!membership) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Membership ${memberId} not found.`, details: {} } });
    }

    const trip = await Trip.findByPk(membership.tripId);
    if (membership.isInvitation) {
      // Invitation: only the invited user can accept it
      if (membership.userId !== currentUserId) {
        return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the invited user can accept this invitation.', details: {} } });
      }
    } else {
      // Join request: only the trip creator can approve
      if (trip.userId !== currentUserId) {
        return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the trip creator can approve members.', details: {} } });
      }
    }

    if (membership.status !== 'pending') {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'Membership is not pending.', details: {} } });
    }

    // Check capacity before approving
    if (trip.maxMembers != null) {
      const approvedCount = await TripMember.count({ where: { tripId: membership.tripId, status: 'approved' } });
      if (approvedCount >= trip.maxMembers) {
        return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'Trip is already full.', details: {} } });
      }
    }

    await membership.update({ status: 'approved' });
    return res.status(200).json({ success: true, data: { memberId }, error: null });
  } catch (err) {
    next(err);
  }
};

// ── PUT /trip-members/:id/reject ──────────────────────────────────────────────
const rejectMember = async (req, res, next) => {
  try {
    const memberId      = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    const membership = await TripMember.findByPk(memberId);
    if (!membership) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Membership ${memberId} not found.`, details: {} } });
    }

    const trip = await Trip.findByPk(membership.tripId);
    if (trip.userId !== currentUserId) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the trip creator can reject members.', details: {} } });
    }

    if (membership.status !== 'pending') {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'Membership is not pending.', details: {} } });
    }

    await membership.update({ status: 'rejected' });
    return res.status(200).json({ success: true, data: { memberId }, error: null });
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:id/joined-trips ───────────────────────────────────────────────
const getJoinedTrips = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const memberships = await TripMember.findAll({
      where: { userId, status: 'approved' },
      include: [{
        model: Trip,
        include: [
          { model: User,   as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
          { model: Resort, attributes: ['id', 'name', 'country', 'difficultyLevel', 'snowboardFriendly'] }
        ]
      }]
    });

    return res.status(200).json({
      success: true,
      data: memberships.map(m => fmtTrip(m.Trip, 'approved', m.id)),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /trip-members/:id  (creator removes OR member leaves) ───────────────
const removeMember = async (req, res, next) => {
  try {
    const memberId      = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);

    if (isNaN(currentUserId)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'x-user-id header required.', details: {} } });
    }

    const membership = await TripMember.findByPk(memberId);
    if (!membership) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Membership ${memberId} not found.`, details: {} } });
    }

    const trip = await Trip.findByPk(membership.tripId);
    const isCreator = trip && trip.userId === currentUserId;
    const isSelf    = membership.userId === currentUserId;

    if (!isCreator && !isSelf) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the trip creator or the member themselves can remove a membership.', details: {} } });
    }

    await membership.destroy();
    return res.status(200).json({ success: true, data: { memberId }, error: null });
  } catch (err) {
    next(err);
  }
};

// ── POST /trips/:id/invite ────────────────────────────────────────────────────
const inviteFriend = async (req, res, next) => {
  try {
    const tripId        = parseInt(req.params.id);
    const currentUserId = parseInt(req.headers['x-user-id']);
    const inviteeId     = parseInt(req.body.userId);

    if (isNaN(currentUserId) || isNaN(inviteeId)) {
      return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'userId is required.', details: {} } });
    }

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Trip ${tripId} not found.`, details: {} } });
    }
    if (trip.userId !== currentUserId) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Only the trip creator can invite members.', details: {} } });
    }

    const friendIds = await getFriendIds(currentUserId);
    if (!friendIds.includes(inviteeId)) {
      return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'You can only invite your friends.', details: {} } });
    }

    const existing = await TripMember.findOne({ where: { tripId, userId: inviteeId } });
    if (existing) {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: `This user already has a ${existing.status} membership for this trip.`, details: {} } });
    }

    const member = await TripMember.create({ tripId, userId: inviteeId, status: 'pending', isInvitation: true });

    // Real-time notification to invitee if they are online
    try {
      const io  = getIO();
      const sid = getUserSocketId(inviteeId);
      if (io && sid) {
        const inviter = await User.findByPk(currentUserId, { attributes: ['firstName', 'lastName'] });
        io.to(sid).emit('trip:invitation', {
          memberId:         member.id,
          tripId,
          inviterFirstName: inviter.firstName,
          inviterLastName:  inviter.lastName
        });
      }
    } catch (_) { /* non-critical */ }

    return res.status(201).json({ success: true, data: { memberId: member.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:id/invitations ────────────────────────────────────────────────
const getUserInvitations = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const memberships = await TripMember.findAll({
      where: { userId, status: 'pending', isInvitation: true },
      include: [{
        model: Trip,
        include: [
          { model: User,   as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
          { model: Resort, attributes: ['id', 'name', 'country', 'difficultyLevel', 'snowboardFriendly'] }
        ]
      }]
    });

    return res.status(200).json({
      success: true,
      data: memberships.map(m => ({ memberId: m.id, ...fmtTrip(m.Trip, 'pending', m.id) })),
      error: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { discoverTrips, joinTrip, getTripMembers, approveMember, rejectMember, getJoinedTrips, removeMember, inviteFriend, getUserInvitations };
