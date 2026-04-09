const states = ["Bihar", "Delhi", "Punjab", "Haryana"];

const baseLocations = {
  Bihar: { lat: 25.6, lon: 85.1 },
  Delhi: { lat: 28.6, lon: 77.2 },
  Punjab: { lat: 30.9, lon: 75.8 },
  Haryana: { lat: 29.0, lon: 76.0 },
};

function randomOffset() {
  return (Math.random() - 0.5) * 0.8; // spread mandis nearby
}

function randomPrice(base) {
  return base + Math.floor(Math.random() * 500);
}

export const mandis = [];

let id = 1;

states.forEach((state) => {
  const base = baseLocations[state];

  for (let i = 0; i < 25; i++) {
    mandis.push({
      name: `${state} Mandi ${id}`,
      state,
      lat: base.lat + randomOffset(),
      lon: base.lon + randomOffset(),
      prices: {
        wheat: randomPrice(2200),
        rice: randomPrice(2600),
        tomato: randomPrice(1800),
      },
      priceHistory: [
        randomPrice(2000),
        randomPrice(2100),
        randomPrice(2200),
        randomPrice(2300),
      ],
    });

    id++;
  }
});