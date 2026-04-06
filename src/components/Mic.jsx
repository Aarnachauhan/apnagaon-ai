import React from "react";
import { useNavigate } from "react-router-dom";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./Mic.css";

const Mic = () => {
  const navigate = useNavigate(); // ✅ correct place

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <p>Browser doesn't support speech recognition.</p>;
  }

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    }
    navigate("/chat");
  };

  return (
    <div className="mic-container">
      <button
        onClick={handleMicClick}
        className={`mic-btn ${listening ? "listening" : ""}`}
      >
        🎤 Ask ApnaGaon AI
      </button>

      <div className="mic-output">
        {transcript || "Your voice will appear here..."}
      </div>

      <button onClick={resetTranscript} className="mic-reset">
        Reset
      </button>
    </div>
  );
};

export default Mic;