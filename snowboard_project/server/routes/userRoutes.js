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
const { getTripsByUserId } = require("../controllers/tripController");

// GET /users             → admin, manager only
router.get("/", auth(["admin", "manager"]), getAllUsers);

// GET /users/:id/trips   → all roles (user can view their own trip history)
router.get("/:id/trips", getTripsByUserId);

// GET /users/:id         → admin, manager only
router.get("/:id", auth(["admin", "manager"]), getUserById);

// POST /users            → admin, manager only
router.post("/", auth(["admin", "manager"]), createUser);

// PUT /users/:id         → admin, manager only
router.put("/:id", auth(["admin", "manager"]), updateUser);

// DELETE /users/:id      → admin only
router.delete("/:id", auth(["admin"]), deleteUser);

module.exports = router;
