#!/usr/bin/env bash
# usage: tools/shot.sh "<query>" name   -> scratchpad/shots/name.png (1920x1080 render of tools/lab/art.html?<query>)
OUT="C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/shots"
mkdir -p "$OUT"
URL="http://localhost:8765/tools/lab/art.html?scale=1&$1"
[[ "$1" == http* ]] && URL="$1"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=${3:-1920},${4:-1080} --virtual-time-budget=${5:-4000} --screenshot="$OUT/$2.png" "$URL" >/dev/null 2>&1
echo "$OUT/$2.png"
