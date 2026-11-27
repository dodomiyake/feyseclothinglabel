#!/bin/sh
# Rebuild the video. Needs Node 20+ with Playwright + Chromium and ffmpeg.
# The song is not in git: put the WAV from Metheues' Suno library at audio/gbemidebe.wav first.
set -e; cd "$(dirname "$0")"
[ -f audio/gbemidebe.wav ] || { echo "missing audio/gbemidebe.wav"; exit 1; }
node video.cjs --workers 6                     # picture → out/video.mp4 (lyrics and beats from timing.json)
ffmpeg -v error -y -i out/video.mp4 -i audio/gbemidebe.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart out/gbemidebe-metheues-hq.mp4
ffmpeg -v error -y -i out/gbemidebe-metheues-hq.mp4 -c:v libx264 -preset slow -crf 23 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart gbemidebe-metheues.mp4
node stills.cjs . 9.9 && mv t_9.90.jpg poster.jpg
# Remix Version 2 (timing-remix.json; short-curls look from the second reference photo). Put the MP3 at audio/gbemidebe-remix-v2.mp3 first.
if [ -f audio/gbemidebe-remix-v2.mp3 ]; then
  OUT=out/remix PAGE='index.html?song=remix' node video.cjs --workers 6
  ffmpeg -v error -y -i out/remix/video.mp4 -i audio/gbemidebe-remix-v2.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/gbemidebe-remix-v2-metheues-hq.mp4
  ffmpeg -v error -y -i out/gbemidebe-remix-v2-metheues-hq.mp4 -c:v libx264 -preset slow -crf 23 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart gbemidebe-remix-v2-metheues.mp4
  PAGE='index.html?song=remix' node stills.cjs . 15.2 && mv t_15.20.jpg poster-remix-v2.jpg
fi
