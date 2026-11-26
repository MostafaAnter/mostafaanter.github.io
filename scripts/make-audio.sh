#!/usr/bin/env bash
# Synthesizes the site's UI sounds + ambient loop with ffmpeg (no external assets, no licensing).
# Outputs small .webm (Opus) + .mp3 fallbacks into public/audio. Run: npm run audio
set -euo pipefail
cd "$(dirname "$0")/.."
W=assets/work/audio; O=public/audio; mkdir -p "$W" "$O"
SR=44100
syn() { local e="$2"; e="${e//,/\\,}"; ffmpeg -y -loglevel error -f lavfi -i "aevalsrc=$e:d=$3:s=$SR" -ac 1 "$W/$1.wav"; }

# Soft tick for hover (60 ms)
syn hover   "0.35*sin(2*PI*2400*t)*exp(-t*120)" 0.07
# Click blip: quick upward chirp (130 ms)
syn click   "0.55*sin(2*PI*(800+3500*t)*t)*exp(-t*38)" 0.14
# Sound-enabled chime: two notes
syn on      "0.4*sin(2*PI*660*t)*exp(-t*8)*lt(t,0.14)+0.4*sin(2*PI*990*t)*exp(-(t-0.14)*7)*gte(t,0.14)" 0.7
# Sound-disabled: single falling note
syn off     "0.4*sin(2*PI*(520-300*t)*t)*exp(-t*14)" 0.3
# Section whoosh: filtered pink noise swell (550 ms)
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.55:c=pink:r=$SR:a=0.6" -af "highpass=f=400,lowpass=f=2600,afade=t=in:d=0.2,afade=t=out:st=0.2:d=0.35,volume=0.7" -ac 1 "$W/section.wav"
# Ambient: 24 s, every frequency completes whole cycles in 24 s => seamless loop
syn ambient "(0.2*sin(2*PI*55*t)+0.11*sin(2*PI*82.5*t)+0.07*sin(2*PI*110*t)+0.035*sin(2*PI*165*t)+0.02*sin(2*PI*220.5*t))*(0.78+0.22*sin(2*PI*0.125*t))" 24

for n in hover click on off section; do
  ffmpeg -y -loglevel error -i "$W/$n.wav" -c:a libopus -b:a 32k -ac 1 "$O/$n.webm"
  ffmpeg -y -loglevel error -i "$W/$n.wav" -c:a libmp3lame -b:a 48k -ac 1 "$O/$n.mp3"
done
ffmpeg -y -loglevel error -i "$W/ambient.wav" -c:a libopus -b:a 28k -ac 1 "$O/ambient.webm"
ffmpeg -y -loglevel error -i "$W/ambient.wav" -c:a libmp3lame -b:a 40k -ac 1 "$O/ambient.mp3"
ls -la "$O"; du -sh "$O"
