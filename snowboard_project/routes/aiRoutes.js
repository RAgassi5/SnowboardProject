const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const {
  getResortSummary,
  recommendResorts,
  gearRecommendation,
  resortAssistant
} = require("../controllers/aiController");

// POST /resort-summary       — no role restriction, accessible to all
router.post("/resort-summary", getResortSummary);

// POST /recommend-resorts    — requires x-user-role (any valid role)
router.post("/recommend-resorts", auth(["admin", "manager", "user"]), recommendResorts);

// POST /gear-recommendation  — requires x-user-role (any valid role)
router.post("/gear-recommendation", auth(["admin", "manager", "user"]), gearRecommendation);

// POST /resort-assistant     — requires x-user-role (any valid role)
router.post("/resort-assistant", auth(["admin", "manager", "user"]), resortAssistant);

module.exports = router;
