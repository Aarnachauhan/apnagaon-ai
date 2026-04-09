/**
 * server.js
 * Express backend for ApnaGaon Rural Intelligence System.
 *
 * CHANGES:
 * - Forwards the new structured { type, payload, meta } response objects
 *   directly to the client (no manual reshaping needed)
 * - Keeps in-memory session store (replace with Redis in production)
 * - Translation is non-blocking and never breaks the pipeline
 * - /status route exposes session count for monitoring
 */

const express = require("express");
const cors    = require("cors");

const { generateReply } = require("./services/responseEngine");
const { toEnglish }     = require("./services/translator");

const app = express();

/* ── MIDDLEWARE ─────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── SESSION STORE ──────────────────────────────────────────────────────── */
// Key: sessionId | Value: { params: {...}, lastAsked: string|null }
const sessions = new Map();

function getSession(sessionId) {
  if (!sessionId) return {}; // stateless fallback

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { params: null, lastAsked: null });
  }
  return sessions.get(sessionId);
}

/* ── HEALTH CHECK ───────────────────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.json({
    status:  "ok",
    service: "ApnaGaon Rural Intelligence System",
    version: "3.0.0",
  });
});

/* ── STATUS (for monitoring) ────────────────────────────────────────────── */
app.get("/status", (req, res) => {
  res.json({
    activeSessions: sessions.size,
    uptime: process.uptime(),
  });
});

/* ── CHAT ROUTE ─────────────────────────────────────────────────────────── */
app.post("/chat", async (req, res) => {
  console.log("🔥 HIT /chat");

  try {
    const { message, sessionId } = req.body;

    // ── Input validation ────────────────────────────────────────────────
    if (!message || typeof message !== "string" || message.trim().length < 1) {
      return res.json({
        type:    "question",
        payload: { question: "कृपया साफ़ बोलें या थोड़ा और बताएं। (Please say a little more.)" },
        meta:    {},
      });
    }

    const session = getSession(sessionId);
    console.log(`📥 SESSION: ${sessionId} | MSG: ${message.substring(0, 60)}`);

    // ── Translate (non-blocking) ─────────────────────────────────────────
    let processedText = message.trim();
    try {
      processedText = await toEnglish(message.trim());
    } catch {
      console.warn("⚠️ Translation failed — using original text");
    }

    console.log("🧠 PROCESSING:", processedText);

    // ── Generate reply ───────────────────────────────────────────────────
    let reply;
    try {
      reply = generateReply(processedText, session);
    } catch (err) {
      console.error("❌ Engine error:", err);
      return res.json({
        type:    "question",
        payload: { question: "कुछ गलती हुई, फिर से कोशिश करें। (Something went wrong, please try again.)" },
        meta:    {},
      });
    }

    console.log("✅ ENGINE OUTPUT TYPE:", reply.type);

    // The new engine always returns a structured object — forward it directly
    return res.json(reply);

  } catch (err) {
    console.error("❌ UNHANDLED ERROR:", err);
    return res.json({
      type:    "question",
      payload: { question: "Server error. कृपया फिर से कोशिश करें।" },
      meta:    {},
    });
  }
});

/* ── SESSION RESET ──────────────────────────────────────────────────────── */
app.post("/reset", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    return res.json({ status: "reset", sessionId });
  }
  return res.json({ status: "no session found", sessionId });
});

/* ── START SERVER ───────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ApnaGaon server running on http://localhost:${PORT}`);
  console.log(`📋 Routes: POST /chat | POST /reset | GET / | GET /status`);
});