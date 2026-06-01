const trips = require("../models/trips");
const users = require("../models/users");
const resorts = require("../models/resorts");

// GET /trips
const getAllTrips = (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: trips, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /trips/:id
const getTripById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const trip = trips.find((t) => t.tripId === id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Trip with id ${id} not found.`,
          details: {}
        }
      });
    }

    return res.status(200).json({ success: true, data: trip, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id/trips
const getTripsByUserId = (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const userExists = users.find((u) => u.userId === userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${userId} not found.`,
          details: {}
        }
      });
    }

    const userTrips = trips.filter((t) => t.userId === userId);
    return res.status(200).json({ success: true, data: userTrips, error: null });
  } catch (err) {
    next(err);
  }
};

// POST /trips
const createTrip = (req, res, next) => {
  try {
    const { userId, resortId, startDate, endDate } = req.body;

    // Validate required fields
    const requiredFields = ["userId", "resortId", "startDate", "endDate"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `${field} is required.`,
            details: { field }
          }
        });
      }
    }

    // Validate date formats
    if (isNaN(new Date(startDate))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "startDate must be a valid ISO date.",
          details: { field: "startDate" }
        }
      });
    }

    if (isNaN(new Date(endDate))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "endDate must be a valid ISO date.",
          details: { field: "endDate" }
        }
      });
    }

    // Validate startDate is strictly before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "startDate must be before endDate.",
          details: { fields: ["startDate", "endDate"] }
        }
      });
    }

    // Validate userId exists
    const userExists = users.find((u) => u.userId === parseInt(userId));
    if (!userExists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${userId} not found.`,
          details: {}
        }
      });
    }

    // Validate resortId exists
    const resortExists = resorts.find((r) => r.resortId === parseInt(resortId));
    if (!resortExists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Resort with id ${resortId} not found.`,
          details: {}
        }
      });
    }

    const newId = Math.max(...trips.map((t) => t.tripId), 0) + 1;

    const newTrip = {
      tripId: newId,
      userId: parseInt(userId),
      resortId: parseInt(resortId),
      startDate,
      endDate
    };

    trips.push(newTrip);

    return res.status(201).json({ success: true, data: { tripId: newId }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /trips/:id
const updateTrip = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const tripIndex = trips.findIndex((t) => t.tripId === id);

    if (tripIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Trip with id ${id} not found.`,
          details: {}
        }
      });
    }

    const { userId, resortId, startDate, endDate } = req.body;

    // Validate required fields
    const requiredFields = ["userId", "resortId", "startDate", "endDate"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: `${field} is required.`,
            details: { field }
          }
        });
      }
    }

    // Validate date formats
    if (isNaN(new Date(startDate))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "startDate must be a valid ISO date.",
          details: { field: "startDate" }
        }
      });
    }

    if (isNaN(new Date(endDate))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "endDate must be a valid ISO date.",
          details: { field: "endDate" }
        }
      });
    }

    // Validate startDate is strictly before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "startDate must be before endDate.",
          details: { fields: ["startDate", "endDate"] }
        }
      });
    }

    // Validate userId exists
    const userExists = users.find((u) => u.userId === parseInt(userId));
    if (!userExists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `User with id ${userId} not found.`,
          details: {}
        }
      });
    }

    // Validate resortId exists
    const resortExists = resorts.find((r) => r.resortId === parseInt(resortId));
    if (!resortExists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Resort with id ${resortId} not found.`,
          details: {}
        }
      });
    }

    trips[tripIndex] = {
      ...trips[tripIndex],
      userId: parseInt(userId),
      resortId: parseInt(resortId),
      startDate,
      endDate
    };

    return res.status(200).json({ success: true, data: { tripId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /trips/:id
// - admin / manager → delete any trip
// - user            → only if trip.userId === x-user-id header
const deleteTrip = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const tripIndex = trips.findIndex((t) => t.tripId === id);

    if (tripIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Trip with id ${id} not found.`,
          details: {}
        }
      });
    }

    const role   = req.headers["x-user-role"];
    const userId = parseInt(req.headers["x-user-id"]);

    // Regular users may only delete their own trips
    if (role === "user") {
      if (isNaN(userId) || trips[tripIndex].userId !== userId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: {
            code: "FORBIDDEN",
            message: "You can only delete trips that you created.",
            details: {}
          }
        });
      }
    }

    trips.splice(tripIndex, 1);

    return res.status(200).json({ success: true, data: { tripId: id }, error: null });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getAllTrips,
  getTripById,
  getTripsByUserId,
  createTrip,
  updateTrip,
  deleteTrip
};
