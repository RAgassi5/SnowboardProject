'use strict';
const { User } = require('../db');

// GET /users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    return res.status(200).json({ success: true, data: users.map(fmtUser), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id
const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${id} not found.`, details: {} }
      });
    }
    return res.status(200).json({ success: true, data: fmtUser(user), error: null });
  } catch (err) {
    next(err);
  }
};

// POST /users  (admin/manager panel)
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, userRole } = req.body;

    const requiredFields = ['firstName', 'lastName', 'userRole'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    const user = await User.create({ firstName, lastName, userRole });
    return res.status(201).json({ success: true, data: { userId: user.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id
const updateUser = async (req, res, next) => {
  try {
    const id         = parseInt(req.params.id);
    const callerId   = parseInt(req.headers['x-user-id']);
    const callerRole = req.headers['x-user-role'];

    // Regular users may only update their own record
    if (callerRole === 'user' && callerId !== id) {
      return res.status(403).json({
        success: false, data: null,
        error: { code: 'FORBIDDEN', message: 'You can only update your own profile.', details: {} }
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${id} not found.`, details: {} }
      });
    }

    const { firstName, lastName, userRole, sportType, skillLevel } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'firstName and lastName are required.', details: {} }
      });
    }

    const updates = { firstName, lastName };

    if (sportType  !== undefined) updates.sportType  = sportType;
    if (skillLevel !== undefined) updates.skillLevel = parseInt(skillLevel);

    // Only admin/manager may change userRole
    if (userRole !== undefined && (callerRole === 'admin' || callerRole === 'manager')) {
      updates.userRole = userRole;
    }

    await user.update(updates);
    return res.status(200).json({ success: true, data: { userId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:id
const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `User with id ${id} not found.`, details: {} }
      });
    }
    await user.destroy();
    return res.status(200).json({ success: true, data: { userId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

function fmtUser(u) {
  return {
    userId:     u.id,
    firstName:  u.firstName,
    lastName:   u.lastName,
    email:      u.email,
    sportType:  u.sportType,
    skillLevel: u.skillLevel,
    userRole:   u.userRole,
    createDate: u.createdAt,
    updateDate: u.updatedAt
  };
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
