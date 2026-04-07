const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const {
  generateReplyEnglish,
  generateReplyHindi,
} = require("./services/responseEngine");

const {
  toEnglish,
  toHindi,
} = require("./services/translator");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload
const upload = multer({ dest: "uploads/" });

//  Toggle this manually or later make dynamic
const isOnline = true;

//chat route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("🧾 Hindi Input:", message);

  try {
    if (isOnline) {
      //  Hindi → English
      const englishText = await toEnglish(message);
      console.log(" English:", englishText);

      //  Process in English
      const replyEnglish = generateReplyEnglish(englishText);
      console.log(" Reply EN:", replyEnglish);

      //  English → Hindi
      const finalReply = await toHindi(replyEnglish);
      console.log(" Reply HI:", finalReply);

      return res.json({ reply: finalReply });
    } else {
      //  Offline fallback
      const reply = generateReplyHindi(message);
      return res.json({ reply });
    }
  } catch (err) {
    console.error(" Error, fallback:", err);

    const fallback = generateReplyHindi(message);
    res.json({ reply: fallback });
  }
});

//STT route
app.post("/stt", upload.single("audio"), (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = inputPath + ".wav";

    console.log(" Received audio:", inputPath);

    // Convert to WAV
    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("end", () => {
        console.log(" Converted to WAV");

        const python = spawn("python", ["python/stt.py", outputPath]);

        let output = "";

        python.stdout.on("data", (data) => {
          output += data.toString();
        });

        python.stderr.on("data", (data) => {
          console.error(" Python error:", data.toString());
        });

        python.on("close", () => {
          try {
            const result = JSON.parse(output);

            console.log(" STT result:", result);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            res.json(result);
          } catch (err) {
            console.error(" Parse error:", err);
            res.status(500).json({ error: "STT parsing failed" });
          }
        });
      })
      .on("error", (err) => {
        console.error(" FFmpeg error:", err);
        res.status(500).json({ error: "Audio conversion failed" });
      })
      .save(outputPath);

  } catch (err) {
    console.error(" STT route error:", err);
    res.status(500).json({ error: "STT route failed" });
  }
});

//starts server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});