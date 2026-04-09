/**
 * personalizationEngine.js
 * NEW FILE — src/schemeEngine/personalizationEngine.js
 *
 * Turns raw eligibility results into a rich, personalized narrative.
 * This is what separates ApnaGaon from a plain if-else matcher.
 *
 * Exports:
 *   buildPersonalizedSummary(params, rankedSchemes) → PersonalizedResult
 *   calcMaandhanContribution(age) → { monthly, totalYears, totalPaid }
 *   getUrgencyNotices(params, schemes) → UrgencyNotice[]
 *   buildFirstActionPlan(params, topScheme) → string[]
 */

/* ═══════════════════════════════════════════════════════
   MAANDHAN CONTRIBUTION TABLE
   Official table from pmkmy.gov.in (age 18–40)
   Monthly contribution in rupees.
═══════════════════════════════════════════════════════ */
const MAANDHAN_CONTRIBUTION = {
  18: 55,  19: 58,  20: 61,  21: 64,  22: 68,
  23: 72,  24: 76,  25: 80,  26: 85,  27: 90,
  28: 95,  29: 100, 30: 105, 31: 110, 32: 120,
  33: 130, 34: 140, 35: 150, 36: 160, 37: 170,
  38: 180, 39: 190, 40: 200,
};

/**
 * Calculate Maandhan contribution details for a given age.
 * @param {number} age
 * @returns {{ monthly: number, yearsLeft: number, totalPaid: number, govtPays: number }}
 */
function calcMaandhanContribution(age) {
  const monthly = MAANDHAN_CONTRIBUTION[age] || null;
  if (!monthly) return null;

  const yearsLeft   = 60 - age;
  const totalMonths = yearsLeft * 12;
  const totalPaid   = monthly * totalMonths;
  // Government matches every rupee you put in
  const govtPays    = totalPaid;

  return {
    monthly,
    yearsLeft,
    totalPaid,
    govtPays,
    pensionPerMonth: 3000,
    breakEvenMonths: Math.ceil(totalPaid / 3000), // months of pension to recover investment
  };
}

/* ═══════════════════════════════════════════════════════
   PMFBY DEADLINE AWARENESS
   Rough national cutoffs (state-level varies but these
   are the most common deadlines).
═══════════════════════════════════════════════════════ */
function getPMFBYDeadlineNotice() {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1-indexed

  // Kharif season: sow June–July, deadline ~July 31
  // Rabi season:   sow Oct–Nov,  deadline ~Dec 15
  if (month >= 5 && month <= 7) {
    const daysLeft = Math.ceil((new Date(now.getFullYear(), 6, 31) - now) / 86400000);
    if (daysLeft > 0 && daysLeft <= 45) {
      return {
        urgent: true,
        message: `⏰ Kharif deadline alert: PMFBY enrollment closes around July 31 — only ~${daysLeft} days left. Apply NOW at your nearest bank or CSC.`,
      };
    }
    return {
      urgent: false,
      message: "Kharif season is starting. This is a good time to enroll in PMFBY crop insurance.",
    };
  }

  if (month >= 10 && month <= 12) {
    const daysLeft = Math.ceil((new Date(now.getFullYear(), 11, 15) - now) / 86400000);
    if (daysLeft > 0 && daysLeft <= 45) {
      return {
        urgent: true,
        message: `⏰ Rabi deadline alert: PMFBY enrollment closes around Dec 15 — only ~${daysLeft} days left. Apply NOW.`,
      };
    }
    return {
      urgent: false,
      message: "Rabi season is approaching. Good time to enroll in PMFBY crop insurance before the December deadline.",
    };
  }

  return {
    urgent: false,
    message: "Check your state's PMFBY deadline at pmfby.gov.in before the next sowing season.",
  };
}

/* ═══════════════════════════════════════════════════════
   URGENCY NOTICES
   Time-sensitive or age-sensitive warnings that make the
   advice feel genuinely personal and proactive.
═══════════════════════════════════════════════════════ */
/**
 * @param {object} params
 * @param {string[]} schemeIds - list of eligible scheme IDs
 * @returns {Array<{ level: "high"|"medium"|"low", message: string }>}
 */
