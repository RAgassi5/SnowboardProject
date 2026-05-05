const resorts = require("../models/resorts");

// Difficulty level order for comparison
const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

// POST /resort-summary
const getResortSummary = (req, res) => {
  const { resortId, skillLevel } = req.body;

  // Validate required fields
  if (!resortId) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "resortId is required.",
        details: { field: "resortId" }
      }
    });
  }

  if (!skillLevel) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "skillLevel is required.",
        details: { field: "skillLevel" }
      }
    });
  }

  // Validate skillLevel value
  if (!DIFFICULTY_LEVELS.includes(skillLevel)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: `skillLevel must be one of: ${DIFFICULTY_LEVELS.join(", ")}.`,
        details: { field: "skillLevel" }
      }
    });
  }

  // Find resort
  const resort = resorts.find((r) => r.resortId === parseInt(resortId));
  if (!resort) {
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

  const resortDifficultyIndex = DIFFICULTY_LEVELS.indexOf(resort.difficultyLevel);
  const userSkillIndex = DIFFICULTY_LEVELS.indexOf(skillLevel);
  const diff = resortDifficultyIndex - userSkillIndex;

  let summary;

  if (diff === 0) {
    // Perfect match
    summary = `Great match! ${resort.name} is rated ${resort.difficultyLevel} and aligns perfectly with your ${skillLevel} skill level. You can expect suitable terrain and a great experience.`;
  } else if (diff === 1) {
    // Resort is one level above user
    summary = `Moderate fit. ${resort.name} is rated ${resort.difficultyLevel}, which is slightly above your ${skillLevel} skill level. You may find some runs challenging but manageable.`;
  } else if (diff >= 2) {
    // Resort is two or more levels above user
    summary = `Not recommended. ${resort.name} is rated ${resort.difficultyLevel} and may be too challenging for a ${skillLevel} skier or snowboarder. Consider a resort with easier terrain.`;
  } else {
    // User is more advanced than the resort
    summary = `You may find ${resort.name} too easy. It is rated ${resort.difficultyLevel} but your skill level is ${skillLevel}. Consider a more challenging resort.`;
  }

  return res.status(200).json({
    success: true,
    data: {
      resortId: resort.resortId,
      resortName: resort.name,
      difficultyLevel: resort.difficultyLevel,
      skillLevel,
      summary
    },
    error: null
  });
};

module.exports = { getResortSummary };
