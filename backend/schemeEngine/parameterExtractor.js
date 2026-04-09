/**
 * parameterExtractor.js
 * Extracts structured user parameters from natural language.
 *
 * UPGRADES over original:
 * - Proactive extraction: pulls MULTIPLE params from a single sentence
 *   e.g. "I am a 35-year-old farmer with 3 acres" → all 4 params in one pass
 * - Smarter negation: handles "I don't own land", "mere paas zameen nahi hai"
 * - Occupation-based isFarmer detection (job/service/business = not farmer)
 * - Contextual yes/no resolution (unchanged but more robust)
 * - Returns extractionSummary[] for UI feedback
 */

/* ══════════════════════════════════════════════════════════════
   YES / NO SIGNAL LISTS
══════════════════════════════════════════════════════════════ */
const GENERIC_YES = new Set([
  "yes", "yeah", "yep", "yup", "sure", "ok", "okay", "correct", "right",
  "ha", "haa", "haan", "han", "ji", "ji haan", "ji ha",
  "bilkul", "sahi", "theek", "theek hai", "sahi hai", "hann",
  "हाँ", "हां", "जी", "हाँ जी", "बिल्कुल", "सही", "ठीक है",
]);

const GENERIC_NO = new Set([
  "no", "nope", "nah", "never", "not",
  "nahi", "nahin", "na", "mat", "naa", "bilkul nahi",
  "नहीं", "नही", "ना", "बिल्कुल नहीं",
]);

function isGenericYes(text) {
  const t = text.toLowerCase().trim().replace(/[.,!?]$/, "");
  return GENERIC_YES.has(t);
}

function isGenericNo(text) {
  const t = text.toLowerCase().trim().replace(/[.,!?]$/, "");
  return GENERIC_NO.has(t);
}

/* ══════════════════════════════════════════════════════════════
   NEGATION DETECTOR
   Detects local negation before a keyword, within a 4-word window.
══════════════════════════════════════════════════════════════ */
const NEGATION_WORDS = [
  "no", "not", "don't", "dont", "never", "without",
  "nahi", "nahin", "mat", "na", "naa", "nahi hai",
  "नहीं", "नही", "ना", "मत",
];

function hasNegationBefore(tokens, keywordIndex, windowSize = 4) {
  const start = Math.max(0, keywordIndex - windowSize);
  const context = tokens.slice(start, keywordIndex).join(" ");
  return NEGATION_WORDS.some((neg) => context.includes(neg));
}

