/**
 * questionEngine.js
 * Decides the next question to ask, with conversational phrasing.
 *
 * UPGRADES over original:
 * - Returns progress metadata (step N of M) for the frontend progress bar
 * - Skips irrelevant questions based on known context
 *   (e.g. if isFarmer=false, skip ownsLand and growsCrops)
 * - Varied, friendlier phrasing instead of rigid template questions
 * - Handles farmer = false path efficiently (only needs age + bank)
 */

/**
 * Total questions in each path (for progress display).
 */
const FARMER_PATH_TOTAL    = 5; // isFarmer, age, ownsLand, growsCrops, hasBankAccount
const NON_FARMER_PATH_TOTAL = 3; // isFarmer, age, hasBankAccount

/**
 * Get the next question to ask.
 *
 * @param {object} params - current session params
 * @returns {{
 *   key: string,
 *   question: string,
 *   step: number,
 *   total: number,
 *   hint: string|null      - short hint text shown below the question in UI
 * } | null}
 */
function getNextQuestion(params) {
  const isFarmer = params.isFarmer;
  const total = isFarmer === false ? NON_FARMER_PATH_TOTAL : FARMER_PATH_TOTAL;

  // ── Step 1: Are you a farmer? ───────────────────────────────────────────
  if (isFarmer === null || isFarmer === undefined) {
    return {
      key:      "isFarmer",
      question: "क्या आप किसान हैं? (Are you a farmer?)",
      hint:     "Farming includes growing crops, vegetables, or any agricultural work.",
      step:     1,
      total,
    };
  }

  // ── Step 2: Age ─────────────────────────────────────────────────────────
  if (params.age === null || params.age === undefined) {
    return {
      key:      "age",
      question: "आपकी उम्र क्या है? (How old are you?)",
      hint:     "Age helps us check which schemes you qualify for.",
      step:     2,
      total,
    };
  }

  // ── Non-farmer fast path: skip land/crop questions ─────────────────────
  if (isFarmer === false) {
    if (params.hasBankAccount === null || params.hasBankAccount === undefined) {
      return {
        key:      "hasBankAccount",
        question: "क्या आपका बैंक खाता है? (Do you have a bank account?)",
        hint:     "Any bank account — savings, Jan Dhan, or post office account.",
        step:     3,
        total:    NON_FARMER_PATH_TOTAL,
      };
    }
    return null; // All needed params collected for non-farmer
  }

  // ── Farmer path continues ────────────────────────────────────────────────

  // Step 3: Own land?
  if (params.ownsLand === null || params.ownsLand === undefined) {
    return {
      key:      "ownsLand",
      question: "क्या आपके पास अपनी जमीन है? (Do you own agricultural land?)",
      hint:     "Your name or family's name in land records (Khasra/Khatauni).",
      step:     3,
      total:    FARMER_PATH_TOTAL,
    };
  }

  // Step 4: Grow crops?
  if (params.growsCrops === null || params.growsCrops === undefined) {
    return {
      key:      "growsCrops",
      question: "क्या आप फसल उगाते हैं? (Do you grow crops?)",
      hint:     "Wheat, rice, vegetables, sugarcane — any crop counts.",
      step:     4,
      total:    FARMER_PATH_TOTAL,
    };
  }

  // Step 5: Bank account?
  if (params.hasBankAccount === null || params.hasBankAccount === undefined) {
    return {
      key:      "hasBankAccount",
      question: "क्या आपका कोई बैंक खाता है? (Do you have a bank account?)",
      hint:     "Benefits are transferred directly to your bank account.",
      step:     5,
      total:    FARMER_PATH_TOTAL,
    };
  }

  return null; // All questions answered
}

/**
 * Returns true when we have the minimum required params to run eligibility.
 * (isFarmer + age are always required; the rest refine results)
 */
function hasEnoughParams(params) {
  return (
    params.isFarmer !== null && params.isFarmer !== undefined &&
    params.age      !== null && params.age      !== undefined
  );
}

/**
 * Returns how many params are still missing.
 * Used by responseEngine to decide whether to show results or keep asking.
 */
function countMissingParams(params) {
  const required = ["isFarmer", "age", "ownsLand", "growsCrops", "hasBankAccount"];

  // Non-farmers don't need land/crop questions
  if (params.isFarmer === false) {
    return ["isFarmer", "age", "hasBankAccount"].filter(
      (k) => params[k] === null || params[k] === undefined
    ).length;
  }

  return required.filter(
    (k) => params[k] === null || params[k] === undefined
  ).length;
}

module.exports = { getNextQuestion, hasEnoughParams, countMissingParams };