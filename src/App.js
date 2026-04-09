import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import ChatPage from "./components/ChatPage";

// 👇 import from second project (adjust paths if needed)
import { mandis } from "./data/mandisData";
import { getNearestMandis } from "./utils/getNearestMandis";
import "./App.css";

// 🏠 Home Page
function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
    </>
  );
}

// 🚜 New Mandi Page (from second project)
function MandiPage() {
  const [location, setLocation] = useState(null);
  const [crop, setCrop] = useState("wheat");
  const [quantity, setQuantity] = useState(10);

  // 📍 Get location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    });
  }, []);

  // 🧠 Get nearest mandis
  const processedMandis =
    location
      ? getNearestMandis(location, mandis, crop, quantity)
      : [];

  // 🏆 Best mandi
  const bestMandi =
    processedMandis.length > 0
      ? processedMandis.reduce((best, curr) =>
          curr.profit > best.profit ? curr : best
        )
      : null;

  // 📈 Trend logic
  const getTrend = (history) => {
    const first = history[0];
    const last = history[history.length - 1];

    if (last > first) return "⬆️ Increasing";
    if (last < first) return "⬇️ Decreasing";
    return "➡️ Stable";
  };

  return (
    <div style={{ padding: "20px" }}>
      <Navbar /> {/* optional but recommended for consistency */}

      <h1>Mandi Tracker 🚜</h1>

      {/* 🌾 Crop selection */}
      <label>Select Crop: </label>
      <select value={crop} onChange={(e) => setCrop(e.target.value)}>
        <option value="wheat">Wheat</option>
        <option value="rice">Rice</option>
        <option value="tomato">Tomato</option>
      </select>

      {/* 📦 Quantity */}
      <br /><br />
      <label>Quantity (quintals): </label>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />

      <h3>
        Location:{" "}
        {location
          ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
          : "Fetching..."}
      </h3>

      {bestMandi && <h2>🏆 Best: {bestMandi.name}</h2>}

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>State</th>
            <th>Distance</th>
            <th>Price</th>
            <th>Profit</th>
            <th>Trend</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {processedMandis.map((m, i) => (
            <tr
              key={i}
              style={{
                background:
                  bestMandi && m.name === bestMandi.name
                    ? "#d4f8d4"
                    : "white",
              }}
            >
              <td>{m.name}</td>
              <td>{m.state}</td>
              <td>{m.distance.toFixed(2)} km</td>
              <td>₹{m.price}</td>
              <td>₹{m.profit.toFixed(0)}</td>
              <td>{getTrend(m.priceHistory || [m.price])}</td>
              <td>{m.time.toFixed(2)} hrs</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔔 Smart Alert */}
      {bestMandi &&
        getTrend(bestMandi.priceHistory || [bestMandi.price]) ===
          "⬆️ Increasing" && (
          <h3 style={{ color: "green" }}>
            📢 Suggestion: Prices rising → Wait before selling
          </h3>
        )}
    </div>
  );
}

// 🚀 Main App with routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/mandi" element={<MandiPage />} /> {/* 👈 NEW ROUTE */}
    </Routes>
  );
}

export default App;