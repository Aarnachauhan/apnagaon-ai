export const crops = [
  {
    name: "Rice",
    regions: ["east", "south"],
    soil: ["clayey", "loamy"],
    water: "high",
    temperature: "hot",

    growthDays: 120,

    // 🧠 NEW
    costPerAcre: 25000,
    avgYield: 20, // quintals
    marketPrice: 2200, // ₹ per quintal

    riskLevel: "medium",
  },
  {
    name: "Wheat",
    regions: ["north"],
    soil: ["loamy", "sandy"],
    water: "medium",
    temperature: "cold",

    growthDays: 110,

    costPerAcre: 20000,
    avgYield: 18,
    marketPrice: 2100,

    riskLevel: "low",
  },
  {
    name: "Tomato",
    regions: ["north", "west"],
    soil: ["loamy"],
    water: "medium",
    temperature: "moderate",

    growthDays: 70,

    costPerAcre: 40000,
    avgYield: 25,
    marketPrice: 1500,

    riskLevel: "high",
  },
];