const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllTrips,
  getTripById,
  getTripsByUserId,
  createTrip,
  updateTrip,
  deleteTrip
} = require("../controllers/tripController");

// GET /trips              → admin, manager only (global list is sensitive)
router.get("/", auth(["admin", "manager"]), getAllTrips);

// GET /trips/:id          → all roles
router.get("/:id", getTripById);

// POST /trips             → user, admin, manager
router.post("/", auth(["user","admin", "manager"]), createTrip);

// PUT /trips/:id          → user, admin, manager
router.put("/:id", auth(["user", "admin", "manager"]), updateTrip);

// DELETE /trips/:id       → admin only
router.delete("/:id", auth(["admin"]), deleteTrip);

module.exports = router;
