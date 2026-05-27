const resortLocations = require("../models/resortLocations");
const resorts = require("../models/resorts");

// GET /resort-locations
const getAllLocations = (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: resortLocations, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resort-locations/:id
const getLocationById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const location = resortLocations.find((l) => l.locationId === id);

    if (!location) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Resort location with id ${id} not found.`,
          details: {}
        }
      });
    }

    return res.status(200).json({ success: true, data: location, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resorts/:id/locations  (supports ?type= filter)
const getLocationsByResortId = (req, res, next) => {
  try {
    const resortId = parseInt(req.params.id);

    const resortExists = resorts.find((r) => r.resortId === resortId);
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

    let result = resortLocations.filter((l) => l.resortId === resortId);

    const { type } = req.query;
    if (type) {
      result = result.filter((l) => l.type.toLowerCase() === type.toLowerCase());
    }

    return res.status(200).json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
};

// POST /resort-locations
const createLocation = (req, res, next) => {
  try {
    const { resortId, name, type, description } = req.body;

    // Validate required fields
    const requiredFields = ["resortId", "name", "type"];
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

    const newId = Math.max(...resortLocations.map((l) => l.locationId), 0) + 1;

    const newLocation = {
      locationId: newId,
      resortId: parseInt(resortId),
      name,
      type,
      description: description || null
    };

    resortLocations.push(newLocation);

    return res.status(201).json({ success: true, data: { locationId: newId }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /resort-locations/:id
const updateLocation = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const locationIndex = resortLocations.findIndex((l) => l.locationId === id);

    if (locationIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Resort location with id ${id} not found.`,
          details: {}
        }
      });
    }

    const { resortId, name, type, description } = req.body;

    // Validate required fields
    const requiredFields = ["resortId", "name", "type"];
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

    resortLocations[locationIndex] = {
      ...resortLocations[locationIndex],
      resortId: parseInt(resortId),
      name,
      type,
      description: description !== undefined ? description : resortLocations[locationIndex].description
    };

    return res.status(200).json({ success: true, data: { locationId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /resort-locations/:id
const deleteLocation = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const locationIndex = resortLocations.findIndex((l) => l.locationId === id);

    if (locationIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `Resort location with id ${id} not found.`,
          details: {}
        }
      });
    }

    resortLocations.splice(locationIndex, 1);

    return res.status(200).json({ success: true, data: { locationId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  getLocationsByResortId,
  createLocation,
  updateLocation,
  deleteLocation
};
