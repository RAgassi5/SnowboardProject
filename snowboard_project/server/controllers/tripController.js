'use strict';
const { Op } = require('sequelize');
const { Trip, User, Resort, TripMember, TripMessage, Friendship, TripReadStatus } = require('../db');

// GET /trips  (admin/manager only)
const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.findAll();
    return res.status(200).json({ success: true, data: trips.map(fmtTrip), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /trips/:id
const getTripById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    // Relational query: JOIN creator and resort in a single DB call
    const trip = await Trip.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Resort }
      ]
    });
    if (!trip) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Trip with id ${id} not found.`, details: {} }
      });
    }

    // Privacy guard: protect private/friends-only trips from unauthorised direct access
    const currentUserId = parseInt(req.headers['x-user-id']);
    if (!isNaN(currentUserId) && trip.userId !== currentUserId) {
      if (trip.privacy === 'private') {
        const mem = await TripMember.findOne({ where: { tripId: id, userId: currentUserId, status: 'approved' } });
        if (!mem) {
          return res.status(403).json({
            success: false, data: null,
            error: { code: 'FORBIDDEN', message: 'This trip is private.', details: {} }
          });
        }
      } else if (trip.privacy === 'friends-only') {
        const [mem, friend] = await Promise.all([
          TripMember.findOne({ where: { tripId: id, userId: currentUserId, status: 'approved' } }),
          Friendship.findOne({ where: { [Op.or]: [
            { user1Id: currentUserId, user2Id: trip.userId },
            { user1Id: trip.userId,   user2Id: currentUserId }
          ]}})
        ]);
        if (!mem && !friend) {
          return res.status(403).json({
            success: false, data: null,
            error: { code: 'FORBIDDEN', message: 'This trip is only visible to friends of the creator.', details: {} }
          });
        }
      }
    }

    return res.status(200).json({ success: true, data: fmtTrip(trip), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/trips
const getTripsByUserId = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${userId} not found.`, details: {} }
      });
    }

    // Relational query: JOIN resort data alongside each trip
    const trips = await Trip.findAll({
      where: { userId },
      include: [{ model: Resort }]
    });

    return res.status(200).json({ success: true, data: trips.map(fmtTrip), error: null });
  } catch (err) {
    next(err);
  }
};

// POST /trips
const createTrip = async (req, res, next) => {
  try {
    const { userId, resortId, startDate, endDate } = req.body;

    const requiredFields = ['userId', 'resortId', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    if (isNaN(new Date(startDate))) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'startDate must be a valid ISO date.', details: { field: 'startDate' } }
      });
    }
    if (isNaN(new Date(endDate))) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'endDate must be a valid ISO date.', details: { field: 'endDate' } }
      });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'startDate must be before endDate.', details: { fields: ['startDate', 'endDate'] } }
      });
    }

    const user = await User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${userId} not found.`, details: {} }
      });
    }

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} }
      });
    }

    const trip = await Trip.create({
      userId:     parseInt(userId),
      resortId:   parseInt(resortId),
      startDate,
      endDate,
      privacy:    req.body.privacy    || 'public',
      maxMembers: req.body.maxMembers || null,
      title:      req.body.title      || null,
      skillLevel: req.body.skillLevel || null,
      sportType:  req.body.sportType  || null
    });

    return res.status(201).json({ success: true, data: { tripId: trip.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /trips/:id
const updateTrip = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Trip with id ${id} not found.`, details: {} }
      });
    }

    const { userId, resortId, startDate, endDate } = req.body;

    const requiredFields = ['userId', 'resortId', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    if (isNaN(new Date(startDate))) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'startDate must be a valid ISO date.', details: { field: 'startDate' } }
      });
    }
    if (isNaN(new Date(endDate))) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'endDate must be a valid ISO date.', details: { field: 'endDate' } }
      });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'startDate must be before endDate.', details: { fields: ['startDate', 'endDate'] } }
      });
    }

    const userExists = await User.findByPk(parseInt(userId));
    if (!userExists) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${userId} not found.`, details: {} }
      });
    }

    const resortExists = await Resort.findByPk(parseInt(resortId));
    if (!resortExists) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} }
      });
    }

    await trip.update({ userId: parseInt(userId), resortId: parseInt(resortId), startDate, endDate });
    return res.status(200).json({ success: true, data: { tripId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /trips/:id
const deleteTrip = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Trip with id ${id} not found.`, details: {} }
      });
    }

    const role   = req.headers['x-user-role'];
    const userId = parseInt(req.headers['x-user-id']);

    if (role !== 'admin') {
      if (isNaN(userId) || trip.userId !== userId) {
        return res.status(403).json({
          success: false, data: null,
          error: { code: 'FORBIDDEN', message: 'Only the trip creator can delete this trip.', details: {} }
        });
      }
    }

    await trip.destroy();
    return res.status(200).json({ success: true, data: { tripId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/unread-counts
const getUnreadCounts = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const [createdTrips, memberships] = await Promise.all([
      Trip.findAll({ where: { userId }, attributes: ['id'] }),
      TripMember.findAll({ where: { userId, status: 'approved' }, attributes: ['tripId'] })
    ]);

    const tripIds = [...new Set([
      ...createdTrips.map(t => t.id),
      ...memberships.map(m => m.tripId)
    ])];

    if (tripIds.length === 0) {
      return res.json({ success: true, data: {}, error: null });
    }

    const readStatuses = await TripReadStatus.findAll({
      where: { userId, tripId: { [Op.in]: tripIds } }
    });
    const lastReadMap = new Map(readStatuses.map(r => [r.tripId, r.lastReadAt]));

    const result = {};
    await Promise.all(tripIds.map(async (tid) => {
      const lastReadAt = lastReadMap.get(tid) ?? new Date(0);
      result[tid] = await TripMessage.count({
        where: { tripId: tid, userId: { [Op.ne]: userId }, createdAt: { [Op.gt]: lastReadAt } }
      });
    }));

    return res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
};

function fmtTrip(t) {
  return {
    tripId:     t.id,
    userId:     t.userId,
    resortId:   t.resortId,
    startDate:  t.startDate,
    endDate:    t.endDate,
    title:      t.title      ?? null,
    skillLevel: t.skillLevel ?? null,
    sportType:  t.sportType  ?? null,
    privacy:    t.privacy,
    maxMembers: t.maxMembers ?? null
  };
}

module.exports = { getAllTrips, getTripById, getTripsByUserId, createTrip, updateTrip, deleteTrip, getUnreadCounts };
