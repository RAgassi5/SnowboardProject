const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require("../controllers/resortLocationController");

// GET /resort-locations         → all roles
router.get("/", getAllLocations);

// GET /resort-locations/:id     → all roles
router.get("/:id", getLocationById);

// POST /resort-locations        → admin, manager only
router.post("/", auth(["admin", "manager"]), createLocation);

// PUT /resort-locations/:id     → admin, manager only
router.put("/:id", auth(["admin", "manager"]), updateLocation);

// DELETE /resort-locations/:id  → admin only
router.delete("/:id", auth(["admin"]), deleteLocation);

module.exports = router;
