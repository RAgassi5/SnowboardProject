'use strict';
const { User } = require('../db');
const { VALID_SKILL_LEVELS } = require('../constants/skillLevels');

const VALID_SPORT_TYPES = ['ski', 'snowboard'];

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, sportType, skillLevel } = req.body;

    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'sportType', 'skillLevel'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    if (!VALID_SPORT_TYPES.includes(sportType)) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: `sportType must be one of: ${VALID_SPORT_TYPES.join(', ')}.`, details: { field: 'sportType' } }
      });
    }

    const skillLevelInt = parseInt(skillLevel);
    if (!Number.isInteger(skillLevelInt) || !VALID_SKILL_LEVELS.includes(skillLevelInt)) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'skillLevel must be an integer between 1 and 5. (1=First-Timer, 2=Novice, 3=Intermediate, 4=Expert, 5=Pro/Freeride)', details: { field: 'skillLevel' } }
      });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'A user with this email already exists.', details: { field: 'email' } }
      });
    }

    const user = await User.create({
      firstName, lastName,
      email: email.toLowerCase(),
      password,
      sportType,
      skillLevel: skillLevelInt,
      userRole: 'user'
    });

    return res.status(201).json({
      success: true,
      data: { message: 'Registration successful.', user: fmtUser(user) },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'email is required.', details: { field: 'email' } }
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'password is required.', details: { field: 'password' } }
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || user.password !== password) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email or password.', details: {} }
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Login successful.', user: fmtUser(user) },
      error: null
    });
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

module.exports = { register, login };
