const resorts             = require("../models/resorts");
const resortLocations     = require("../models/resortLocations");
const { VALID_SKILL_LEVELS, SKILL_LEVEL_LABELS, DIFFICULTY_LABELS } = require("../models/skillLevels");
const { GEAR_MAP }        = require("../models/gearRecommendations");
const { LOCATION_SUGGESTIONS } = require("../models/locationSuggestions");

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_SPORT_TYPES = ["ski", "snowboard"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Coerces raw input to an integer and validates it is in the 1–5 range. */
const parseAndValidateSkillLevel = (raw) => {
  const n = parseInt(raw);
  if (!Number.isInteger(n) || !VALID_SKILL_LEVELS.includes(n)) return null;
  return n;
};

const validateSportType = (sportType) => VALID_SPORT_TYPES.includes(sportType);

// ─── POST /resort-summary ─────────────────────────────────────────────────────
const getResortSummary = (req, res) => {
  const { resortId, skillLevel } = req.body;

  if (!resortId) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "resortId is required.", details: { field: "resortId" } }
    });
  }

  const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
  if (skillLevelInt === null) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "skillLevel must be an integer between 1 and 5. (1=First-Timer, 2=Novice, 3=Intermediate, 4=Expert, 5=Pro/Freeride)",
        details: { field: "skillLevel" }
      }
    });
  }

  const resort = resorts.find((r) => r.resortId === parseInt(resortId));
  if (!resort) {
    return res.status(404).json({
      success: false, data: null,
      error: { code: "NOT_FOUND", message: `Resort with id ${resortId} not found.`, details: {} }
    });
  }

  const diff = resort.difficultyLevel - skillLevelInt;
  let summary;
  if (diff === 0) {
    summary = `Perfect match! ${resort.name} is rated Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) — exactly aligned with your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}) ability. Expect ideal terrain throughout.`;
  } else if (diff === 1) {
    summary = `Good challenge. ${resort.name} is rated Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}), one step above your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}). You'll find most runs manageable with a few demanding sections to push your progression.`;
  } else if (diff >= 2) {
    summary = `Not recommended. ${resort.name} is a Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) resort and may be significantly too challenging for a Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}) rider. Consider a lower-rated resort first.`;
  } else if (diff === -1) {
    summary = `Slightly easy for you. ${resort.name} is rated Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}), just below your Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}). You'll enjoy it, though advanced terrain may be limited.`;
  } else {
    summary = `Too easy. ${resort.name} is rated Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) but your skill level is Level ${skillLevelInt} (${SKILL_LEVEL_LABELS[skillLevelInt]}). You would quickly outgrow the terrain — consider a higher-rated resort.`;
  }

  return res.status(200).json({
    success: true,
    data: {
      resortId: resort.resortId,
      resortName: resort.name,
      resortDifficultyLevel: resort.difficultyLevel,
      resortDifficultyLabel: DIFFICULTY_LABELS[resort.difficultyLevel],
      skillLevel: skillLevelInt,
      skillLevelLabel: SKILL_LEVEL_LABELS[skillLevelInt],
      summary
    },
    error: null
  });
};

// ─── POST /recommend-resorts ──────────────────────────────────────────────────
const recommendResorts = (req, res) => {
  const { startDate, endDate, skillLevel, sportType } = req.body;

  const requiredFields = ["startDate", "endDate", "skillLevel", "sportType"];
  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
      return res.status(400).json({
        success: false, data: null,
        error: { code: "VALIDATION_ERROR", message: `${field} is required.`, details: { field } }
      });
    }
  }

  if (!validateSportType(sportType)) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `sportType must be one of: ${VALID_SPORT_TYPES.join(", ")}.`,
        details: { field: "sportType" }
      }
    });
  }

  const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
  if (skillLevelInt === null) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "skillLevel must be an integer between 1 and 5. (1=First-Timer, 2=Novice, 3=Intermediate, 4=Expert, 5=Pro/Freeride)",
        details: { field: "skillLevel" }
      }
    });
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "startDate and endDate must be valid ISO date strings.", details: {} }
    });
  }
  if (start >= end) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "startDate must be before endDate.", details: {} }
    });
  }

  // ── Scoring ────────────────────────────────────────────────────────────────
  const maxElev = Math.max(...resorts.map((r) => r.elevation || 0));

  const scored = resorts.map((r) => {
    const diffPenalty   = Math.abs(r.difficultyLevel - skillLevelInt) * 2.5;
    const elevBonus     = ((r.elevation || 0) / maxElev) * 3;
    const boardBonus    = (sportType === "snowboard" && r.snowboardFriendly) ? 2 : 0;
    const freerideBonus = (skillLevelInt === 5 && r.terrainType === "backcountry") ? 3 : 0;
    return { resort: r, score: 10 - diffPenalty + elevBonus + boardBonus + freerideBonus };
  });
  scored.sort((a, b) => b.score - a.score);

  // ── Build explanations ─────────────────────────────────────────────────────
  const sportLabel = sportType === "snowboard" ? "snowboarder" : "skier";

  const top3 = scored.slice(0, 3).map(({ resort }, index) => {
    const diff         = resort.difficultyLevel - skillLevelInt;
    const isPerfect    = diff === 0;
    const isFreeride   = skillLevelInt === 5 && resort.terrainType === "backcountry";
    const isBoardFriendly = sportType === "snowboard" && resort.snowboardFriendly && !isFreeride && !isPerfect;

    let explanation;
    if (isFreeride) {
      explanation = `${resort.name} in ${resort.country} is a Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) resort — ideal for your Pro/Freeride level. With legendary backcountry access and famous powder bowls at ${resort.elevation}m, it offers everything an elite ${sportLabel} needs from ${startDate} to ${endDate}.`;
    } else if (isPerfect) {
      explanation = `${resort.name} in ${resort.country} is a perfect Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) match for your ability. Its ${resort.terrainType} terrain at ${resort.elevation}m makes it an ideal choice for the ${startDate} – ${endDate} window.`;
    } else if (isBoardFriendly) {
      explanation = `${resort.name} in ${resort.country} is Level ${resort.difficultyLevel} (${DIFFICULTY_LABELS[resort.difficultyLevel]}) and highly snowboard-friendly — minimal flat cat-tracks and great ${resort.terrainType} terrain at ${resort.elevation}m. Excellent choice for a ${sportLabel} from ${startDate} to ${endDate}.`;
    } else if (Math.abs(diff) === 1) {
      explanation = `${resort.name} in ${resort.country} (Level ${resort.difficultyLevel} — ${DIFFICULTY_LABELS[resort.difficultyLevel]}) offers a ${diff > 0 ? "step up" : "step down"} from your current level — good for ${diff > 0 ? "progression" : "consolidation"}. ${resort.terrainType} terrain at ${resort.elevation}m for ${startDate} – ${endDate}.`;
    } else {
      explanation = `${resort.name} in ${resort.country} (Level ${resort.difficultyLevel} — ${DIFFICULTY_LABELS[resort.difficultyLevel]}) suits a Level ${skillLevelInt} ${sportLabel}. ${resort.terrainType} terrain at ${resort.elevation}m for the ${startDate} – ${endDate} trip.`;
    }

    return {
      rank: index + 1,
      resortId: resort.resortId,
      resortName: resort.name,
      country: resort.country,
      difficultyLevel: resort.difficultyLevel,
      difficultyLabel: DIFFICULTY_LABELS[resort.difficultyLevel],
      snowboardFriendly: resort.snowboardFriendly,
      explanation
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      startDate,
      endDate,
      skillLevel: skillLevelInt,
      skillLevelLabel: SKILL_LEVEL_LABELS[skillLevelInt],
      sportType,
      recommendations: top3
    },
    error: null
  });
};

