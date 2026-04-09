/**
 * schemesData.js
 * Central registry of all government schemes.
 * Each scheme defines:
 *  - eligibility(params) → boolean
 *  - whyEligible(params) → string[]  (human-readable reasons)
 *  - benefits, steps, warning, category
 */

const schemes = [
  {
    id: "pm_kisan",
    name: "PM-KISAN Samman Nidhi",
    category: "income_support",
    eligibility: (p) =>
      p.isFarmer === true &&
      p.ownsLand === true &&
      p.landAcres !== null &&
      p.landAcres > 0,
    whyEligible: (p) => {
      const reasons = [];
      if (p.isFarmer) reasons.push("You are a registered farmer");
      if (p.ownsLand) reasons.push("You own agricultural land");
      if (p.landAcres > 0) reasons.push(`Your land holding (${p.landAcres} acres) qualifies`);
      return reasons;
    },
    benefits: "₹6,000/year paid in 3 instalments of ₹2,000 directly to your bank account",
    steps: [
      "Visit nearest Common Service Centre (CSC)",
      "Carry Aadhaar card + land records (Khasra/Khatauni)",
      "CSC operator will register you on PM-KISAN portal",
      "Link your bank account (must be Aadhaar-linked)",
      "Money arrives in 30–60 days after verification",
    ],
    warning:
      "⚠️ FRAUD ALERT: Registration is FREE. No agent, middleman, or CSC operator can charge you money. If anyone asks for ₹200–₹500 'processing fee', report them immediately to 155261.",
    helpline: "PM-KISAN Helpline: 155261 | 011-24300606",
  },
  {
    id: "pm_maandhan",
    name: "PM Kisan Maandhan Yojana",
    category: "pension",
    eligibility: (p) =>
      p.isFarmer === true &&
      p.age !== null &&
      p.age >= 18 &&
      p.age <= 40 &&
      p.ownsLand === true,
    whyEligible: (p) => {
      const reasons = [];
      if (p.isFarmer) reasons.push("You are a farmer");
      if (p.age >= 18 && p.age <= 40)
        reasons.push(`Your age (${p.age}) is within the 18–40 eligibility range`);
      if (p.ownsLand) reasons.push("You own agricultural land (small/marginal farmer)");
      return reasons;
    },
    benefits:
      "₹3,000/month guaranteed pension after age 60. Government matches your monthly contribution.",
    steps: [
      "Visit CSC with Aadhaar + bank passbook",
      "Monthly contribution: ₹55–₹200 (depends on your age at enrolment)",
      "Contribution auto-debited from your bank account",
      "Pension starts automatically when you turn 60",
    ],
    warning:
      "⚠️ FRAUD ALERT: No private agent can enrol you. Only CSC centres are authorised. Never hand cash to anyone — contributions go directly from your bank account. Avoid 'guaranteed higher pension' scams.",
    helpline: "Helpline: 1800-267-6888",
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    category: "crop_insurance",
    eligibility: (p) =>
      p.isFarmer === true &&
      p.growsCrops === true,
    whyEligible: (p) => {
      const reasons = [];
      if (p.isFarmer) reasons.push("You are a farmer");
      if (p.growsCrops) reasons.push("You grow crops that qualify for insurance coverage");
      return reasons;
    },
    benefits:
      "Crop insurance against drought, flood, pest, and natural disasters. Premium as low as 1.5% for Rabi, 2% for Kharif crops.",
    steps: [
      "Apply before sowing season starts (deadlines vary by state)",
      "Visit bank (if you have KCC loan — automatic enrolment) or CSC",
      "Provide crop type, sowing area, and land documents",
      "Premium is deducted; government pays remaining subsidy",
      "Claim within 72 hours of crop loss via crop loss intimation app or CSC",
    ],
    warning:
      "⚠️ FRAUD ALERT: Check official premium rates on pmfby.gov.in before applying. Agents claiming lower premiums are scammers. Deadlines are strict — missing the sowing season window means no coverage. Never pay extra 'agent fees'.",
    helpline: "PMFBY Helpline: 1800-180-1551",
  },
  {
    id: "pmsby",
    name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    category: "accident_insurance",
    eligibility: (p) =>
      p.age !== null &&
      p.age >= 18 &&
      p.age <= 70 &&
      p.hasBankAccount === true,
    whyEligible: (p) => {
      const reasons = [];
      if (p.age >= 18 && p.age <= 70)
        reasons.push(`Your age (${p.age}) qualifies (18–70 years)`);
      if (p.hasBankAccount) reasons.push("You have a bank account for auto-debit");
      return reasons;
    },
    benefits:
      "₹2 lakh for accidental death or permanent total disability. ₹1 lakh for partial disability. Annual premium: only ₹20.",
    steps: [
      "Visit your bank or bank's mobile app / internet banking",
      "Enrol under PMSBY scheme",
      "₹20/year auto-debited from your account every June",
      "Nominee gets ₹2 lakh in case of accidental death",
    ],
    warning:
      "⚠️ FRAUD ALERT: This scheme is enrolled ONLY through your bank — no agents, no apps, no third parties. Never share your OTP, ATM PIN, or Aadhaar number with anyone claiming to enrol you. Bank employees do not need your PIN.",
    helpline: "PMSBY Helpline: 1800-180-1111 | 1800-110-001",
  },
];

module.exports = schemes;