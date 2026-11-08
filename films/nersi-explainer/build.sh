#!/bin/sh
# One command to rebuild. Needs Node 20+ with Playwright + Chromium, ffmpeg, and the Python venv + Kokoro model
# (see ../feyse-promo/build.sh, which creates them; this folder links to them).
set -e; cd "$(dirname "$0")"
[ -e .venv ] || ln -s ../feyse-promo/.venv .venv; [ -e models ] || ln -s ../feyse-promo/models models
node video.cjs --events-only      # exports out/events.json, out/cues.json, out/voice.json from film.js
.venv/bin/python voice_ng.py en-NG-EzinneNeural +16%   # Nigerian English narration (online) + speech check
# offline alternative (US accent): .venv/bin/python voice.py
node video.cjs --workers 4        # picture → out/video.mp4
.venv/bin/python mix.py           # score + foley + voice → out/mix.wav
python3 srt.py && sh mux.sh       # → nersi-explainer.srt, nersi-explainer.mp4 (-14 LUFS)
node stills.cjs . 39.8 && mv t_39.80.jpg poster.jpg
# second version with the male Nigerian voice (Abeo); keeps the Ezinne film as nersi-explainer.mp4
cp nersi-explainer.mp4 out/ezinne.mp4
.venv/bin/python voice_ng.py en-NG-AbeoNeural +16% && .venv/bin/python mix.py && sh mux.sh
mv nersi-explainer.mp4 nersi-explainer-abeo.mp4 && mv out/ezinne.mp4 nersi-explainer.mp4
