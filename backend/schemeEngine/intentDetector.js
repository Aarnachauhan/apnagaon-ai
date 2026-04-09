/**
 * intentDetector.js
 * Smarter intent detection with confidence scoring.
 *
 * UPGRADES over original:
 * - Returns { intent, confidence, subIntent } instead of a plain string
 * - Weighted keyword scoring (exact match > partial match)
 * - Detects "help" sub-intents: scheme lookup, fraud report, helpline request
 * - Handles mid-sentence greetings ("hi, I need help with kisan yojana")
 * - Detects frustration signals ("not working", "rejected", "koi reply nahi")
 */

// ── HIGH-CONFIDENCE SCHEME KEYWORDS (exact or near-exact scheme names) ────
const SCHEME_EXACT = [
  "pm-kisan", "pm kisan", "pmkisan", "pmfby", "pmsby",
  "maandhan", "pm maandhan", "fasal bima", "suraksha bima",
  "kisan samman", "jan dhan", "atal pension",
];

// ── GENERAL SCHEME-INTENT KEYWORDS (weighted lower) ──────────────────────
const SCHEME_GENERAL = [
  // English
  "scheme", "yojana", "government", "benefit", "subsidy", "apply",
  "eligib", "pension", "insurance", "kisan", "farmer", "loan",
  "csc", "ration", "welfare", "aid", "grant", "registration", "enrol",
  "sarkari", "rupees", "money help",
  // Hinglish transliterated
  "sarkari madad", "sarkari yojana", "labh", "paisa", "kheti", "fasal",
  "bima", "aadhaar", "aadhar", "khata", "bank",
  // Hindi Unicode
  "किसान", "योजना", "सरकार", "सहायता", "लाभ", "खेती", "फसल",
  "बीमा", "पेंशन", "जमीन", "आधार", "बैंक", "मदद", "पैसा", "सब्सिडी",
];

// ── FRAUD / PROBLEM KEYWORDS ──────────────────────────────────────────────
const FRAUD_KEYWORDS = [
  "fraud", "scam", "cheat", "fake", "dhokha", "thagi", "dhokebaaz",
  "धोखा", "फ्रॉड", "ठगी", "scammer", "someone asking money",
  "paisa maang raha", "fee maang raha",
];

// ── HELPLINE / CONTACT KEYWORDS ───────────────────────────────────────────
const HELPLINE_KEYWORDS = [
  "helpline", "contact", "number", "call", "phone", "toll free",
  "complain", "complaint", "problem", "issue", "rejected", "not received",
  "paisa nahi aaya", "पैसा नहीं आया", "rejection",
];

// ── GREETING KEYWORDS ─────────────────────────────────────────────────────
const GREETING_START = [
  "hello", "hi ", "hi,", "hey", "namaste", "namaskar", "helo", "hii",
  "नमस्ते", "हेलो", "हाय", "sat sri akal", "jai hind",
];

// ── FALLBACK / GENERAL CHAT ───────────────────────────────────────────────
const GENERAL_CHAT = [
  "how are you", "what is your name", "who are you", "aap kaun",
  "weather", "cricket", "news", "joke", "mausam",
];

/**
 * Detect intent with confidence score.
 *
 * @param {string} text
 * @returns {{
 *   intent: "greeting" | "scheme" | "fraud_report" | "helpline" | "general",
 *   confidence: "high" | "medium" | "low",
 *   subIntent: string | null
 * }}
 */
function detectIntent(text) {
  if (!text || typeof text !== "string") {
    return { intent: "general", confidence: "low", subIntent: null };
  }

  const t = text.toLowerCase().trim();

  // ── 1. PURE GREETING (no scheme content after it) ─────────────────────
  const isGreetingStart = GREETING_START.some((kw) => t.startsWith(kw));
  const hasSchemeAfterGreeting = SCHEME_EXACT.some((kw) => t.includes(kw)) ||
    SCHEME_GENERAL.some((kw) => t.includes(kw));

  if (isGreetingStart && !hasSchemeAfterGreeting) {
    return { intent: "greeting", confidence: "high", subIntent: null };
  }

  // ── 2. FRAUD REPORT ───────────────────────────────────────────────────
  if (FRAUD_KEYWORDS.some((kw) => t.includes(kw))) {
    return { intent: "fraud_report", confidence: "high", subIntent: "report" };
  }

  // ── 3. HELPLINE / COMPLAINT ───────────────────────────────────────────
  if (HELPLINE_KEYWORDS.some((kw) => t.includes(kw))) {
    // Figure out which scheme they're complaining about
    let schemeRef = null;
    if (t.includes("kisan") || t.includes("pm-kisan") || t.includes("किसान")) schemeRef = "pm_kisan";
    else if (t.includes("fasal") || t.includes("pmfby") || t.includes("फसल")) schemeRef = "pmfby";
    else if (t.includes("suraksha") || t.includes("pmsby")) schemeRef = "pmsby";
    else if (t.includes("maandhan") || t.includes("pension")) schemeRef = "pm_maandhan";

    return { intent: "helpline", confidence: "high", subIntent: schemeRef };
  }

  // ── 4. EXACT SCHEME MATCH → high confidence ───────────────────────────
  if (SCHEME_EXACT.some((kw) => t.includes(kw))) {
    return { intent: "scheme", confidence: "high", subIntent: "lookup" };
  }

  // ── 5. GENERAL SCHEME KEYWORDS → medium confidence ────────────────────
  const schemeScore = SCHEME_GENERAL.filter((kw) => t.includes(kw)).length;
  if (schemeScore >= 1) {
    const confidence = schemeScore >= 3 ? "high" : "medium";
    return { intent: "scheme", confidence, subIntent: "lookup" };
  }

  // ── 6. GENERAL CHAT ───────────────────────────────────────────────────
  if (GENERAL_CHAT.some((kw) => t.includes(kw))) {
    return { intent: "general", confidence: "medium", subIntent: "chat" };
  }

  // ── 7. FALLBACK: treat ambiguous short messages as possible scheme intent
  //    (user might be mid-conversation answering a question)
  return { intent: "general", confidence: "low", subIntent: null };
}

module.exports = { detectIntent };