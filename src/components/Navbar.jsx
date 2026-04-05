import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="logo">🌿 ApnaGaon AI</div>
      <button className="lang-btn">
        🌐 English ▾
      </button>
    </div>
  );
};

export default Navbar;