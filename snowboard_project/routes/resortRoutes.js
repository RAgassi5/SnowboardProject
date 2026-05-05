const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllResorts,
  getResortById,
  createResort,
  updateResort,
  deleteResort
} = require("../controllers/resortController");

const {
  getLocationsByResortId
} = require("../controllers/resortLocationController");

// GET /resorts            → all roles; supports ?country= and ?difficultyLevel=
router.get("/", getAllResorts);

// GET /resorts/:id        → all roles
router.get("/:id", getResortById);

// GET /resorts/:id/locations  → all roles; supports ?type= filter
router.get("/:id/locations", getLocationsByResortId);

// POST /resorts           → admin, manager only
router.post("/", auth(["admin", "manager"]), createResort);

// PUT /resorts/:id        → admin, manager only
router.put("/:id", auth(["admin", "manager"]), updateResort);

// DELETE /resorts/:id     → admin only
router.delete("/:id", auth(["admin"]), deleteResort);

module.exports = router;
