'use strict';
const { Resort, ResortLocation, GearChatMessage } = require('../db');
const { VALID_SKILL_LEVELS, SKILL_LEVEL_LABELS, DIFFICULTY_LABELS } = require('../constants/skillLevels');
const { GEAR_MAP }             = require('../constants/gearRecommendations');
const { LOCATION_SUGGESTIONS } = require('../constants/locationSuggestions');
const { chat, chatWithHistory } = require('../utils/llm');

const VALID_SPORT_TYPES = ['ski', 'snowboard'];

const parseAndValidateSkillLevel = (raw) => {
  const n = parseInt(raw);
  if (!Number.isInteger(n) || !VALID_SKILL_LEVELS.includes(n)) return null;
  return n;
};
const validateSportType = (sportType) => VALID_SPORT_TYPES.includes(sportType);

// ── rule-based fallbacks (used when LLM is unavailable) ───────────────────────

function fallbackSummary(resort, skillLevelInt) {
  const diff = resort.difficultyLevel - skillLevelInt;
  if (diff === 0)       return `Perfect match! ${resort.name} is rated Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) — exactly aligned with your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}) ability.`;
  if (diff === 1)       return `Good challenge. ${resort.name} is Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}), one step above your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}).`;
  if (diff >= 2)        return `Not recommended. ${resort.name} is Level ${resort.difficultyLevel} — significantly above your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}).`;
  if (diff === -1)      return `Slightly easy for you. ${resort.name} is Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}), just below your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}).`;
  return `Too easy. ${resort.name} is Level ${resort.difficultyLevel} but your skill level is Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}).`;
}

function fallbackExplanation(resort, skillLevelInt, sportType, startDate, endDate) {
  const diff = resort.difficultyLevel - skillLevelInt;
  const boardFriendly = sportType === 'snowboard' && resort.snowboardFriendly;
  if (diff === 0)       return `${resort.name} in ${resort.country} is a perfect Level ${resort.difficultyLevel} match. ${boardFriendly ? 'Snowboard-friendly with minimal cat-tracks. ' : ''}${resort.terrainType} terrain at ${resort.elevation}m for ${startDate} – ${endDate}.`;
  if (Math.abs(diff) === 1) return `${resort.name} in ${resort.country} (Level ${resort.difficultyLevel}) offers a ${diff > 0 ? 'step up' : 'step down'} from your level. ${resort.terrainType} terrain at ${resort.elevation}m for ${startDate} – ${endDate}.`;
  return `${resort.name} in ${resort.country} (Level ${resort.difficultyLevel}) suits a Level ${skillLevelInt} ${sportType}er. ${resort.terrainType} terrain at ${resort.elevation}m.`;
}