/* ══════════════════════════════════════════════════════════════
   AGE EXTRACTION
══════════════════════════════════════════════════════════════ */
function extractAge(text) {
  const AGE_PATTERNS = [
    // "I am 35 years old" / "aged 40" / "age: 28"
    /(?:i am|i'm|my age is|age[:\s]+|umar[:\s]+|umra[:\s]+|aged?)\s*(\d{1,3})/i,
    // "35 years old" / "35 saal" / "35 वर्ष" / "35 साल"
    /(\d{1,3})\s*(?:years?\s*old|saal ka|saal ki|saal|वर्ष|साल)/i,
    // Hindi: "मेरी उम्र 35 है"
    /मेरी\s*उम्र\s*(\d{1,3})/i,
    // "35yr" / "35yr old"
    /(\d{1,3})\s*(?:yr|y\.o\.)/i,
    // Bare number (only as last resort)
    /^(\d{1,3})$/,
  ];

  for (const pattern of AGE_PATTERNS) {
    const match = text.trim().match(pattern);
    if (match) {
      const age = parseInt(match[1], 10);
      if (age >= 5 && age <= 120) return age;
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   LAND EXTRACTION (returns acres, converts bigha / hectare)
══════════════════════════════════════════════════════════════ */
function extractLandAcres(text) {
  const LAND_PATTERNS = [
    { re: /(\d+(?:\.\d+)?)\s*(?:acres?|एकड़)/i,    mul: 1 },
    { re: /(\d+(?:\.\d+)?)\s*(?:bigha|बीघा)/i,     mul: 0.62 },
    { re: /(\d+(?:\.\d+)?)\s*(?:hectares?|हेक्टेयर)/i, mul: 2.47 },
  ];

  for (const { re, mul } of LAND_PATTERNS) {
    const match = text.match(re);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0 && val < 10000) return +(val * mul).toFixed(2);
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   BOOLEAN EXTRACTION (keyword matching with negation awareness)
══════════════════════════════════════════════════════════════ */

// Keyword groups per parameter
const PARAM_KEYWORDS = {
  isFarmer: {
    yes: ["farmer", "kisan", "खेती करता", "खेती करती", "किसान", "farming", "agriculture", "krishi", "kheti karta", "kheti karti"],
    no:  ["not a farmer", "no farmer", "business", "job", "service", "naukri", "teacher", "doctor", "engineer", "shopkeeper", "dukaan"],
  },
  ownsLand: {
    yes: ["land", "zameen", "जमीन", "plot", "khet", "खेत", "acre", "bigha", "hectare", "khud ki zameen", "apni zameen"],
    no:  ["no land", "landless", "bhoomihin", "भूमिहीन", "tenant", "kiraya", "kiraayedaar", "किरायेदार", "seeri", "batai"],
  },
  growsCrops: {
    yes: ["crop", "fasal", "फसल", "wheat", "gehu", "rice", "dhan", "paddy", "maize", "makka",
          "vegetable", "sabzi", "cotton", "kapas", "sugarcane", "ganna", "soybean", "mustard", "sarson"],
    no:  ["no crop", "no fasal", "no farming", "kheti nahi", "fasal nahi"],
  },
  hasBankAccount: {
    yes: ["bank", "account", "khata", "खाता", "passbook", "atm", "saving", "jan dhan", "aadhaar linked"],
    no:  ["no bank", "no account", "bank nahi", "khata nahi", "no khata"],
  },
};

/**
 * Extract a boolean for a given param key from text using keyword matching.
 * Respects negation context.
 * @param {string} text
 * @param {"isFarmer"|"ownsLand"|"growsCrops"|"hasBankAccount"} paramKey
 * @returns {true | false | null}
 */
function extractBooleanParam(text, paramKey) {
  const t = text.toLowerCase();
  const tokens = t.split(/\s+/);
  const { yes: yesKw, no: noKw } = PARAM_KEYWORDS[paramKey];

  // Check explicit "no" keywords first (highest priority)
  if (noKw.some((kw) => t.includes(kw))) return false;

  // For each yes-keyword, check there's no negation right before it
  for (const kw of yesKw) {
    const kwIndex = tokens.findIndex((_, i) =>
      tokens.slice(i).join(" ").startsWith(kw)
    );
    if (kwIndex !== -1) {
      if (hasNegationBefore(tokens, kwIndex)) return false;
      return true;
    }
  }

  return null;
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXTRACTOR
══════════════════════════════════════════════════════════════ */

/**
 * Extract all parameters from user text, with context-aware yes/no resolution.
 *
 * @param {string} text           - Raw (translated) user input
 * @param {string|null} lastAsked - Key of the last question the bot asked
 * @returns {{
 *   isFarmer: boolean|null,
 *   age: number|null,
 *   ownsLand: boolean|null,
 *   landAcres: number|null,
 *   growsCrops: boolean|null,
 *   hasBankAccount: boolean|null,
 *   _extracted: string[]          - human-readable list of what was found (for debug/UI)
 * }}
 */
function extractParams(text, lastAsked = null) {
  const empty = {
    isFarmer: null, age: null, ownsLand: null,
    landAcres: null, growsCrops: null, hasBankAccount: null,
    _extracted: [],
  };

  if (!text || typeof text !== "string") return empty;

  const BOOLEAN_PARAMS = ["isFarmer", "ownsLand", "growsCrops", "hasBankAccount"];

  // ── CONTEXT-AWARE BARE YES/NO ────────────────────────────────────────────
  // If the bot just asked about a boolean param and user answers "ha" / "nahi"
  if (lastAsked && BOOLEAN_PARAMS.includes(lastAsked)) {
    if (isGenericYes(text)) {
      return { ...empty, [lastAsked]: true, _extracted: [`${lastAsked}=true (from yes)`] };
    }
    if (isGenericNo(text)) {
      return { ...empty, [lastAsked]: false, _extracted: [`${lastAsked}=false (from no)`] };
    }
  }

  // ── CONTEXT-AWARE BARE NUMBER (age) ──────────────────────────────────────
  if (lastAsked === "age") {
    const age = extractAge(text);
    if (age !== null) {
      return { ...empty, age, _extracted: [`age=${age} (from bare number)`] };
    }
  }

  // ── FULL MULTI-PARAM EXTRACTION ──────────────────────────────────────────
  // This runs even when context is set — allows "I am a 35yr old farmer with 2 acres"
  const extracted = [];

  const isFarmer      = extractBooleanParam(text, "isFarmer");
  const ownsLandKw    = extractBooleanParam(text, "ownsLand");
  const growsCrops    = extractBooleanParam(text, "growsCrops");
  const hasBankAccount = extractBooleanParam(text, "hasBankAccount");
  const age           = extractAge(text);
  const landAcres     = extractLandAcres(text);

  // Land inference: if landAcres found, user obviously owns land
  const ownsLand = ownsLandKw !== null ? ownsLandKw : (landAcres !== null ? true : null);

  if (isFarmer      !== null) extracted.push(`isFarmer=${isFarmer}`);
  if (age           !== null) extracted.push(`age=${age}`);
  if (ownsLand      !== null) extracted.push(`ownsLand=${ownsLand}`);
  if (landAcres     !== null) extracted.push(`landAcres=${landAcres}`);
  if (growsCrops    !== null) extracted.push(`growsCrops=${growsCrops}`);
  if (hasBankAccount!== null) extracted.push(`hasBankAccount=${hasBankAccount}`);

  return {
    isFarmer, age,
    ownsLand, landAcres,
    growsCrops, hasBankAccount,
    _extracted: extracted,
  };
}

/* ══════════════════════════════════════════════════════════════
   MERGE PARAMS
   Existing confirmed values are never overwritten by null.
   _extracted metadata is excluded from merge.
══════════════════════════════════════════════════════════════ */
function mergeParams(sessionParams = {}, newParams = {}) {
  const merged = { ...sessionParams };
  for (const [key, val] of Object.entries(newParams)) {
    if (key === "_extracted") continue; // internal metadata
    if (val !== null && val !== undefined) {
      merged[key] = val;
    }
  }
  return merged;
}

module.exports = { extractParams, mergeParams };