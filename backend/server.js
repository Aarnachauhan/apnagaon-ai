const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

/* =========================
   🧠 RESPONSE ENGINE
========================= */
function generateReply(text) {
  if (!text) return "I didn't catch that. Please speak again.";

  const t = text.toLowerCase();

  if (t.includes("weather")) {
    return "Weather info will be available soon.";
  }

  if (t.includes("crop")) {
    return "You can grow rice, wheat, or pulses depending on the season.";
  }

  if (t.includes("hello") || t.includes("hi")) {
    return "Hello! How can I help you today?";
  }

  return "no response for this ";
}

/* =========================
   💬 CHAT ROUTE
========================= */
app.post("/chat", (req, res) => {
  const { message } = req.body;

  console.log("User message:", message);

  const reply = generateReply(message);

  res.json({ reply });
});

/* =========================
   🎤 STT ROUTE (VOSK)
========================= */
app.post("/stt", upload.single("audio"), (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = inputPath + ".wav";

    console.log("📥 Received audio:", inputPath);

    // 🔄 Convert WEBM → WAV
    ffmpeg(inputPath)
      .audioChannels(1)        // mono
      .audioFrequency(16000)   // 16kHz
      .format("wav")
      .on("end", () => {
        console.log("✅ Conversion done:", outputPath);

        // 🧠 Run Python Vosk
        const python = spawn("python", ["python/stt.py", outputPath]);

        let output = "";

        python.stdout.on("data", (data) => {
          output += data.toString();
        });

        python.stderr.on("data", (data) => {
          console.error("❌ Python error:", data.toString());
        });

        python.on("close", () => {
          try {
            const result = JSON.parse(output);

            console.log("🧾 STT result:", result);

            // 🧹 Cleanup temp files
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            res.json(result);
          } catch (err) {
            console.error("❌ JSON parse error:", err);

            res.status(500).json({
              error: "STT parsing failed",
              rawOutput: output
            });
          }
        });
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err);

        res.status(500).json({
          error: "Audio conversion failed"
        });
      })
      .save(outputPath);

  } catch (err) {
    console.error("❌ Server error:", err);

    res.status(500).json({
      error: "Something went wrong in STT route"
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});