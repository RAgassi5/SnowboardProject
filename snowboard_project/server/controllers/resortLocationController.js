'use strict';
const { ResortLocation, Resort } = require('../db');

// GET /resort-locations  (admin/manager only)
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await ResortLocation.findAll();
    return res.status(200).json({ success: true, data: locations.map(fmtLocation), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resort-locations/:id
const getLocationById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const location = await ResortLocation.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort location with id ${id} not found.`, details: {} }
      });
    }
    return res.status(200).json({ success: true, data: fmtLocation(location), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resorts/:id/locations  (supports ?type= filter)
const getLocationsByResortId = async (req, res, next) => {
  try {
    const resortId = parseInt(req.params.id);

    const resort = await Resort.findByPk(resortId);
    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} }
      });
    }

    const where = { resortId };
    const { type } = req.query;
    if (type) where.type = type.toLowerCase();

    const locations = await ResortLocation.findAll({ where });
    return res.status(200).json({ success: true, data: locations.map(fmtLocation), error: null });
  } catch (err) {
    next(err);
  }
};

// POST /resort-locations
const createLocation = async (req, res, next) => {
  try {
    const { resortId, name, type, description } = req.body;

    const requiredFields = ['resortId', 'name', 'type'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} }
      });
    }

    const location = await ResortLocation.create({
      resortId: parseInt(resortId),
      name,
      type,
      description: description || null
    });

    return res.status(201).json({ success: true, data: { locationId: location.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /resort-locations/:id
const updateLocation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const location = await ResortLocation.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort location with id ${id} not found.`, details: {} }
      });
    }

    const { resortId, name, type, description } = req.body;

    const requiredFields = ['resortId', 'name', 'type'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} }
      });
    }

    await location.update({
      resortId:    parseInt(resortId),
      name,
      type,
      description: description !== undefined ? description : location.description
    });

    return res.status(200).json({ success: true, data: { locationId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /resort-locations/:id
const deleteLocation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const location = await ResortLocation.findByPk(id);
    if (!location) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort location with id ${id} not found.`, details: {} }
      });
    }
    await location.destroy();
    return res.status(200).json({ success: true, data: { locationId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

function fmtLocation(l) {
  return {
    locationId:  l.id,
    resortId:    l.resortId,
    name:        l.name,
    type:        l.type,
    description: l.description ?? null
  };
}

module.exports = { getAllLocations, getLocationById, getLocationsByResortId, createLocation, updateLocation, deleteLocation };
