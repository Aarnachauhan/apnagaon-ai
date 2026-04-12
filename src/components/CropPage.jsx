import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { getSeason } from "../utils/getSeason";
import { getRegion } from "../utils/getRegion";
import { recommendCrops } from "../utils/recommendationEngine";

function CropPage() {
  const [soil, setSoil] = useState("loamy");
  const [water, setWater] = useState("medium");

  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);

  const [results, setResults] = useState([]);

  // 📅 Auto detect current month (no state needed)
  const month = new Date()
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();

  // 📍 Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      setLocation({ lat, lon });

      const regionDetected = getRegion(lat, lon);
      setRegion(regionDetected);
    });
  }, []);

  // 🧠 Recommendation logic
  const handleRecommend = () => {
    if (!region) {
      alert("Location not detected yet. Please wait.");
      return;
    }

    const season = getSeason(month, region);

    const data = recommendCrops({
      soil,
      water,
      season,
      region,
    });

    setResults(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Navbar />

      <h1>🌱 Smart Crop Advisory</h1>

      {/* 📍 Auto detected info */}
      <h3>
        📍 Region: {region || "Detecting..."} <br />
        📅 Month: {month}
      </h3>

      {/* Inputs */}
      <div>
        <label>Soil Type: </label>
        <select value={soil} onChange={(e) => setSoil(e.target.value)}>
          <option value="loamy">Loamy</option>
          <option value="clayey">Clayey</option>
          <option value="sandy">Sandy</option>
        </select>

        <br /><br />

        <label>Water Availability: </label>
        <select value={water} onChange={(e) => setWater(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <br /><br />

        <button onClick={handleRecommend}>
          Get Recommendation
        </button>
      </div>

      {/* Results */}
      <div style={{ marginTop: "20px" }}>
        {results.map((crop, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              {crop.name} (Score: {crop.score})
            </h3>

           
            <p>⚠️ Risk: {crop.riskLevel}</p>
            <p>⏱ Growth: {crop.growthDays} days</p>

            <p>💰 Profit: ₹{crop.profit}</p>
<p>🌾 Yield: {crop.avgYield} quintals/acre</p>
<p>💸 Cost: ₹{crop.costPerAcre}</p>

            <p>💡 Why: {crop.reasons.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CropPage;