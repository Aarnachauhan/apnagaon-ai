import sys
import json
import wave
from vosk import Model, KaldiRecognizer

MODEL_PATH = "python/model/vosk-model-small-hi-0.22"

wf = wave.open(sys.argv[1], "rb")

model = Model(MODEL_PATH)
rec = KaldiRecognizer(model, wf.getframerate())

text = ""

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break

    if rec.AcceptWaveform(data):
        result = json.loads(rec.Result())
        text += " " + result.get("text", "")

# FINAL RESULT (VERY IMPORTANT)
final_result = json.loads(rec.FinalResult())
text += " " + final_result.get("text", "")

print(json.dumps({"text": text.strip()}))