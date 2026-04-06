import React, { useState, useRef } from "react";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // 🎤 TOGGLE RECORDING (FIXED)
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = handleAudioSend;

        mediaRecorder.start();
        setIsRecording(true);

      } catch (err) {
        console.error("Mic error:", err);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // 📤 SEND AUDIO
  const handleAudioSend = async () => {
    const blob = new Blob(chunksRef.current);

    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");

    try {
      // STT
      const res = await fetch("http://localhost:5000/stt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const userText = data.text;

      setMessages((prev) => [...prev, { sender: "user", text: userText }]);

      // CHAT RESPONSE
      const chatRes = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      const chatData = await chatRes.json();

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: chatData.reply },
      ]);

    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>ApnaGaon AI</h2>

      <div>
        {messages.map((msg, i) => (
          <p key={i}>
            <b>{msg.sender}:</b> {msg.text}
          </p>
        ))}
      </div>

      {/* 🔥 UPDATED BUTTON */}
      <button onClick={toggleRecording}>
        {isRecording ? "Stop Recording" : "Start Talking"}
      </button>
    </div>
  );
};

export default ChatPage;