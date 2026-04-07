const { translate } = require("@vitalets/google-translate-api");

// Hindi → English
async function toEnglish(text) {
  const res = await translate(text, { to: "en" });
  return res.text;
}

// English → Hindi
async function toHindi(text) {
  const res = await translate(text, { to: "hi" });
  return res.text;
}

module.exports = {
  toEnglish,
  toHindi,
};