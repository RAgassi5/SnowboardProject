'use strict';
const { Resort } = require('../db');

// GET /resorts  (supports ?country= and ?difficultyLevel= filters)
const getAllResorts = async (req, res, next) => {
  try {
    let results = await Resort.findAll();

    const { country, difficultyLevel } = req.query;

    if (country) {
      results = results.filter(r => r.country.toLowerCase() === country.toLowerCase());
    }

    if (difficultyLevel) {
      results = results.filter(r => r.difficultyLevel === parseInt(difficultyLevel));
    }

    return res.status(200).json({ success: true, data: results.map(fmtResort), error: null });
  } catch (err) {
    next(err);
  }
};

// GET /resorts/:id
const getResortById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const resort = await Resort.findByPk(id);

    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${id} not found.`, details: {} }
      });
    }

    return res.status(200).json({ success: true, data: fmtResort(resort), error: null });
  } catch (err) {
    next(err);
  }
};

// POST /resorts
const createResort = async (req, res, next) => {
  try {
    const { name, country, elevation, terrainType, difficultyLevel, snowboardFriendly, latitude, longitude } = req.body;

    const requiredFields = ['name', 'country', 'difficultyLevel'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    const resort = await Resort.create({
      name, country,
      elevation:        elevation        != null ? elevation        : null,
      terrainType:      terrainType      != null ? terrainType      : null,
      difficultyLevel:  parseInt(difficultyLevel),
      snowboardFriendly: snowboardFriendly != null ? Boolean(snowboardFriendly) : true,
      latitude:         latitude         != null ? parseFloat(latitude)  : null,
      longitude:        longitude        != null ? parseFloat(longitude) : null
    });

    return res.status(201).json({ success: true, data: { resortId: resort.id }, error: null });
  } catch (err) {
    next(err);
  }
};

// PUT /resorts/:id
const updateResort = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const resort = await Resort.findByPk(id);

    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${id} not found.`, details: {} }
      });
    }

    const { name, country, elevation, terrainType, difficultyLevel, snowboardFriendly, latitude, longitude } = req.body;

    const requiredFields = ['name', 'country', 'difficultyLevel'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false, data: null,
          error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } }
        });
      }
    }

    await resort.update({
      name, country,
      elevation:         elevation        !== undefined ? elevation        : resort.elevation,
      terrainType:       terrainType      !== undefined ? terrainType      : resort.terrainType,
      difficultyLevel:   parseInt(difficultyLevel),
      snowboardFriendly: snowboardFriendly !== undefined ? Boolean(snowboardFriendly) : resort.snowboardFriendly,
      latitude:          latitude         !== undefined ? (latitude != null ? parseFloat(latitude) : null)   : resort.latitude,
      longitude:         longitude        !== undefined ? (longitude != null ? parseFloat(longitude) : null) : resort.longitude
    });

    return res.status(200).json({ success: true, data: { resortId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

// DELETE /resorts/:id
const deleteResort = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const resort = await Resort.findByPk(id);

    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort with id ${id} not found.`, details: {} }
      });
    }

    await resort.destroy();
    return res.status(200).json({ success: true, data: { resortId: id }, error: null });
  } catch (err) {
    next(err);
  }
};

function fmtResort(r) {
  return {
    resortId:          r.id,
    name:              r.name,
    country:           r.country,
    elevation:         r.elevation,
    terrainType:       r.terrainType,
    difficultyLevel:   r.difficultyLevel,
    snowboardFriendly: r.snowboardFriendly,
    latitude:          r.latitude  != null ? parseFloat(r.latitude)  : null,
    longitude:         r.longitude != null ? parseFloat(r.longitude) : null
  };
}


// ── Weather helpers ────────────────────────────────────────────────────────────

const OM_DAILY = "temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_sum,wind_speed_10m_max";
const FORECAST_HORIZON = 16; // Open-Meteo free-tier max forecast days

function pad(n) { return String(n).padStart(2, '0'); }

function avg(arr) {
  const valid = arr.filter(v => v != null);
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
}

function round1(v) { return v != null ? Math.round(v * 10) / 10 : null; }

function mapDays({ time, temperature_2m_max, temperature_2m_min, snowfall_sum, precipitation_sum, wind_speed_10m_max }) {
  return time.map((date, i) => ({
    date,
    tempMax:       temperature_2m_max[i],
    tempMin:       temperature_2m_min[i],
    snowfall:      snowfall_sum[i],
    precipitation: precipitation_sum[i],
    windMax:       wind_speed_10m_max[i],
  }));
}

function computeSummary(days) {
  return {
    avgTempMax:         round1(avg(days.map(d => d.tempMax))),
    avgTempMin:         round1(avg(days.map(d => d.tempMin))),
    totalSnowfall:      round1(days.reduce((s, d) => s + (d.snowfall ?? 0), 0)),
    totalPrecipitation: round1(days.reduce((s, d) => s + (d.precipitation ?? 0), 0)),
    avgWindMax:         round1(avg(days.map(d => d.windMax))),
  };
}

async function fetchForecast(resort, startDate, endDate, forecastDays = 7, signal) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  resort.latitude);
  url.searchParams.set("longitude", resort.longitude);
  url.searchParams.set("daily",     OM_DAILY);
  url.searchParams.set("timezone",  "auto");
  if (startDate && endDate) {
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date",   endDate);
  } else {
    url.searchParams.set("forecast_days", forecastDays);
  }
  const r = await fetch(url.toString(), { signal });
  if (!r.ok) throw new Error(`Open-Meteo Forecast error: ${r.status}`);
  return mapDays((await r.json()).daily);
}

async function fetchHistorical(resort, startDate, endDate, signal) {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude",   resort.latitude);
  url.searchParams.set("longitude",  resort.longitude);
  url.searchParams.set("daily",      OM_DAILY);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date",   endDate);
  url.searchParams.set("timezone",   "auto");
  let r = await fetch(url.toString(), { signal });
  if (r.status === 429) {
    // Transient rate-limit — Open-Meteo's archive API briefly throttles bursts; one retry clears it.
    await new Promise(resolve => setTimeout(resolve, 400));
    r = await fetch(url.toString(), { signal });
  }
  if (!r.ok) throw new Error(`Open-Meteo Archive error: ${r.status}`);
  return mapDays((await r.json()).daily);
}

async function fetchTypical(resort, startDate, endDate, signal) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const historicalYears = await Promise.all(
    [-3, -2, -1].map(offset => fetchHistorical(resort,
      `${s.getFullYear() + offset}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
      `${e.getFullYear() + offset}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`,
      signal
    ))
  );
  const dayCount = historicalYears[0].length;
  return Array.from({ length: dayCount }, (_, i) => {
    const targetDate = new Date(s);
    targetDate.setDate(targetDate.getDate() + i);
    const slice = historicalYears.map(yr => yr[i]).filter(Boolean);
    return {
      date:          targetDate.toISOString().split('T')[0],
      tempMax:       round1(avg(slice.map(d => d.tempMax))),
      tempMin:       round1(avg(slice.map(d => d.tempMin))),
      snowfall:      round1(avg(slice.map(d => d.snowfall))),
      precipitation: round1(avg(slice.map(d => d.precipitation))),
      windMax:       round1(avg(slice.map(d => d.windMax))),
    };
  });
}

