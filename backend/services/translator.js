/**
 * translator.js
 * Translates Hindi / Hinglish text to English using Google Translate.
 * Falls back silently to original text on any failure.
 */

let translate;

async function loadTranslate() {
  if (!translate) {
    const mod = await import("@vitalets/google-translate-api");
    translate = mod.translate;
  }
  return translate;
}

/**
 * Translate any text to English.
 * Returns original text if translation fails or text is already English.
 * @param {string} text
 * @returns {Promise<string>}
 */
async function toEnglish(text) {
  if (!text || typeof text !== "string") return text;

  // If text is mostly ASCII (already English / Hinglish), skip translate
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii / text.length < 0.2) return text;

  try {
    const fn = await loadTranslate();
    const result = await fn(text, { to: "en" });
    return result.text || text;
  } catch (err) {
    console.warn("⚠️ Translation failed, using original:", err.message);
    return text;
  }
}

module.exports = { toEnglish };