export async function getMandis() {
  return [
    {
      name: "Azadpur Mandi",
      lat: 28.7041,
      lon: 77.1025,
      prices: {
        wheat: 2500,
        rice: 3000,
        tomato: 1800,
      },
      priceHistory: [2300, 2400, 2500, 2550],
    },
    {
      name: "Karnal Mandi",
      lat: 29.6857,
      lon: 76.9905,
      prices: {
        wheat: 2700,
        rice: 3100,
        tomato: 2000,
      },
      priceHistory: [2500, 2600, 2650, 2700],
    },
    {
      name: "Panipat Mandi",
      lat: 29.3909,
      lon: 76.9635,
      prices: {
        wheat: 2600,
        rice: 2900,
        tomato: 1900,
      },
      priceHistory: [2400, 2500, 2550, 2600],
    },
  ];
}