// ─── POST /gear-recommendation ────────────────────────────────────────────────
const gearRecommendation = (req, res) => {
  const { resortId, skillLevel, sportType } = req.body;

  if (!resortId) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "resortId is required.", details: { field: "resortId" } }
    });
  }
  if (!sportType) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "sportType is required.", details: { field: "sportType" } }
    });
  }
  if (!validateSportType(sportType)) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `sportType must be one of: ${VALID_SPORT_TYPES.join(", ")}.`,
        details: { field: "sportType" }
      }
    });
  }

  const skillLevelInt = parseAndValidateSkillLevel(skillLevel);
  if (skillLevelInt === null) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "skillLevel must be an integer between 1 and 5. (1=First-Timer, 2=Novice, 3=Intermediate, 4=Expert, 5=Pro/Freeride)",
        details: { field: "skillLevel" }
      }
    });
  }

  const resort = resorts.find((r) => r.resortId === parseInt(resortId));
  if (!resort) {
    return res.status(404).json({
      success: false, data: null,
      error: { code: "NOT_FOUND", message: `Resort with id ${resortId} not found.`, details: {} }
    });
  }

  const boardWarning =
    sportType === "snowboard" && !resort.snowboardFriendly
      ? `Note: ${resort.name} has long flat cat-tracks between sectors which can be challenging for snowboarders. Consider this when planning your route.`
      : null;

  return res.status(200).json({
    success: true,
    data: {
      resortId: resort.resortId,
      resortName: resort.name,
      snowboardFriendly: resort.snowboardFriendly,
      sportType,
      skillLevel: skillLevelInt,
      skillLevelLabel: SKILL_LEVEL_LABELS[skillLevelInt],
      suggestedGear: GEAR_MAP[sportType][skillLevelInt],
      ...(boardWarning ? { warning: boardWarning } : {})
    },
    error: null
  });
};

// ─── POST /resort-assistant ───────────────────────────────────────────────────
const resortAssistant = (req, res) => {
  const { resortId, locationType, sportType } = req.body;

  if (!resortId) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "resortId is required.", details: { field: "resortId" } }
    });
  }
  if (!locationType) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "locationType is required.", details: { field: "locationType" } }
    });
  }
  if (!sportType) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: "VALIDATION_ERROR", message: "sportType is required.", details: { field: "sportType" } }
    });
  }
  if (!validateSportType(sportType)) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `sportType must be one of: ${VALID_SPORT_TYPES.join(", ")}.`,
        details: { field: "sportType" }
      }
    });
  }

  const validTypes = Object.keys(LOCATION_SUGGESTIONS);
  if (!validTypes.includes(locationType)) {
    return res.status(400).json({
      success: false, data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `locationType must be one of: ${validTypes.join(", ")}.`,
        details: { field: "locationType" }
      }
    });
  }

  const resort = resorts.find((r) => r.resortId === parseInt(resortId));
  if (!resort) {
    return res.status(404).json({
      success: false, data: null,
      error: { code: "NOT_FOUND", message: `Resort with id ${resortId} not found.`, details: {} }
    });
  }

  const matchingLocations = resortLocations
    .filter((l) => l.resortId === resort.resortId && l.type === locationType)
    .map((l) => ({ locationId: l.locationId, name: l.name, description: l.description }));

  return res.status(200).json({
    success: true,
    data: {
      resortId: resort.resortId,
      resortName: resort.name,
      sportType,
      locationType,
      generalTip: LOCATION_SUGGESTIONS[locationType][sportType],
      inResortSpots: matchingLocations
    },
    error: null
  });
};

module.exports = { getResortSummary, recommendResorts, gearRecommendation, resortAssistant };
