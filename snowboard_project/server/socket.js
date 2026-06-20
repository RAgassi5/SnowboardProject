'use strict';
const { Server } = require('socket.io');
const { Op }     = require('sequelize');
const { User, TripMessage, Friendship, Trip, TripMember, TripReadStatus } = require('./db');

// ── In-memory presence tracking ───────────────────────────────────────────────
const onlineUsers = new Map(); // userId (int) → socketId
const socketUsers = new Map(); // socketId      → userId (int)

let _io = null;

// ── Helper: get all friend user IDs ───────────────────────────────────────────
async function getFriendIds(userId) {
  const rows = await Friendship.findAll({
    where: { [Op.or]: [{ user1Id: userId }, { user2Id: userId }] },
    attributes: ['user1Id', 'user2Id']
  });
  return rows.map(r => (r.user1Id === userId ? r.user2Id : r.user1Id));
}

// ── Notify a user's friends about a presence change ───────────────────────────
async function notifyFriends(userId, event, payload) {
  try {
    const friendIds = await getFriendIds(userId);
    for (const fId of friendIds) {
      const sid = onlineUsers.get(fId);
      if (sid) _io.to(sid).emit(event, payload);
    }
  } catch (err) {
    console.error(`[Socket] notifyFriends(${event}) error:`, err.message);
  }
}

// ── initSocket ────────────────────────────────────────────────────────────────
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true
    }
  });
  _io = io;

  io.on('connection', async (socket) => {
    const userId = parseInt(socket.handshake.auth.userId);
    if (!userId || isNaN(userId)) {
      socket.disconnect();
      return;
    }

    // Register presence
    onlineUsers.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    // ── Step 7: Event 1 — broadcast user:online to all online friends ─────────
    try {
      const user = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName'] });
      if (user) {
        await notifyFriends(userId, 'user:online', {
          userId,
          firstName: user.firstName,
          lastName:  user.lastName
        });
      }
    } catch (err) {
      console.error('[Socket] connect notify error:', err.message);
    }

    // ── Step 7: Event 2 — friends:online — client asks which friends are online ─
    socket.on('friends:online', async (callback) => {
      try {
        const friendIds = await getFriendIds(userId);
        const onlineFriendIds = friendIds.filter(id => onlineUsers.has(id));
        if (typeof callback === 'function') callback({ onlineFriendIds });
      } catch (err) {
        if (typeof callback === 'function') callback({ onlineFriendIds: [] });
      }
    });

    // ── Step 8: Event 3 — chat:join — join a trip's Socket.IO room ────────────
    socket.on('chat:join', async ({ tripId }) => {
      if (!tripId) return;
      const tid = parseInt(tripId);
      try {
        const trip = await Trip.findByPk(tid, { attributes: ['id', 'userId'] });
        if (!trip) return;
        if (trip.userId !== userId) {
          const mem = await TripMember.findOne({ where: { tripId: tid, userId, status: 'approved' } });
          if (!mem) return; // silently deny non-members
        }
        socket.join(`trip:${tripId}`);
        console.log(`[Socket] User ${userId} joined trip:${tripId} room`);

        // Mark messages as read: upsert lastReadAt = now
        await TripReadStatus.upsert({ userId, tripId: tid, lastReadAt: new Date() });
        // Clear the badge on the client immediately
        socket.emit('chat:unread-update', { tripId: tid, count: 0 });
      } catch (err) {
        console.error('[Socket] chat:join error:', err.message);
      }
    });

    // ── Step 8: Event 4 — chat:send — persist message + broadcast to room ─────
    socket.on('chat:send', async ({ tripId, content }, callback) => {
      if (!tripId || !content?.trim()) {
        if (typeof callback === 'function') callback({ success: false, error: 'tripId and content are required.' });
        return;
      }
      try {
        const msg  = await TripMessage.create({ tripId: parseInt(tripId), userId, content: content.trim() });
        const user = await User.findByPk(userId, { attributes: ['firstName', 'lastName'] });
        const payload = {
          messageId: msg.id,
          tripId:    parseInt(tripId),
          userId,
          content:   msg.content,
          firstName: user.firstName,
          lastName:  user.lastName,
          createdAt: msg.createdAt
        };
        // Event 5 — chat:message — broadcast to everyone in the room
        io.to(`trip:${tripId}`).emit('chat:message', payload);

        // Notify online trip participants who are NOT currently in the room
        try {
          const [msgTrip, members] = await Promise.all([
            Trip.findByPk(parseInt(tripId), { attributes: ['id', 'userId'] }),
            TripMember.findAll({ where: { tripId: parseInt(tripId), status: 'approved' }, attributes: ['userId'] })
          ]);
          if (msgTrip) {
            const participantIds = [...new Set([msgTrip.userId, ...members.map(m => m.userId)])];
            const room = io.sockets.adapter.rooms.get(`trip:${tripId}`) ?? new Set();
            for (const pid of participantIds) {
              if (pid === userId) continue;       // skip sender
              const sid = getUserSocketId(pid);
              if (!sid || room.has(sid)) continue; // offline or actively reading
              const readStatus = await TripReadStatus.findOne({ where: { userId: pid, tripId: parseInt(tripId) } });
              const lastReadAt = readStatus?.lastReadAt ?? new Date(0);
              const count = await TripMessage.count({
                where: { tripId: parseInt(tripId), userId: { [Op.ne]: pid }, createdAt: { [Op.gt]: lastReadAt } }
              });
              io.to(sid).emit('chat:unread-update', { tripId: parseInt(tripId), count });
            }
          }
        } catch (_) { /* non-critical — badge update failure should not affect the send */ }

        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        console.error('[Socket] chat:send error:', err.message);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // ── Step 8: Event 6 — chat:history — fetch stored messages for a room ─────
    socket.on('chat:history', async ({ tripId }, callback) => {
      if (!tripId || typeof callback !== 'function') return;
      try {
        // Membership check before serving history
        const tid = parseInt(tripId);
        const trip = await Trip.findByPk(tid, { attributes: ['id', 'userId'] });
        if (!trip) return callback({ messages: [] });
        if (trip.userId !== userId) {
          const mem = await TripMember.findOne({ where: { tripId: tid, userId, status: 'approved' } });
          if (!mem) return callback({ messages: [] });
        }

        const messages = await TripMessage.findAll({
          where:   { tripId: parseInt(tripId) },
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
          order:   [['createdAt', 'ASC']],
          limit:   100
        });
        callback({
          messages: messages.map(m => ({
            messageId: m.id,
            tripId:    m.tripId,
            userId:    m.userId,
            content:   m.content,
            firstName: m.User.firstName,
            lastName:  m.User.lastName,
            createdAt: m.createdAt
          }))
        });
      } catch (err) {
        callback({ messages: [] });
      }
    });

    // ── Disconnect — Step 7: broadcast user:offline to online friends ──────────
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      socketUsers.delete(socket.id);
      console.log(`[Socket] User ${userId} disconnected`);
      await notifyFriends(userId, 'user:offline', { userId });
    });
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
}

// ── Exports ───────────────────────────────────────────────────────────────────
const getIO            = ()       => _io;
const getOnlineUsers   = ()       => onlineUsers;
const getUserSocketId  = (userId) => onlineUsers.get(userId);

module.exports = { initSocket, getIO, getOnlineUsers, getUserSocketId };
