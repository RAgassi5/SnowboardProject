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

// GET /trips              → all roles
router.get("/", getAllTrips);

// GET /trips/:id          → all roles
router.get("/:id", getTripById);

// POST /trips             → admin, manager only
router.post("/", auth(["admin", "manager"]), createTrip);

// PUT /trips/:id          → admin, manager only
router.put("/:id", auth(["admin", "manager"]), updateTrip);

// DELETE /trips/:id       → admin only
router.delete("/:id", auth(["admin"]), deleteTrip);

module.exports = router;