// ── POST /resort-summary ──────────────────────────────────────────────────────
const getResortSummary = async (req, res, next) => {
  try {
    const { resortId, skillLevel } = req.body;

    if (!resortId) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'resortId is required.', details: { field: 'resortId' } } });

    const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
    if (skillLevelInt === null) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'skillLevel must be an integer between 1 and 5.', details: { field: 'skillLevel' } } });

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} } });

    let summary;
    try {
      const system = `You are a concise ski and snowboard trip advisor. Write honest, practical 2–3 sentence resort suitability summaries. Never use filler phrases. Be specific about terrain, skill match, and any snowboarder cat-track warnings.`;
      const user = `Resort: ${resort.name}, ${resort.country}. Elevation: ${resort.elevation}m. Terrain: ${resort.terrainType}. Difficulty: ${resort.difficultyLevel}/5 (${DIFFICULTY_LABELS[resort.difficultyLevel]}). Snowboard-friendly: ${resort.snowboardFriendly ? 'yes' : 'no — flat cat-tracks between sectors'}.
Rider skill level: ${skillLevelInt}/5 (${SKILL_LEVEL_LABELS[skillLevelInt]}).
Write a 2–3 sentence suitability summary. Mention the difficulty match, what they can expect on the mountain, and any relevant warnings.`;
      summary = (await chat(system, user, { maxTokens: 200, temperature: 0.6 })).trim();
    } catch (_) {
      summary = fallbackSummary(resort, skillLevelInt);
    }

    return res.status(200).json({
      success: true,
      data: {
        resortId:              resort.id,
        resortName:            resort.name,
        resortDifficultyLevel: resort.difficultyLevel,
        resortDifficultyLabel: DIFFICULTY_LABELS[resort.difficultyLevel],
        skillLevel:            skillLevelInt,
        skillLevelLabel:       SKILL_LEVEL_LABELS[skillLevelInt],
        summary,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /recommend-resorts ───────────────────────────────────────────────────
const recommendResorts = async (req, res, next) => {
  try {
    const { startDate, endDate, skillLevel, sportType } = req.body;

    const requiredFields = ['startDate', 'endDate', 'skillLevel', 'sportType'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: `${field} is required.`, details: { field } } });
      }
    }
    if (!validateSportType(sportType)) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: `sportType must be one of: ${VALID_SPORT_TYPES.join(', ')}.`, details: { field: 'sportType' } } });

    const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
    if (skillLevelInt === null) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'skillLevel must be an integer between 1 and 5.', details: { field: 'skillLevel' } } });

    const start = new Date(startDate), end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'startDate and endDate must be valid ISO date strings.', details: {} } });
    if (start >= end) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'startDate must be before endDate.', details: {} } });

    // ── Score all resorts (deterministic) ──────────────────────────────────────
    const resorts = await Resort.findAll();
    const maxElev = Math.max(...resorts.map((r) => r.elevation || 0));
    const scored  = resorts.map((r) => {
      const diffPenalty   = Math.abs(r.difficultyLevel - skillLevelInt) * 2.5;
      const elevBonus     = ((r.elevation || 0) / maxElev) * 3;
      const boardBonus    = (sportType === 'snowboard' && r.snowboardFriendly) ? 2 : 0;
      const freerideBonus = (skillLevelInt === 5 && r.terrainType === 'backcountry') ? 3 : 0;
      return { resort: r, score: 10 - diffPenalty + elevBonus + boardBonus + freerideBonus };
    });
    scored.sort((a, b) => b.score - a.score);
    const top3resorts = scored.slice(0, 3).map(s => s.resort);

    // ── LLM: generate explanations for all 3 in one call ──────────────────────
    let explanations = null;
    try {
      const system = `You are a ski and snowboard trip advisor. Return ONLY a valid JSON object with key "explanations" containing an array of exactly 3 strings. Each string is a 2-sentence explanation of why the resort suits the given rider. Be specific, practical, and mention terrain type, elevation, and skill match. Do not use markdown.`;
      const user = `Rider: Level ${skillLevelInt}/5 (${SKILL_LEVEL_LABELS[skillLevelInt]}) ${sportType}er. Trip: ${startDate} to ${endDate}.
Rank the following 3 resorts and explain each:
1. ${top3resorts[0].name} (${top3resorts[0].country}, Level ${top3resorts[0].difficultyLevel}, ${top3resorts[0].elevation}m, ${top3resorts[0].terrainType}${top3resorts[0].snowboardFriendly ? ', snowboard-friendly' : ', has cat-tracks'})
2. ${top3resorts[1].name} (${top3resorts[1].country}, Level ${top3resorts[1].difficultyLevel}, ${top3resorts[1].elevation}m, ${top3resorts[1].terrainType}${top3resorts[1].snowboardFriendly ? ', snowboard-friendly' : ', has cat-tracks'})
3. ${top3resorts[2].name} (${top3resorts[2].country}, Level ${top3resorts[2].difficultyLevel}, ${top3resorts[2].elevation}m, ${top3resorts[2].terrainType}${top3resorts[2].snowboardFriendly ? ', snowboard-friendly' : ', has cat-tracks'})`;
      const raw  = await chat(system, user, { maxTokens: 400, temperature: 0.7, json: true });
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.explanations) && parsed.explanations.length === 3) {
        explanations = parsed.explanations;
      }
    } catch (_) { /* fallback below */ }

    const top3 = top3resorts.map((resort, index) => ({
      rank:              index + 1,
      resortId:          resort.id,
      resortName:        resort.name,
      country:           resort.country,
      difficultyLevel:   resort.difficultyLevel,
      difficultyLabel:   DIFFICULTY_LABELS[resort.difficultyLevel],
      snowboardFriendly: resort.snowboardFriendly,
      explanation:       (explanations && explanations[index])
        ? explanations[index]
        : fallbackExplanation(resort, skillLevelInt, sportType, startDate, endDate),
    }));

    return res.status(200).json({
      success: true,
      data: { startDate, endDate, skillLevel: skillLevelInt, skillLevelLabel: SKILL_LEVEL_LABELS[skillLevelInt], sportType, recommendations: top3 },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /gear-recommendation ─────────────────────────────────────────────────
const gearRecommendation = async (req, res, next) => {
  try {
    const { resortId, skillLevel, sportType } = req.body;

    if (!resortId)  return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'resortId is required.',  details: { field: 'resortId'  } } });
    if (!sportType) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'sportType is required.', details: { field: 'sportType' } } });
    if (!validateSportType(sportType)) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: `sportType must be one of: ${VALID_SPORT_TYPES.join(', ')}.`, details: { field: 'sportType' } } });

    const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
    if (skillLevelInt === null) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'skillLevel must be an integer between 1 and 5.', details: { field: 'skillLevel' } } });

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} } });

    let suggestedGear = GEAR_MAP[sportType][skillLevelInt]; // fallback
    let warning       = (sportType === 'snowboard' && !resort.snowboardFriendly)
      ? `Note: ${resort.name} has long flat cat-tracks between sectors which can be challenging for snowboarders.`
      : null;
    let aiGenerated = false;

    try {
      const system = `You are a ski and snowboard gear expert. Return ONLY a valid JSON object with two keys: "gear" (array of 6–8 specific gear item strings) and "warning" (string or null). Do not use markdown.`;
      const catTrackNote = (!resort.snowboardFriendly && sportType === 'snowboard') ? 'Resort has flat cat-tracks (challenging for snowboarders — mention relevant gear).' : '';
      const user = `Resort: ${resort.name} (${resort.country}). Terrain: ${resort.terrainType}. Elevation: ${resort.elevation}m. ${catTrackNote}
Rider: Level ${skillLevelInt}/5 (${SKILL_LEVEL_LABELS[skillLevelInt]}) ${sportType}er.
List 6–8 specific gear items tailored to this resort and rider. Include a "warning" field if there are any safety or terrain considerations (or null if none).`;
      const raw    = await chat(system, user, { maxTokens: 350, temperature: 0.5, json: true });
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.gear) && parsed.gear.length >= 4) {
        suggestedGear = parsed.gear;
        if (parsed.warning && typeof parsed.warning === 'string') warning = parsed.warning;
        aiGenerated = true;
      }
    } catch (_) { /* keep rule-based fallback */ }

    return res.status(200).json({
      success: true,
      data: {
        resortId:          resort.id,
        resortName:        resort.name,
        snowboardFriendly: resort.snowboardFriendly,
        sportType,
        skillLevel:        skillLevelInt,
        skillLevelLabel:   SKILL_LEVEL_LABELS[skillLevelInt],
        suggestedGear,
        aiGenerated,
        ...(warning ? { warning } : {}),
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /resort-assistant ────────────────────────────────────────────────────
const resortAssistant = async (req, res, next) => {
  try {
    const { resortId, locationType, sportType } = req.body;

    if (!resortId)     return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'resortId is required.',     details: { field: 'resortId'     } } });
    if (!locationType) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'locationType is required.',  details: { field: 'locationType'  } } });
    if (!sportType)    return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'sportType is required.',    details: { field: 'sportType'    } } });
    if (!validateSportType(sportType)) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: `sportType must be one of: ${VALID_SPORT_TYPES.join(', ')}.`, details: { field: 'sportType' } } });

    const validTypes = Object.keys(LOCATION_SUGGESTIONS);
    if (!validTypes.includes(locationType)) return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: `locationType must be one of: ${validTypes.join(', ')}.`, details: { field: 'locationType' } } });

    const resort = await Resort.findByPk(parseInt(resortId));
    if (!resort) return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Resort with id ${resortId} not found.`, details: {} } });

    const matchingLocations = await ResortLocation.findAll({
      where: { resortId: resort.id, type: locationType },
    });

    let generalTip  = LOCATION_SUGGESTIONS[locationType][sportType]; // fallback
    let aiGenerated = false;
    try {
      const locationNames = matchingLocations.length > 0
        ? matchingLocations.map(l => l.name).join(', ')
        : 'none on record';
      const system = `You are an expert in-resort ${sportType} advisor. Give practical, sport-specific 1–2 sentence tips. Be concise and actionable. No generic advice.`;
      const user   = `Resort: ${resort.name} (${resort.country}), ${resort.terrainType} terrain, ${resort.elevation}m elevation.
