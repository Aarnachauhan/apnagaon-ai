/**
 * followUpEngine.js
 * NEW FILE — schemeEngine/followUpEngine.js
 *
 * After basic params are collected, this engine asks intelligent
 * follow-up questions that refine results and feel genuinely human.
 *
 * Examples:
 *  - If growsCrops=true → ask WHAT crop (refines PMFBY advice)
 *  - If isFarmer=true + age 18-40 → ask if they've heard of Maandhan
 *  - If hasBankAccount=true → ask if it's Aadhaar-linked (critical for PM-KISAN)
 *  - If ownsLand=true and landAcres=null → ask land size (PMFBY sum insured scales with area)
 *
 * These questions are OPTIONAL — they improve the advice but don't
 * block the eligibility result. The main questionEngine handles
 * required questions. This handles enrichment questions.
 */

/* ══════════════════════════════════════════════════════════
   FOLLOW-UP QUESTION DEFINITIONS
   Each has:
   - key:        unique identifier
   - shouldAsk:  (params) => boolean — when to ask this
   - question:   string (bilingual)
   - hint:       short context for UI
   - type:       "choice" | "number" | "freetext"
   - options:    array (for type="choice")
   - param:      which session key to set with the answer
   - valueMap:   (answer) => value to store
══════════════════════════════════════════════════════════ */
const FOLLOW_UPS = [
  {
    key:       "cropType",
    shouldAsk: (p) =>
      p.growsCrops === true && !p.cropType,
    question:  "आप कौन सी फसल उगाते हैं? (Which crop do you mainly grow?)",
    hint:      "This helps us give you accurate PMFBY insurance rates.",
    type:      "choice",
    options:   ["गेहूँ (Wheat)", "धान / चावल (Rice/Paddy)", "मक्का (Maize)", "सब्ज़ियाँ (Vegetables)", "गन्ना (Sugarcane)", "दलहन / दाल (Pulses)", "अन्य (Other)"],
    param:     "cropType",
    valueMap:  (ans) => ans,
  },
  {
    key:       "aadhaarLinked",
    shouldAsk: (p) =>
      p.hasBankAccount === true &&
      p.aadhaarLinked === undefined &&
      (p.isFarmer === true || p.age >= 18),
    question:  "क्या आपका बैंक खाता Aadhaar से लिंक है? (Is your bank account linked to Aadhaar?)",
    hint:      "PM-KISAN and PMSBY payments only work with Aadhaar-linked accounts.",
    type:      "choice",
    options:   ["हाँ, लिंक है (Yes, linked)", "नहीं / पता नहीं (No / Not sure)"],
    param:     "aadhaarLinked",
    valueMap:  (ans) => ans.startsWith("हाँ") || ans.toLowerCase().startsWith("yes"),
  },
  {
    key:       "landAcresRefined",
    shouldAsk: (p) =>
      p.ownsLand === true && (p.landAcres === null || p.landAcres === undefined),
    question:  "आपके पास कितनी जमीन है? (How much land do you own?)",
    hint:      "Enter in acres, bigha, or hectares — e.g. '2 acres' or '3 bigha'.",
    type:      "freetext",
    param:     "landAcres",
    valueMap:  null, // handled by parameterExtractor.extractLandAcres
  },
  {
    key:       "hasKCC",
    shouldAsk: (p) =>
      p.isFarmer === true &&
      p.hasBankAccount === true &&
      p.growsCrops === true &&
      p.hasKCC === undefined,
    question:  "क्या आपके पास Kisan Credit Card (KCC) है? (Do you have a Kisan Credit Card?)",
    hint:      "If yes, PMFBY crop insurance may be enrolled automatically at your bank.",
    type:      "choice",
    options:   ["हाँ, KCC है (Yes)", "नहीं है (No)", "पता नहीं (Not sure)"],
    param:     "hasKCC",
    valueMap:  (ans) => ans.startsWith("हाँ") || ans.toLowerCase().startsWith("yes") ? true : false,
  },
  {
    key:       "state",
    shouldAsk: (p) =>
      p.isFarmer === true &&
      !p.state,
    question:  "आप किस राज्य में हैं? (Which state are you in?)",
    hint:      "Scheme deadlines and CSC locations vary by state.",
    type:      "choice",
    options:   [
      "Uttar Pradesh", "Maharashtra", "Madhya Pradesh", "Rajasthan",
      "Bihar", "Gujarat", "Karnataka", "Andhra Pradesh",
      "Punjab", "Haryana", "Odisha", "अन्य (Other)",
    ],
    param:     "state",
    valueMap:  (ans) => ans,
  },
];

/**
 * Get the next follow-up question to ask, if any.
 * Follow-ups are asked AFTER all required questions are answered.
 *
 * @param {object} params - current session params
 * @param {string[]} alreadyAsked - follow-up keys already asked this session
 * @returns {{ key, question, hint, type, options, param } | null}
 */
function getNextFollowUp(params, alreadyAsked = []) {
  for (const fup of FOLLOW_UPS) {
    // Skip if already asked
    if (alreadyAsked.includes(fup.key)) continue;

    // Check if condition applies
    try {
      if (fup.shouldAsk(params)) {
        return {
          key:     fup.key,
          question:fup.question,
          hint:    fup.hint,
          type:    fup.type,
          options: fup.options || [],
          param:   fup.param,
        };
      }
    } catch {
      // ignore errors in shouldAsk conditions
    }
  }
  return null;
}

/**
 * Apply a follow-up answer to session params.
 * @param {object} params
 * @param {string} fupKey    - follow-up key
 * @param {string} answerText - raw answer text
 * @returns {object}          - updated params
 */
function applyFollowUpAnswer(params, fupKey, answerText) {
  const fup = FOLLOW_UPS.find((f) => f.key === fupKey);
  if (!fup) return params;

  const updated = { ...params };

  if (fup.valueMap) {
    // Structured answer (choice)
    updated[fup.param] = fup.valueMap(answerText);
  } else {
    // Free text — let caller handle via parameterExtractor
    // Just store raw for now; responseEngine will parse landAcres etc.
    updated[`_raw_${fup.param}`] = answerText;
  }

  return updated;
}

/**
 * Build UI-friendly follow-up metadata for the frontend.
 * Tells the chat which quick-reply chips to show.
 */
function getFollowUpChips(fup) {
  if (!fup || fup.type !== "choice") return [];
  return fup.options || [];
}

module.exports = { getNextFollowUp, applyFollowUpAnswer, getFollowUpChips };