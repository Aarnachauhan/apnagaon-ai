/**
 * eligibilityEngine.js — UNCHANGED from v2, works with new param extractor.
 * Copy this into schemeEngine/eligibilityEngine.js
 */

const schemes = require("./schemesData");

function checkEligibility(params) {
  const results = [];

  for (const scheme of schemes) {
    try {
      const isEligible = scheme.eligibility(params);
      if (isEligible) {
        const reasons = typeof scheme.whyEligible === "function"
          ? scheme.whyEligible(params)
          : ["You meet the criteria for this scheme"];
        results.push({ scheme, reasons });
      }
    } catch (err) {
      console.warn(`⚠️ Eligibility check failed for ${scheme.id}:`, err.message);
    }
  }

  return results;
}

module.exports = { checkEligibility };