function getUrgencyNotices(params, schemeIds) {
  const notices = [];

  // Maandhan age window closing
  if (schemeIds.includes("pm_maandhan") && params.age) {
    if (params.age >= 38 && params.age <= 40) {
      notices.push({
        level:   "high",
        message: `⚠️ आपकी उम्र ${params.age} है — PM Maandhan के लिए enrollment window बंद होने वाली है (cutoff: 40 years). तुरंत CSC जाएं!`,
      });
    } else if (params.age >= 35) {
      notices.push({
        level:   "medium",
        message: `📅 आप ${60 - params.age} साल में ₹3,000/month pension पाएंगे — जितना जल्दी join करें, उतना कम contribution देना होगा.`,
      });
    }
  }

  // Maandhan just missed (age 41-45) — suggest PMSBY instead
  if (!schemeIds.includes("pm_maandhan") && params.age > 40 && params.age <= 70 && params.hasBankAccount) {
    notices.push({
      level:   "medium",
      message: `PM Maandhan ke liye age limit 40 saal hai — aap miss ho gaye. But PMSBY (₹2 lakh accident insurance in ₹20/year) abhi bhi le sakte hain.`,
    });
  }

  // PMFBY deadline
  if (schemeIds.includes("pmfby")) {
    const deadline = getPMFBYDeadlineNotice();
    notices.push({ level: deadline.urgent ? "high" : "low", message: deadline.message });
  }

  // PM-KISAN installment timing
  if (schemeIds.includes("pm_kisan")) {
    const now   = new Date();
    const month = now.getMonth() + 1;
    // Instalments: Apr-Jul, Aug-Nov, Dec-Mar
    if ([4, 8, 12].includes(month)) {
      notices.push({
        level:   "medium",
        message: "💰 PM-KISAN installment month hai! Agar already registered hain, toh bank check karein. Naye registration pe 30–60 din lagte hain.",
      });
    }
  }

  return notices;
}

/* ═══════════════════════════════════════════════════════
   FIRST ACTION PLAN
   A personalized "do this first" ordered checklist based
   on the user's specific situation.
═══════════════════════════════════════════════════════ */
/**
 * @param {object} params
 * @param {object} topScheme - highest-ranked eligible scheme card
 * @returns {string[]} ordered action items
 */
function buildFirstActionPlan(params, topScheme) {
  const steps = [];

  // Step 1: Documents to gather
  const docs = ["Aadhaar card (आधार कार्ड)"];
  if (params.isFarmer && params.ownsLand) docs.push("Land records / Khasra-Khatauni");
  if (params.hasBankAccount)              docs.push("Bank passbook (first page)");
  if (params.isFarmer)                    docs.push("Recent passport-size photo");

  steps.push(`📁 Gather documents: ${docs.join(", ")}`);

  // Step 2: Aadhaar-bank link check
  if (params.hasBankAccount) {
    steps.push("🔗 Confirm your bank account is Aadhaar-linked (call your bank or check at ATM → 'Services' menu)");
  }

  // Step 3: Find CSC
  steps.push("🏢 Find your nearest CSC: visit locator.csccloud.in or search 'Jan Seva Kendra near me'");

  // Step 4: Scheme-specific action
  if (topScheme?.id === "pm_kisan") {
    steps.push("🌾 At CSC: ask specifically for 'PM-KISAN registration'. Bring Khasra number. It is completely FREE.");
  } else if (topScheme?.id === "pmfby") {
    steps.push("🌾 At your bank branch: ask for 'PMFBY crop insurance' before the season deadline. Show your KCC if you have one — enrollment may be automatic.");
  } else if (topScheme?.id === "pmsby") {
    steps.push("🏦 At your bank (or bank's mobile app): search for 'PMSBY' or 'Suraksha Bima'. Annual premium is just ₹20.");
  } else if (topScheme?.id === "pm_maandhan") {
    steps.push("🏢 At CSC: ask for 'PM Kisan Maandhan enrollment'. Bring Aadhaar + bank passbook. Contribution is auto-debited monthly — no manual payment needed.");
  }

  // Step 5: Safety reminder
  steps.push("🚫 Safety: Registration for ALL these schemes is FREE. Never pay any agent or middleman.");

  return steps;
}

