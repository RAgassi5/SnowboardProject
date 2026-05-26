const users = require("../models/users");
const { VALID_SKILL_LEVELS } = require("../models/skillLevels");

const VALID_SPORT_TYPES  = ["ski", "snowboard"];
const VALID_ROLES        = ["admin", "manager", "user"];

// ─── POST /auth/register ───────────────────────────────────────────────────────
const register = (req, res) => {
  const { firstName, lastName, email, password, sportType, skillLevel } = req.body;

  // Validate all required fields are present
  const requiredFields = ["firstName", "lastName", "email", "password", "sportType", "skillLevel"];
  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: "VALIDATION_ERROR", message: `${field} is required.`, details: { field } }
      });
    }
  }

  // Validate sportType
  if (!VALID_SPORT_TYPES.includes(sportType)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `sportType must be one of: ${VALID_SPORT_TYPES.join(", ")}.`,
        details: { field: "sportType" }
      }
    });
  }

  // Validate skillLevel — must be an integer between 1 and 5
  const skillLevelInt = parseInt(skillLevel);
  if (!Number.isInteger(skillLevelInt) || !VALID_SKILL_LEVELS.includes(skillLevelInt)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `skillLevel must be an integer between 1 and 5. (1=First-Timer, 2=Novice, 3=Intermediate, 4=Expert, 5=Pro/Freeride)`,
        details: { field: "skillLevel" }
      }
    });
  }

  // Check for duplicate email
  const existing = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "A user with this email already exists.", details: { field: "email" } }
    });
  }

  const now   = new Date().toISOString();
  const newId = Math.max(...users.map((u) => u.userId), 0) + 1;

  const newUser = {
    userId:     newId,
    firstName,
    lastName,
    email,
    password,        // plain-text for mock only — not for production use
    sportType,
    skillLevel: skillLevelInt,
    createDate: now,
    updateDate: now,
    userRole:   "user"   // default role for self-registration
  };

  users.push(newUser);

  // Never return the password in the response
  const { password: _omit, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    data: { message: "Registration successful.", user: safeUser },
    error: null
  });
};

// ─── POST /auth/login ──────────────────────────────────────────────────────────
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "email is required.", details: { field: "email" } }
    });
  }
  if (!password) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "password is required.", details: { field: "password" } }
    });
  }

  const user = users.find(
    (u) => u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "Invalid email or password.", details: {} }
    });
  }

  // Never return the password
  const { password: _omit, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    data: { message: "Login successful.", user: safeUser },
    error: null
  });
};

module.exports = { register, login };
