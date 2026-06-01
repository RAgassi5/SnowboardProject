const users = require("../models/users");

// GET /users
const getAllUsers = (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: users, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id
const getUserById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = users.find((u) => u.userId === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${id} not found.`,
          details: {}
        }
      });
    }

    return res.status(200).json({ success: true, data: user, error: null });
  } catch (err) {
    next(err);
  }
};

// POST /users
const createUser = (req, res, next) => {
  try {
    const { firstName, lastName, userRole } = req.body;

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "userRole"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `${field} is required.`,
            details: { field }
          }
        });
      }
    }

    const newId = Math.max(...users.map((u) => u.userId), 0) + 1;
    const now = new Date().toISOString();

    const newUser = {
      userId: newId,
      firstName,
      lastName,
      createDate: now,
      updateDate: now,
      userRole
    };

    users.push(newUser);

    return res.status(201).json({ success: true, data: { userId: newId }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id
const updateUser = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.userId === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${id} not found.`,
          details: {}
        }
      });
    }

    const { firstName, lastName, userRole } = req.body;

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "userRole"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `${field} is required.`,
            details: { field }
          }
        });
      }
    }

    users[userIndex] = {
      ...users[userIndex],
      firstName,
      lastName,
      userRole,
      updateDate: new Date().toISOString()
    };

    return res.status(200).json({ success: true, data: { userId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:id
const deleteUser = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.userId === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${id} not found.`,
          details: {}
        }
      });
    }

    users.splice(userIndex, 1);

    return res.status(200).json({ success: true, data: { userId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
