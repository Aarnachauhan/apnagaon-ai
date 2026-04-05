import React from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./Mic.css";

const Mic = () => {
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
    } else {
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-IN"
      });
    }
  };

  return (
    <div className="mic-container">
      <button
        onClick={handleMicClick}
        className={`mic-btn ${listening ? "listening" : ""}`}
      >
        {listening ? "🎙 Listening..." : "🎤 Ask ApnaGaon AI"}
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