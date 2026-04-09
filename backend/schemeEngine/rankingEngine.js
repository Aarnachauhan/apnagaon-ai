/**
 * rankingEngine.js
 * Ranks eligible schemes by priority/relevance to the user.
 *
 * Ranking logic:
 *  1. Income support / cash transfer schemes first (most immediate impact)
 *  2. Insurance schemes (protect against loss)
 *  3. Pension schemes (long-term benefit)
 *  4. Within category: sort by estimated annual benefit value
 */

// Category priority order (lower number = higher priority)
const CATEGORY_PRIORITY = {
  income_support: 1,
  crop_insurance: 2,
  accident_insurance: 3,
  pension: 4,
};

// Estimated annual benefit in rupees (for tie-breaking)
const BENEFIT_VALUE = {
  pm_kisan: 6000,
  pmsby: 200000,   // lump sum on claim, high value insurance
  pmfby: 50000,    // average claim value
  pm_maandhan: 36000, // ₹3000/month × 12
};

/**
 * @param {Array<{ scheme: object, reasons: string[] }>} eligibleResults
 * @returns {Array<{ scheme: object, reasons: string[] }>} ranked
 */
function rankSchemes(eligibleResults) {
  if (!eligibleResults || eligibleResults.length === 0) return [];

  return [...eligibleResults].sort((a, b) => {
    const priA = CATEGORY_PRIORITY[a.scheme.category] ?? 99;
    const priB = CATEGORY_PRIORITY[b.scheme.category] ?? 99;

    if (priA !== priB) return priA - priB;

    // Same category → sort by benefit value descending
    const valA = BENEFIT_VALUE[a.scheme.id] ?? 0;
    const valB = BENEFIT_VALUE[b.scheme.id] ?? 0;
    return valB - valA;
  });
}

module.exports = { rankSchemes };