// GET /resorts/:id/forecast
const getWeatherForecast = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const resort = await Resort.findByPk(id);

    if (!resort) {
      return res.status(404).json({
        success: false, data: null,
        error: { code: 'NOT_FOUND', message: `Resort ${id} not found.`, details: {} }
      });
    }

    // Normalize DECIMAL strings from MySQL to floats before passing to weather helpers
    const lat = resort.latitude  != null ? parseFloat(resort.latitude)  : null;
    const lng = resort.longitude != null ? parseFloat(resort.longitude) : null;

    if (lat == null || lng == null) {
      return res.status(422).json({
        success: false, data: null,
        error: { code: 'NO_COORDINATES', message: `Resort "${resort.name}" has no coordinates.`, details: {} }
      });
    }

    const resortForWeather = { name: resort.name, latitude: lat, longitude: lng };

    const { startDate, endDate } = req.query;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({
        success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Provide both startDate and endDate, or neither.', details: {} }
      });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizonDate = new Date(today); horizonDate.setDate(today.getDate() + FORECAST_HORIZON);

    let mode, label, confidence, days, partialForecast = false;

    if (!startDate) {
      mode = 'forecast'; label = '7-day forecast'; confidence = 'high';
      days = await fetchForecast(resortForWeather, null, null, 7);
    } else {
      const s = new Date(startDate), e = new Date(endDate);

      if (e < today) {
        mode = 'historical'; label = 'Weather during your trip'; confidence = 'medium';
        days = await fetchHistorical(resortForWeather, startDate, endDate);
      } else if (s <= horizonDate) {
        mode = 'forecast'; label = 'Forecast for your trip'; confidence = 'high';
        if (e > horizonDate) {
          partialForecast = true;
          days = await fetchForecast(resortForWeather, startDate, horizonDate.toISOString().split('T')[0]);
        } else {
          days = await fetchForecast(resortForWeather, startDate, endDate);
        }
      } else {
        const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
        mode = 'typical'; label = `Typical ${month} conditions`; confidence = 'low';
        days = await fetchTypical(resortForWeather, startDate, endDate);
      }
    }

    const data = {
      mode, label, confidence,
      resort: { id: resort.id, name: resort.name, latitude: lat, longitude: lng },
      dateRange: { startDate: days[0]?.date ?? startDate, endDate: days[days.length - 1]?.date ?? endDate },
      days,
      summary: computeSummary(days),
      source: 'Open-Meteo'
    };
    if (partialForecast) data.partialForecast = true;

    return res.status(200).json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllResorts, getResortById, createResort, updateResort, deleteResort, getWeatherForecast,
  fetchForecast, fetchHistorical, fetchTypical, computeSummary, FORECAST_HORIZON
};
