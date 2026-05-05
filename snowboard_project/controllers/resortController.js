const resorts = require("../models/resorts");

// GET /resorts  (supports ?country= and ?difficultyLevel= filters)
const getAllResorts = (req, res) => {
  let result = [...resorts];

  const { country, difficultyLevel } = req.query;

  if (country) {
    result = result.filter(
      (r) => r.country.toLowerCase() === country.toLowerCase()
    );
  }

  if (difficultyLevel) {
    result = result.filter(
      (r) => r.difficultyLevel.toLowerCase() === difficultyLevel.toLowerCase()
    );
  }

  return res.status(200).json({ success: true, data: result, error: null });
};

// GET /resorts/:id
const getResortById = (req, res) => {
  const id = parseInt(req.params.id);
  const resort = resorts.find((r) => r.resortId === id);

  if (!resort) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: `Resort with id ${id} not found.`,
        details: {}
      }
    });
  }

  return res.status(200).json({ success: true, data: resort, error: null });
};

// POST /resorts
const createResort = (req, res) => {
  const { name, country, elevation, terrainType, difficultyLevel, latitude, longitude } = req.body;

  // Validate required fields
  const requiredFields = ["name", "country", "difficultyLevel"];
  for (const field of requiredFields) {
    if (!req.body[field]) {
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

  const newId = Math.max(...resorts.map((r) => r.resortId), 0) + 1;

  const newResort = {
    resortId: newId,
    name,
    country,
    elevation: elevation || null,
    terrainType: terrainType || null,
    difficultyLevel,
    latitude: latitude || null,
    longitude: longitude || null
  };

  resorts.push(newResort);

  return res.status(201).json({ success: true, data: { resortId: newId }, error: null });
};

// PUT /resorts/:id
const updateResort = (req, res) => {
  const id = parseInt(req.params.id);
  const resortIndex = resorts.findIndex((r) => r.resortId === id);

  if (resortIndex === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: `Resort with id ${id} not found.`,
        details: {}
      }
    });
  }

  const { name, country, elevation, terrainType, difficultyLevel, latitude, longitude } = req.body;

  // Validate required fields
  const requiredFields = ["name", "country", "difficultyLevel"];
  for (const field of requiredFields) {
    if (!req.body[field]) {
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

  resorts[resortIndex] = {
    ...resorts[resortIndex],
    name,
    country,
    elevation: elevation !== undefined ? elevation : resorts[resortIndex].elevation,
    terrainType: terrainType !== undefined ? terrainType : resorts[resortIndex].terrainType,
    difficultyLevel,
    latitude: latitude !== undefined ? latitude : resorts[resortIndex].latitude,
    longitude: longitude !== undefined ? longitude : resorts[resortIndex].longitude
  };

  return res.status(200).json({ success: true, data: { resortId: id }, error: null });
};

// DELETE /resorts/:id
const deleteResort = (req, res) => {
  const id = parseInt(req.params.id);
  const resortIndex = resorts.findIndex((r) => r.resortId === id);

  if (resortIndex === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: `Resort with id ${id} not found.`,
        details: {}
      }
    });
  }

  resorts.splice(resortIndex, 1);

  return res.status(200).json({ success: true, data: { resortId: id }, error: null });
};

module.exports = { getAllResorts, getResortById, createResort, updateResort, deleteResort };
