const resorts = require("../models/resorts");

// GET /resorts  (supports ?country= and ?difficultyLevel= filters)
const getAllResorts = (req, res, next) => {
  try {
    let result = [...resorts];

    const { country, difficultyLevel } = req.query;

    if (country) {
      result = result.filter(
        (r) => r.country.toLowerCase() === country.toLowerCase()
      );
    }

    if (difficultyLevel) {
      result = result.filter(
        (r) => r.difficultyLevel === parseInt(difficultyLevel)
      );
    }

    return res.status(200).json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resorts/:id
const getResortById = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

// POST /resorts
const createResort = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

// PUT /resorts/:id
const updateResort = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

// DELETE /resorts/:id
const deleteResort = (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};


// GET /resorts/:id/forecast
const getWeatherForecast = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const resort = resorts.find((r) => r.resortId === id);

    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: "NOT_FOUND", message: `Resort with id ${id} not found.`, details: {} }
      });
    }

    if (resort.latitude == null || resort.longitude == null) {
      return res.status(422).json({
        success: false, data: null,
        error: { code: "NO_COORDINATES", message: `Resort "${resort.name}" has no coordinates.`, details: {} }
      });
    }

    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.searchParams.set("latitude",  resort.latitude);
    url.searchParams.set("longitude", resort.longitude);
    url.searchParams.set("daily",     "temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_sum,wind_speed_10m_max");
    url.searchParams.set("past_days", "5");
    url.searchParams.set("timezone",  "auto");

    const omRes = await fetch(url.toString());
    if (!omRes.ok) {
      throw new Error(`Open-Meteo error: ${omRes.status} ${omRes.statusText}`);
    }
    const omData = await omRes.json();

    const { time, temperature_2m_max, temperature_2m_min, snowfall_sum, precipitation_sum, wind_speed_10m_max } = omData.daily;

    const forecast = time.map((date, i) => ({
      date,
      temperatureMax:  temperature_2m_max[i],
      temperatureMin:  temperature_2m_min[i],
      snowfall:        snowfall_sum[i],
      precipitation:   precipitation_sum[i],
      windSpeed:       wind_speed_10m_max[i],
    }));

    return res.status(200).json({
      success: true,
      data: { resortId: resort.resortId, resortName: resort.name, forecast },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllResorts, getResortById, createResort, updateResort, deleteResort, getWeatherForecast };
