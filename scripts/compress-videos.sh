#!/bin/bash
# Compress Google Drive videos into public/videos/<driveId>.mp4 + WebP posters.
#
#   scripts/compress-videos.sh <driveId> [<driveId> ...]
#
# Requires: ffmpeg, cwebp   (brew install ffmpeg webp)
# Output: ≤1280px long side, ≤30fps, H.264 CRF 28, AAC 96k, faststart.
# Regenerates public/videos/manifest.json so src/utils/video.ts serves the
# compressed static copy instead of proxying Drive through a server function.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/videos"; POSTERS="$OUT/posters"; TMP="$(mktemp -d)"
mkdir -p "$OUT" "$POSTERS"

for id in "$@"; do
  raw="$TMP/$id"
  echo "→ downloading $id"
  curl -sL -c "$TMP/cj" "https://drive.google.com/uc?export=download&id=$id" -o "$raw"
  if file "$raw" | grep -q HTML; then   # large-file virus-scan interstitial
    # `|| true`: newer interstitials have no confirm= token, and under pipefail
    # a non-matching grep would silently abort the whole run
    tok=$(grep -o 'confirm=[a-zA-Z0-9_-]*' "$raw" | head -1 | cut -d= -f2 || true)
    uuid=$(grep -o 'name="uuid" value="[^"]*"' "$raw" | head -1 | sed 's/.*value="//;s/"//' || true)
    curl -sL -b "$TMP/cj" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=${tok:-t}&uuid=$uuid" -o "$raw"
  fi

  # Cap output bitrate at ~85% of the source so already-small files never grow
  src_bps=$(ffprobe -v error -show_entries format=bit_rate -of csv=p=0 "$raw")
  cap=$(( src_bps * 85 / 100 / 1000 )); [ "$cap" -gt 2500 ] && cap=2500; [ "$cap" -lt 300 ] && cap=300

  echo "→ encoding  $id (maxrate ${cap}k)"
  ffmpeg -y -v error -i "$raw" \
    -vf "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',fps='min(30,source_fps)'" \
    -c:v libx264 -preset slow -crf 28 -maxrate "${cap}k" -bufsize "$((cap*2))k" \
    -profile:v high -level 4.1 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -ac 2 -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -y -v error -ss 1 -i "$OUT/$id.mp4" -frames:v 1 -vf "scale='min(960,iw)':-2" "$TMP/$id.png"
  cwebp -quiet -q 72 "$TMP/$id.png" -o "$POSTERS/$id.webp"
  printf "   %s → %s\n" "$(du -h "$raw" | cut -f1)" "$(du -h "$OUT/$id.mp4" | cut -f1)"
done

ls "$OUT"/*.mp4 | xargs -n1 basename | sed 's/\.mp4$//' \
  | python3 -c 'import sys,json; print(json.dumps(sorted(l.strip() for l in sys.stdin), indent=2))' \
  > "$OUT/manifest.json"
rm -rf "$TMP"
echo "manifest: $(grep -c '"' "$OUT/manifest.json") videos"
