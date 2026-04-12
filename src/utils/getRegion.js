export function getRegion(lat, lon) {
  // very rough India mapping (can refine later)

  if (lat > 25) return "north";
  if (lat < 15) return "south";
  if (lon > 85) return "east";
  return "west";
}