const express = require("express");
const router = express.Router();
const { getResortSummary } = require("../controllers/aiController");

// POST /resort-summary — no role restriction, accessible to all
router.post("/resort-summary", getResortSummary);

module.exports = router;
