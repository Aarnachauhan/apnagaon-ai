import React from "react";
import { Link } from "react-router-dom";
import "./Features.css";

const Features = () => {
  return (
    <div className="features-section">

      {/* TOP CARDS */}
      <div className="features-grid">

        <div className="feature-card">
          <div className="icon-circle">🌿</div>
          <h3>Crop Advisory</h3>
          <p>Ask about any crop problem. Get one clear action.</p>
          <div className="bottom-icon">🌱</div>
        </div>

        {/* ✅ CLICKABLE MANDI CARD */}
        <Link 
          to="/mandi" 
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="feature-card">
            <div className="icon-circle">💰</div>
            <h3>Mandi Tracker</h3>
            <p>Compare prices from nearby mandis and sell at the right time.</p>
            <div className="bottom-icon">🏪</div>
          </div>
        </Link>

        <div className="feature-card">
          <div className="icon-circle">📋</div>
          <h3>Scheme Navigator</h3>
          <p>Answer 4 questions. Find schemes you qualify for + fraud warnings.</p>
          <div className="bottom-icon">🛡️</div>
        </div>

      </div>

      {/* BOTTOM BANNER */}
      <div className="voice-banner">
        <div className="banner-left">🌿</div>
        <div className="banner-text">
          <h2>Your voice. Our AI.</h2>
          <p>Better decisions, every day.</p>
        </div>
      </div>

    </div>
  );
};

export default Features;