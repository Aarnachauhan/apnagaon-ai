/**
 * formatter.js
 * Converts ranked eligible scheme results into structured response objects
 * ready for the frontend to render.
 *
 * Each output card includes:
 *  - name, benefits
 *  - why the user is eligible (personalised)
 *  - application steps
 *  - nearest center info
 *  - fraud warning
 *  - helpline number
 */

/**
 * Format a list of ranked eligible scheme results into response cards.
 * @param {Array<{ scheme: object, reasons: string[] }>} rankedResults
 * @param {object} params - user params (for personalization)
 * @returns {string | Array<object>}
 */
function formatResponse(rankedResults, params = {}) {
  if (!rankedResults || rankedResults.length === 0) {
    return buildNoSchemesMessage(params);
  }

  return rankedResults.map(({ scheme, reasons }, index) => ({
    rank: index + 1,
    id: scheme.id,
    name: scheme.name,
    category: scheme.category,
    benefits: scheme.benefits,
    whyEligible: reasons,
    applicationSteps: scheme.steps,
    nearestCenter: getNearestCenter(scheme),
    fraudWarning: scheme.warning,
    helpline: scheme.helpline,
  }));
}

/**
 * Returns the nearest center / application channel for a scheme.
 * @param {object} scheme
 * @returns {string}
 */
function getNearestCenter(scheme) {
  const centerMap = {
    pm_kisan:
      "🏢 Visit your nearest Common Service Centre (CSC / Jan Seva Kendra). Find it at: locator.csccloud.in",
    pm_maandhan:
      "🏢 Visit your nearest CSC centre. Bring Aadhaar + bank passbook. Find CSC at: locator.csccloud.in",
    pmfby:
      "🏦 Visit your nearest bank branch (especially if you have a Kisan Credit Card) OR nearest CSC centre.",
    pmsby:
      "🏦 Visit your bank branch directly, or use your bank's mobile app / internet banking to enrol.",
  };

  return (
    centerMap[scheme.id] ||
    "🏢 Visit your nearest Common Service Centre (CSC / Jan Seva Kendra)"
  );
}

/**
 * Builds a contextual 'no schemes found' message.
 * @param {object} params
 * @returns {string}
 */
function buildNoSchemesMessage(params) {
  const parts = [];

  parts.push("आपके प्रोफ़ाइल के लिए अभी कोई योजना नहीं मिली।");
  parts.push("(No schemes found matching your current profile.)");

  if (params.age !== null && params.age > 70) {
    parts.push(
      "Note: PMSBY (accident insurance) is available only up to age 70."
    );
  }
  if (params.isFarmer === false) {
    parts.push(
      "Most schemes listed are for farmers. PMSBY (accident insurance) is available to all citizens aged 18–70 with a bank account."
    );
  }

  parts.push("Please call 1800-180-1551 for more help.");
  return parts.join(" ");
}

module.exports = { formatResponse };