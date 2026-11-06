# .venv/bin/python voice.py  — narrate each note with Kokoro (offline), then check every line with Whisper.
import json, os, re, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LINES = [
    (1, 0.9, "Every garment carries a signature."),
    (2, 5.6, "Yours starts as a message."),
    (3, 9.0, "We draw it to the millimetre..."),
    (4, 13.0, "...and weave it, thread by thread, in Lagos."),
    (5, 21.0, "Every step, tracked on WhatsApp."),
    (6, 28.0, "And every label is checked by hand."),
    (7, 36.4, "Feyse Clothing Labels."),
    (8, 38.9, "Made in Lagos. Worn everywhere."),
]
# how the voice should pronounce some words (the subtitles keep the real spelling)
SAY = {"Feyse": "Fay-say", "WhatsApp": "Whats App"}
VOICE, SPEED = "af_heart", 0.92
out = os.path.join(HERE, "out", "voice"); os.makedirs(out, exist_ok=True)
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(HERE, "models", "kokoro-v1.0.onnx"), os.path.join(HERE, "models", "voices-v1.0.bin"))
meta = []
for n, t, text in LINES:
    say = text
    for a, b in SAY.items(): say = say.replace(a, b)
    a, sr = k.create(say.replace("...", ","), voice=VOICE, speed=SPEED, lang="en-us")
    a = np.asarray(a, dtype=np.float32)
    nz = np.flatnonzero(np.abs(a) > 0.01)                    # trim silence at both ends
    a = a[max(0, nz[0] - int(.02 * sr)): nz[-1] + int(.08 * sr)]
    f = os.path.join(out, f"line{n}.wav"); sf.write(f, a, sr)
    meta.append({"n": n, "t": t, "text": text, "file": f, "dur": len(a) / sr, "sr": sr})
    print(f"line {n}: {len(a) / sr:.2f}s")
json.dump(meta, open(os.path.join(out, "lines.json"), "w"), indent=1)

# speech-to-text check
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z ]", "", s.lower().replace("-", " ")).split()
bad = 0
for L in meta:
    segs, _ = m.transcribe(L["file"], language="en", beam_size=5)
    heard = " ".join(s.text for s in segs).strip()
    want = norm(L["text"]); got = norm(heard)
    miss = [w for w in want if w not in got and w not in ("feyse", "whatsapp", "millimetre")]
    ok = not miss
    bad += not ok
    print(("OK  " if ok else "MISS") + f" {L['n']}: want '{L['text']}' heard '{heard}'" + (f"  missing {miss}" if miss else ""))
sys.exit(1 if bad else 0)
