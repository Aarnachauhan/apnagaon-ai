export function getSeason(month, region) {
  const kharifMonths = ["jun", "jul", "aug", "sep", "oct"];
  const rabiMonths = ["nov", "dec", "jan", "feb", "mar"];

  // simple regional variation
  if (region === "south") {
    // longer kharif-like season
    if (kharifMonths.includes(month) || month === "may") return "kharif";
  }

  if (kharifMonths.includes(month)) return "kharif";
  if (rabiMonths.includes(month)) return "rabi";

  return "summer";
}