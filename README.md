# 🌱 ApnaGaon AI – Offline Voice Assistant for Farmers

ApnaGaon AI is an offline-first voice-based assistant that helps farmers discover government schemes using speech input.

---

## 🚀 Features

* 🎤 Voice input using browser mic
* 🧠 Offline Speech-to-Text using Vosk
* 🌐 Optional translation (fallback-safe)
* 📊 Rule-based scheme recommendation engine
* 💬 Chat-style UI (voice + text)
* 📴 Works even without internet (core flow)

---

## 🏗️ Project Structure

```
apnagaon-ai/
├── backend/
│   ├── server.js
│   ├── services/
│   ├── python/
│   │   ├── stt.py
│   │   └── model/
│   └── uploads/
├── src/
│   ├── components/
│   ├── pages/
│   └── App.js
```

---

## ⚙️ Backend Setup (Node + Express)

### 1. Navigate to backend

```
cd backend
```

### 2. Install dependencies

```
npm install express cors multer fluent-ffmpeg
npm install @vitalets/google-translate-api
```

---

## 🐍 Python Setup (Vosk STT)

### 1. Install Python packages

```
pip install vosk
```

---

### 2. Download Vosk Hindi Model

Download:
👉 https://alphacephei.com/vosk/models

Use:

```
vosk-model-small-hi-0.22
```

---

### 3. Place model here:

```
backend/python/model/vosk-model-small-hi-0.22/
```

---

## 🎧 FFmpeg Setup (REQUIRED)

Vosk needs audio conversion.

### Windows:

* Download FFmpeg
* Add to PATH

Check:

```
ffmpeg -version
```

---

## ▶️ Start Backend

```
node server.js
```

You should see:

```
🚀 Server running on http://localhost:5000
```

---

## ⚛️ Frontend Setup (React)

### 1. Go to root folder

```
cd ..
```

### 2. Install dependencies

```
npm install
```

---

### 3. Install required packages

```
npm install react-router-dom
```

---

### 4. Start frontend

```
npm start
```

---

## 🔗 API Endpoints

### POST `/chat`

Request:

```json
{
  "message": "क्या योजना है"
}
```

Response:

```json
{
  "type": "text",
  "reply": "क्या आप किसान हैं?"
}
```

---

### POST `/stt`

* Accepts audio file
* Returns recognized Hindi text

---

## ⚠️ Important Notes

### 1. Translation API limits

* Google translate is unofficial
* Can fail with `Too Many Requests`
* System automatically falls back to Hindi

---

### 2. Offline Capability

| Feature     | Works Offline |
| ----------- | ------------- |
| STT (Vosk)  | ✅             |
| Rule Engine | ✅             |
| Translation | ❌ (optional)  |

---

### 3. Known Limitations

* No session memory (chat resets every message)
* Limited Hindi NLP understanding
* Rule-based responses only

---

## 🧠 Future Improvements

* Add session memory
* Improve Hindi NLP
* Add more schemes
* Add voice output (TTS)
* Add location-based recommendations

---

## 🛠️ Tech Stack

* React (Frontend)
* Node.js + Express (Backend)
* Vosk (Offline Speech Recognition)
* FFmpeg (Audio Processing)

---

## 👨‍💻 Author

Built for rural accessibility and offline-first AI systems.

---

## ⚡ Quick Start (TL;DR)

```
# Backend
cd backend
npm install
node server.js

# Frontend
cd ..
npm install
npm start
```

---

If something breaks, check:

* FFmpeg installed?
* Vosk model path correct?
* Backend running on port 5000?
* Console logs for errors?

```
```
