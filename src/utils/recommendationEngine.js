import { crops } from "../data/cropRules";

export function recommendCrops(input) {
  const { season, soil, water } = input;

  let results = [];

  crops.forEach((crop) => {
    let score = 0;
    let reasons = [];

    // 🌦 Season match
    if (crop.season?.includes(season)) {
      score += 3;
      reasons.push("Suitable season");
    }

    // 🌱 Soil match
    if (crop.soil.includes(soil)) {
      score += 3;
      reasons.push(`${soil} soil is suitable`);
    }

    // 💧 Water match
    if (crop.water === water) {
      score += 2;
      reasons.push(`Needs ${crop.water} water`);
    }

    // 💰 Profit calculation (✅ correct place)
    const revenue = crop.avgYield * crop.marketPrice;
    const profit = revenue - crop.costPerAcre;

    // 💰 Profit scoring
    if (profit > 20000) {
      score += 3;
      reasons.push("High profit potential");
    } else if (profit > 10000) {
      score += 2;
      reasons.push("Moderate profit");
    } else {
      reasons.push("Low profit margin");
    }

    // 📈 Extra boost
    if (crop.profitLevel === "high") {
      score += 2;
    }

    results.push({
      ...crop,
      score,
      profit,
      reasons,
    });
  });

  // ✅ sort AFTER loop
  results.sort((a, b) => b.score - a.score);

  return results;
}