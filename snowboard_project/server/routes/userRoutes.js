const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");
const { getTripsByUserId, getUnreadCounts } = require("../controllers/tripController");
const {
  searchUsers,
  getReceivedRequests,
  getSentRequests,
  getFriends
} = require("../controllers/friendController");
const { getJoinedTrips, getUserInvitations } = require("../controllers/tripMemberController");

const ANY = ["user", "manager", "admin"];

// GET /users             → admin, manager only
router.get("/", auth(["admin", "manager"]), getAllUsers);

// GET /users/search?q=  → any authenticated user (must be before /:id)
router.get("/search", auth(ANY), searchUsers);

// GET /users/:id/trips   → all roles
router.get("/:id/trips", getTripsByUserId);

// GET /users/:id/friend-requests/received  → any authenticated user
router.get("/:id/friend-requests/received", auth(ANY), getReceivedRequests);

// GET /users/:id/friend-requests/sent  → any authenticated user
router.get("/:id/friend-requests/sent", auth(ANY), getSentRequests);

// GET /users/:id/friends  → any authenticated user
router.get("/:id/friends", auth(ANY), getFriends);

// GET /users/:id/joined-trips → any authenticated user
router.get("/:id/joined-trips", auth(ANY), getJoinedTrips);

// GET /users/:id/invitations  → any authenticated user
router.get("/:id/invitations", auth(ANY), getUserInvitations);

// GET /users/:id/unread-counts → any authenticated user
router.get("/:id/unread-counts", auth(ANY), getUnreadCounts);

// GET /users/:id         → admin, manager only
router.get("/:id", auth(["admin", "manager"]), getUserById);

// POST /users            → admin, manager only
router.post("/", auth(["admin", "manager"]), createUser);

// PUT /users/:id         → any authenticated user (ownership enforced in controller)
router.put("/:id", auth(ANY), updateUser);

// DELETE /users/:id      → admin only
router.delete("/:id", auth(["admin"]), deleteUser);

module.exports = router;
