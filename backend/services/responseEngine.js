/**
 * responseEngine.js  (v3 — full rewrite)
 * services/responseEngine.js
 *
 * FIXES:
 *   - Double question bug: greeting embeds the FIRST question inside itself.
 *     Frontend renders ONE message, not two.
 *
 * NEW:
 *   - After required params, runs FOLLOW-UP questions (crop type, Aadhaar-linked,
 *     land size, KCC, state) before showing results — personalizes advice deeply
 *   - Results include personalized summary, urgency notices, action plan,
 *     Maandhan contribution calculator, priority ordering explanation
 *   - Handles fraud_report and helpline intents
 *
 * Session shape:
 *   {
 *     params:         object,
 *     lastAsked:      string|null,   // key of last REQUIRED question
 *     lastFollowUp:   string|null,   // key of last FOLLOW-UP question
 *     followUpsAsked: string[],      // follow-up keys already asked
 *     phase:          "required" | "followup" | "done"
 *   }
 */

const { detectIntent }                          = require("../schemeEngine/intentDetector");
const { extractParams, mergeParams }            = require("../schemeEngine/parameterExtractor");
const { getNextQuestion }                       = require("../schemeEngine/questionEngine");
const { getNextFollowUp, applyFollowUpAnswer }  = require("../schemeEngine/followUpEngine");
const { checkEligibility }                      = require("../schemeEngine/eligibilityEngine");
const { rankSchemes }                           = require("../schemeEngine/rankingEngine");
const { formatResponse }                        = require("../schemeEngine/formatter");
const { buildPersonalizedSummary }              = require("../schemeEngine/personalizationEngine");

/* ═══════════════════════════════════════════════════════
   SESSION INIT
═══════════════════════════════════════════════════════ */
function initSession(session) {
  if (!session.params) {
    session.params = {
      isFarmer: null, age: null, ownsLand: null,
      landAcres: null, growsCrops: null, hasBankAccount: null,
    };
  }
  if (session.lastAsked      === undefined) session.lastAsked      = null;
  if (session.lastFollowUp   === undefined) session.lastFollowUp   = null;
  if (!session.followUpsAsked)              session.followUpsAsked = [];
  if (!session.phase)                       session.phase          = "required";
}

/* ═══════════════════════════════════════════════════════
   GREETING — embeds first question; NO double render
═══════════════════════════════════════════════════════ */
function buildGreeting(firstQ) {
  return {
    type: "greeting",
    payload: {
      // Welcome text and first question bundled as ONE unit.
      // ChatPage renders this as a single bot turn.
      lines: [
        "नमस्ते! 🙏 मैं ApnaGaon का सहायक हूँ।",
        "I'll help you find government schemes — PM-KISAN, PMFBY, PMSBY, Maandhan.",
        "बस कुछ सवाल जवाब दें — आपकी पूरी situation समझकर सही योजना बताऊंगा।",
      ],
      firstQuestion: firstQ
        ? { question: firstQ.question, hint: firstQ.hint, step: firstQ.step, total: firstQ.total }
        : null,
    },
    meta: { phase: "required" },
  };
}

/* ═══════════════════════════════════════════════════════
   FRAUD ALERT
═══════════════════════════════════════════════════════ */
function buildFraudResponse() {
  return {
    type: "fraud_alert",
    payload: {
      title:   "तुरंत रिपोर्ट करें — Report a Fraud",
      message: "Registration for ALL government schemes is 100% FREE. No agent, CSC operator, or middleman can legally charge you money.",
      steps: [
        "Do NOT pay any money to anyone",
        "Note the person's name, phone number, and location",
        "Call PM-KISAN fraud helpline: 155261",
        "Call Cyber Crime helpline: 1930",
        "File online at: cybercrime.gov.in",
      ],
      helplines: [
        { label: "PM-KISAN Fraud", number: "155261" },
        { label: "Cyber Crime",    number: "1930" },
        { label: "Consumer Help",  number: "1800-11-4000" },
      ],
    },
    meta: { intent: "fraud_report" },
  };
}

/* ═══════════════════════════════════════════════════════
   HELPLINE
═══════════════════════════════════════════════════════ */
function buildHelplineResponse(schemeRef) {
  const ALL = [
    { scheme: "PM-KISAN",    number: "155261 / 011-24300606", hours: "Mon–Sat, 9am–6pm" },
    { scheme: "PMFBY",       number: "1800-180-1551",         hours: "Mon–Sat, 9am–6pm" },
    { scheme: "PMSBY",       number: "1800-180-1111",         hours: "24×7" },
    { scheme: "PM Maandhan", number: "1800-267-6888",         hours: "Mon–Sat, 9am–6pm" },
    { scheme: "Cyber Crime", number: "1930",                  hours: "24×7" },
  ];
  const MAP = { pm_kisan: "PM-KISAN", pmfby: "PMFBY", pmsby: "PMSBY", pm_maandhan: "PM Maandhan" };
  const helplines = schemeRef && MAP[schemeRef]
    ? ALL.filter((h) => h.scheme === MAP[schemeRef])
    : ALL;

  return {
    type: "helpline",
    payload: {
      title: schemeRef ? `${MAP[schemeRef] || "Scheme"} Helpline` : "All Scheme Helplines",
      helplines,
    },
    meta: { intent: "helpline" },
  };
}

