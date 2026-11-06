#!/bin/sh
# sh mux.sh  — out/video.mp4 + out/mix.wav → nersi-explainer.mp4, two-pass loudnorm to -14 LUFS / -1 dBTP
set -e; cd "$(dirname "$0")"
M=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav \
  -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart nersi-explainer.mp4