Location type: ${locationType}s. Known ${locationType}s at this resort: ${locationNames}.
Write 1–2 sentences of practical ${sportType}-specific advice for visiting ${locationType}s at this resort.`;
      generalTip  = (await chat(system, user, { maxTokens: 150, temperature: 0.6 })).trim();
      aiGenerated = true;
    } catch (_) { /* keep rule-based fallback */ }

    return res.status(200).json({
      success: true,
      data: {
        resortId:      resort.id,
        resortName:    resort.name,
        sportType,
        locationType,
        generalTip,
        aiGenerated,
        inResortSpots: matchingLocations.map((l) => ({
          locationId:  l.id,
          name:        l.name,
          description: l.description,
        })),
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /gear-chat ───────────────────────────────────────────────────────────
const gearChat = async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, data: null, error: { code: 'MISSING_MESSAGE', message: 'message is required', details: null } });
    }

    const { tripId: ctxTripId, resort = {}, trip = {}, rider = {}, forecast = null } = context;
    const userId = parseInt(req.headers['x-user-id']);
    const tripId = parseInt(ctxTripId);

    const nights = (trip.startDate && trip.endDate)
      ? Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000)
      : null;

    const systemLines = [
      'You are a ski and snowboard gear expert helping a rider pack for an upcoming mountain trip.',
      '',
      'Trip context:',
      `- Resort: ${resort.name ?? 'Unknown'}, ${resort.country ?? ''}`,
      `- Elevation: ${resort.elevation ? resort.elevation + 'm' : 'Unknown'} | Terrain: ${resort.terrainType ?? 'Unknown'}`,
      `- Snowboard-friendly: ${resort.snowboardFriendly ? 'Yes' : 'No'}`,
      `- Difficulty: ${resort.difficultyLevel ?? '?'}/5`,
      `- Dates: ${trip.startDate ?? '?'} → ${trip.endDate ?? '?'}${nights ? ` (${nights} nights)` : ''}`,
      `- Rider: ${rider.sportType ?? 'Unknown'} | Skill level: ${rider.skillLevel ?? '?'}/5 (${SKILL_LEVEL_LABELS[rider.skillLevel] ?? ''})`,
    ];

    if (forecast?.summary) {
      systemLines.push(
        '',
        `Weather during the trip (${forecast.confidence ?? 'unknown'} confidence):`,
        `- Avg temps: ${forecast.summary.avgTempMin}°C – ${forecast.summary.avgTempMax}°C`,
        `- Total snowfall: ${forecast.summary.totalSnowfall}cm`,
        `- Avg max wind: ${forecast.summary.avgWindMax} km/h`,
      );
    }

    systemLines.push(
      '',
      'Keep answers concise, practical, and specific to this trip. Focus on gear, packing, and clothing layers.',
      'Never ask the user to repeat context — you already have it all above.',
    );

    const userMessage = message === '__init__'
      ? 'Please give me a tailored packing list for my upcoming trip.'
      : message;

    const messages = [
      { role: 'system', content: systemLines.join('\n') },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const reply = await chatWithHistory(messages, { maxTokens: 600, temperature: 0.65 });

    // Persist both turns to DB (fire-and-forget; non-critical)
    if (tripId && userId) {
      GearChatMessage.bulkCreate([
        { tripId, userId, role: 'user',      content: userMessage },
        { tripId, userId, role: 'assistant', content: reply },
      ]).catch(() => {});
    }

    return res.json({ success: true, data: { reply }, error: null });
  } catch {
    return res.json({ success: true, data: { reply: "I'm having trouble connecting right now. Try asking again in a moment." }, error: null });
  }
};

// ── GET /gear-chat/:tripId ────────────────────────────────────────────────────
const getGearChat = async (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    const tripId = parseInt(req.params.tripId);
    const rows = await GearChatMessage.findAll({
      where: { userId, tripId },
      order: [['createdAt', 'ASC']],
      attributes: ['role', 'content'],
    });
    return res.json({ success: true, data: rows.map(r => ({ role: r.role, content: r.content })), error: null });
  } catch {
    return res.json({ success: true, data: [], error: null });
  }
};

// ── DELETE /gear-chat/:tripId ─────────────────────────────────────────────────
const resetGearChat = async (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    const tripId = parseInt(req.params.tripId);
    await GearChatMessage.destroy({ where: { userId, tripId } });
    return res.json({ success: true, data: null, error: null });
  } catch {
    return res.json({ success: true, data: null, error: null });
  }
};

module.exports = { getResortSummary, recommendResorts, gearRecommendation, resortAssistant, gearChat, getGearChat, resetGearChat };