/* ═══════════════════════════════════════════════════════
   BUILD PERSONALIZED SUMMARY
   Master function that creates the full rich response.
═══════════════════════════════════════════════════════ */

/**
 * @param {object} params - collected user params
 * @param {Array} rankedSchemes - formatted scheme cards (from formatter.js)
 * @returns {{
 *   headline: string,
 *   subline: string,
 *   profileSummary: string,
 *   urgencyNotices: Array,
 *   maandhanCalc: object|null,
 *   firstActionPlan: string[],
 *   priorityNote: string|null,
 * }}
 */
function buildPersonalizedSummary(params, rankedSchemes) {
  const schemeIds = rankedSchemes.map((s) => s.id);
  const count     = rankedSchemes.length;
  const topScheme = rankedSchemes[0] || null;

  // ── Profile summary sentence ─────────────────────────────────────────────
  const profileParts = [];
  if (params.isFarmer === true)    profileParts.push("farmer");
  if (params.isFarmer === false)   profileParts.push("non-farmer");
  if (params.age)                  profileParts.push(`${params.age} years old`);
  if (params.ownsLand === true)    profileParts.push(params.landAcres ? `${params.landAcres} acres of land` : "own land");
  if (params.ownsLand === false)   profileParts.push("no owned land");
  if (params.growsCrops === true)  profileParts.push("grows crops");
  if (params.hasBankAccount===true) profileParts.push("bank account");

  const profileSummary = profileParts.length
    ? `Based on your profile (${profileParts.join(", ")})`
    : "Based on your profile";

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline, subline;

  if (count === 0) {
    headline = "No schemes found right now";
    subline  = "Your profile doesn't match current scheme criteria, but this can change. Call 1800-180-1551 for more help.";
  } else if (count === 1) {
    headline = `1 scheme found for you — ${topScheme.name}`;
    subline  = `${profileSummary}, you qualify for this benefit. Here's everything you need to know.`;
  } else {
    headline = `${count} schemes found for you`;
    subline  = `${profileSummary}, you are eligible for multiple government benefits. We've ranked them by what will help you most right now.`;
  }

  // ── Priority note (if 2+ schemes, explain why top one is first) ──────────
  let priorityNote = null;
  if (count >= 2) {
    const cats = rankedSchemes.map((s) => s.category);
    if (cats[0] === "income_support") {
      priorityNote = `💡 We're showing PM-KISAN first because it puts ₹6,000 directly in your account — no waiting for a claim or event. Apply for this first, then come back for the others.`;
    } else if (cats[0] === "crop_insurance") {
      const deadline = getPMFBYDeadlineNotice();
      if (deadline.urgent) {
        priorityNote = `💡 We're showing PMFBY first because the deadline is approaching — this is time-sensitive. Apply for the others after.`;
      }
    }
  }

  // ── Maandhan calculation ──────────────────────────────────────────────────
  let maandhanCalc = null;
  if (schemeIds.includes("pm_maandhan") && params.age) {
    maandhanCalc = calcMaandhanContribution(params.age);
  }

  // ── Urgency notices ───────────────────────────────────────────────────────
  const urgencyNotices = getUrgencyNotices(params, schemeIds);

  // ── First action plan ─────────────────────────────────────────────────────
  const firstActionPlan = buildFirstActionPlan(params, topScheme);

  return {
    headline,
    subline,
    profileSummary,
    urgencyNotices,
    maandhanCalc,
    firstActionPlan,
    priorityNote,
  };
}

module.exports = {
  buildPersonalizedSummary,
  calcMaandhanContribution,
  getUrgencyNotices,
  buildFirstActionPlan,
};