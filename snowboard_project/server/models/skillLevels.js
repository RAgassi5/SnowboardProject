/**
 * Skill Level Scale (1–5)
 *
 * Used across AI controllers, auth validation, and user registration.
 * skillLevel is stored and sent as an integer.
 */

const VALID_SKILL_LEVELS = [1, 2, 3, 4, 5];

const SKILL_LEVEL_LABELS = {
  1: "First-Timer (Nursery slopes only)",
  2: "Novice (Green/Easy Blue)",
  3: "Intermediate (Confident on Red/Blue)",
  4: "Expert (Advanced/Black Diamonds)",
  5: "Pro/Freeride (Off-piste/Extreme terrain)"
};

// Mirror of resort difficultyLevel — same 1–5 scale
const DIFFICULTY_LABELS = {
  1: "First-Timer",
  2: "Novice",
  3: "Intermediate",
  4: "Expert",
  5: "Pro/Freeride"
};

module.exports = { VALID_SKILL_LEVELS, SKILL_LEVEL_LABELS, DIFFICULTY_LABELS };