/* ═══════════════════════════════════════════════════════
   BUILD RESULTS
═══════════════════════════════════════════════════════ */
function buildResults(params) {
  const eligible  = checkEligibility(params);
  const ranked    = rankSchemes(eligible);
  const formatted = formatResponse(ranked, params);

  if (typeof formatted === "string") {
    return {
      type:    "no_schemes",
      payload: { message: formatted },
      meta:    { params, progress: buildProgress(params) },
    };
  }

  const summary = buildPersonalizedSummary(params, formatted);

  return {
    type: "schemes",
    payload: {
      count:           formatted.length,
      schemes:         formatted,
      headline:        summary.headline,
      subline:         summary.subline,
      priorityNote:    summary.priorityNote,
      urgencyNotices:  summary.urgencyNotices,
      maandhanCalc:    summary.maandhanCalc,
      firstActionPlan: summary.firstActionPlan,
    },
    meta: { params, progress: buildProgress(params), phase: "done" },
  };
}

/* ═══════════════════════════════════════════════════════
   PROGRESS STRIP DATA
═══════════════════════════════════════════════════════ */
function buildProgress(params) {
  const facts = [];
  if (params.isFarmer !== null) facts.push(params.isFarmer ? "🌾 Farmer" : "👤 Non-farmer");
  if (params.age      !== null) facts.push(`🎂 Age ${params.age}`);
  if (params.ownsLand !== null) {
    facts.push(params.ownsLand
      ? `🏡 Owns land${params.landAcres ? ` (${params.landAcres} ac)` : ""}`
      : "No land");
  }
  if (params.growsCrops !== null) {
    facts.push(params.growsCrops
      ? `🌱 Grows crops${params.cropType ? ` (${params.cropType})` : ""}`
      : "No crops");
  }
  if (params.hasBankAccount !== null) facts.push(params.hasBankAccount ? "🏦 Bank ✓" : "No bank");
  if (params.state)                   facts.push(`📍 ${params.state}`);
  if (params.aadhaarLinked === true)  facts.push("🔗 Aadhaar linked");
  return facts;
}

/* ═══════════════════════════════════════════════════════
   MAIN — generateReply
═══════════════════════════════════════════════════════ */
function generateReply(text, session = {}) {
  initSession(session);

  const { intent, subIntent } = detectIntent(text);

  // ── Special intents ─────────────────────────────────────────────────────
  if (intent === "fraud_report") return buildFraudResponse();
  if (intent === "helpline")     return buildHelplineResponse(subIntent);

  // ── Greeting: one response with welcome + first question embedded ────────
  if (intent === "greeting") {
    const firstQ = getNextQuestion(session.params);
    if (firstQ) session.lastAsked = firstQ.key;
    return buildGreeting(firstQ);
  }

  // ── If in follow-up phase, apply follow-up answer first ─────────────────
  if (session.phase === "followup" && session.lastFollowUp) {
    const updated = applyFollowUpAnswer(session.params, session.lastFollowUp, text);
    session.params = updated;
    session.lastFollowUp = null;
  }

  // ── Extract & merge from text ────────────────────────────────────────────
  const fresh    = extractParams(text, session.lastAsked);
  session.params = mergeParams(session.params, fresh);
  const params   = session.params;

  // ── REQUIRED QUESTIONS ───────────────────────────────────────────────────
  const nextRequired = getNextQuestion(params);
  if (nextRequired) {
    session.lastAsked    = nextRequired.key;
    session.lastFollowUp = null;
    session.phase        = "required";
    return {
      type: "question",
      payload: {
        question: nextRequired.question,
        hint:     nextRequired.hint,
        step:     nextRequired.step,
        total:    nextRequired.total,
      },
      meta: { phase: "required", progress: buildProgress(params) },
    };
  }

  // ── FOLLOW-UP QUESTIONS ──────────────────────────────────────────────────
  session.phase = "followup";
  const nextFup = getNextFollowUp(params, session.followUpsAsked);
  if (nextFup) {
    session.followUpsAsked.push(nextFup.key);
    session.lastFollowUp = nextFup.key;
    session.lastAsked    = null;
    return {
      type: "followup_question",
      payload: {
        question: nextFup.question,
        hint:     nextFup.hint,
        options:  nextFup.options,
        key:      nextFup.key,
      },
      meta: { phase: "followup", progress: buildProgress(params) },
    };
  }

  // ── ALL DONE — SHOW RESULTS ──────────────────────────────────────────────
  session.phase        = "done";
  session.lastAsked    = null;
  session.lastFollowUp = null;
  return buildResults(params);
}

module.exports = { generateReply };