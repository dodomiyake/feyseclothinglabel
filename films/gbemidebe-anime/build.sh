#!/bin/sh
# Rebuild the video (~35 min of rendering). Needs Node 20+ with Playwright + Chromium and ffmpeg.
# Put the song at audio/gbemidebe-remix-v2.mp3 first (not in git).
set -e; cd "$(dirname "$0")"
node video.cjs --workers 6
ffmpeg -v error -y -i out/video.mp4 -i audio/gbemidebe-remix-v2.mp3 -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 19 -tune animation -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/gbemidebe-anime-metheues-master.mp4
ffmpeg -v error -y -i out/gbemidebe-anime-metheues-master.mp4 -c:v libx264 -preset slow -crf 23 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart gbemidebe-anime-metheues.mp4
node stills.cjs . 14 && mv t_14.00.jpg poster.jpg
