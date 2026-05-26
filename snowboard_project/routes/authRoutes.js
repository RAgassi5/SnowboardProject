const express = require("express");
const router  = express.Router();
const { register, login } = require("../controllers/authController");

// POST /auth/register  — no role restriction, accessible to all
router.post("/register", register);

// POST /auth/login     — no role restriction, accessible to all
router.post("/login", login);

module.exports = router;
