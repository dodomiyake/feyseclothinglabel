#!/bin/sh
# One command to rebuild the film. Needs Node 20+ with Playwright + Chromium, ffmpeg, and uv (or Python 3.12).
set -e; cd "$(dirname "$0")"
[ -x .venv/bin/python ] || { uv venv -q --python 3.12 .venv; uv pip install -q --python .venv/bin/python numpy scipy soundfile kokoro-onnx faster-whisper "av<19"; }
mkdir -p models
for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f models/$f ] || curl -sSL --fail -o models/$f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done
.venv/bin/python voice.py          # narration + speech-to-text check
node video.cjs --workers 4         # picture → out/video.mp4, cues → out/events.json, out/cues.json
.venv/bin/python mix.py            # score + foley + voice → out/mix.wav
python3 srt.py                     # → feyse-signature.srt
sh mux.sh                          # → feyse-signature.mp4 (-14 LUFS)
node stills.cjs . 41.8 && mv t_41.80.jpg poster.jpg
