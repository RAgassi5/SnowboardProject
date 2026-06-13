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
const { discoverTrips, joinTrip, getTripMembers, inviteFriend } = require("../controllers/tripMemberController");

const ANY = ["user", "manager", "admin"];

// GET /trips/discover     → any authenticated user (must be before /:id)
router.get("/discover", auth(ANY), discoverTrips);

// GET /trips              → admin, manager only (global list is sensitive)
router.get("/", auth(["admin", "manager"]), getAllTrips);

// GET /trips/:id          → all roles
router.get("/:id", getTripById);

// GET /trips/:id/members  → any authenticated user
router.get("/:id/members", auth(ANY), getTripMembers);

// POST /trips/:id/join    → any authenticated user
router.post("/:id/join", auth(ANY), joinTrip);

// POST /trips/:id/invite  → any authenticated user (creator-only enforced in controller)
router.post("/:id/invite", auth(ANY), inviteFriend);

// POST /trips             → user, admin, manager
router.post("/", auth(["user","admin", "manager"]), createTrip);

// PUT /trips/:id          → user, admin, manager
router.put("/:id", auth(["user", "admin", "manager"]), updateTrip);

// DELETE /trips/:id → admin/manager can delete any; user can delete own only (enforced in controller)
router.delete("/:id", auth(["user", "admin", "manager"]), deleteTrip);

module.exports = router;
