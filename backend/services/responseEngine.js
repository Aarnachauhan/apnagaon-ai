//  English logic 
function generateReplyEnglish(text) {
  if (!text) {
    return "I didn't catch that. Please try again.";
  }

  const t = text.toLowerCase();

  if (t.includes("crop")) {
    return "You can grow rice, wheat or pulses depending on season.";
  }

  if (t.includes("weather")) {
    return "Weather information will be available soon.";
  }

  if (t.includes("government") || t.includes("scheme")) {
    return "There are schemes like PM Kisan and crop insurance available.";
  }

  if (t.includes("hello") || t.includes("hi")) {
    return "Hello! How can I help you?";
  }

  return "I am still learning. Please ask differently.";
}

//  Hindi fallback (offline)
function generateReplyHindi(text) {
  if (!text) {
    return "मुझे समझ नहीं आया, कृपया फिर से बोलें।";
  }

  const t = text.toLowerCase();

  if (t.includes("फसल") || t.includes("खेती")) {
    return "आप गेहूं, धान या दाल की खेती कर सकते हैं।";
  }

  if (t.includes("मौसम") || t.includes("बारिश")) {
    return "मौसम की जानकारी जल्द उपलब्ध होगी।";
  }

  if (t.includes("योजना") || t.includes("सरकार")) {
    return "सरकार की योजनाएं जैसे पीएम किसान योजना उपलब्ध हैं।";
  }

  if (t.includes("नमस्ते") || t.includes("हेलो")) {
    return "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?";
  }

  return "मैं अभी सीख रहा हूँ, कृपया फिर से पूछें।";
}

module.exports = {
  generateReplyEnglish,
  generateReplyHindi,
};