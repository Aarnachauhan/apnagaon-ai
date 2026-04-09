import { getDistance } from "./distance";

export function getNearestMandis(userLocation, mandis, crop, quantity) {
  const enriched = mandis.map((m) => {
    const distance = getDistance(
      userLocation.lat,
      userLocation.lon,
      m.lat,
      m.lon
    );

    const avgSpeed = 40; // km/h
    const time = distance / avgSpeed;

    const price = m.prices[crop];
    const transportCost = distance * 10;
    const profit = price * quantity - transportCost;

    return { ...m, distance, time, price, profit };
  });

  // Step 1: nearest
  enriched.sort((a, b) => a.distance - b.distance);

  // Step 2: take 5
  const nearestFive = enriched.slice(0, 5);

  // Step 3: sort by profit
  nearestFive.sort((a, b) => b.profit - a.profit);

  return nearestFive;
}