import React from "react";
import "./Hero.css";
import Mic from "./Mic";
import bgImg from "../assets/bg.png";

const Hero = () => {
  return (
    <div className="hero-container">

      <div className="hero-top">

        {/* LEFT */}
        <div className="hero-left">
          <h1>
            Smart advice.<br />
            <span>Stronger harvests.</span>
          </h1>

          <p>
  Voice-first AI for farmers. <br />
  Ask anything. Get answers. <br />
  Works offline. Works online.
</p>

          <Mic />
        </div>

        {/* RIGHT IMAGE */}
        <div className="hero-right">
          <img src={bgImg} alt="farm" />
        </div>

      </div>

    </div>
  );
};

export default Hero;