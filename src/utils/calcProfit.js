

export function calculateProfit(price, distance, quantity) {
  const transportCost = distance * 10;
  return price * quantity - transportCost;
}