const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const {
  getResortSummary,
  recommendResorts,
  gearRecommendation,
  resortAssistant,
  gearChat,
  getGearChat,
  resetGearChat,
} = require("../controllers/aiController");

// POST /resort-summary       — no role restriction, accessible to all
router.post("/resort-summary", getResortSummary);

// POST /recommend-resorts    — requires x-user-role (any valid role)
router.post("/recommend-resorts", auth(["admin", "manager", "user"]), recommendResorts);

// POST /gear-recommendation  — requires x-user-role (any valid role)
router.post("/gear-recommendation", auth(["admin", "manager", "user"]), gearRecommendation);

// POST /resort-assistant     — requires x-user-role (any valid role)
router.post("/resort-assistant", auth(["admin", "manager", "user"]), resortAssistant);

// GET /gear-chat/:tripId     — fetch persisted conversation history for user+trip
router.get("/gear-chat/:tripId", auth(["admin", "manager", "user"]), getGearChat);

// DELETE /gear-chat/:tripId  — clear conversation history for user+trip
router.delete("/gear-chat/:tripId", auth(["admin", "manager", "user"]), resetGearChat);

// POST /gear-chat            — multi-turn AI gear advisor conversation (saves to DB)
router.post("/gear-chat", auth(["admin", "manager", "user"]), gearChat);

module.exports = router;
