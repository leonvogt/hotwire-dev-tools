#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

raw_dir=${RAW_DIR:-docs/screenshots/raw}
readme_dir=${README_DIR:-docs/screenshots}
store_dir=${STORE_DIR:-release/store}
background=${BACKGROUND:-"xc:#212529"}

frame() {
  local raw=$1 width=$2 height=$3 output=$4
  local padding=$((width / 32))
  local radius=$((width * 24 / 2560))
  local blur=$((width * 30 / 2560))
  local offset=$((width * 16 / 2560))

  magick "$raw" -alpha set -resize "$((width - 2 * padding))x$((height - 2 * padding))" \
    \( +clone -alpha transparent -fill white -draw "roundrectangle 0,0 %[fx:w-1],%[fx:h-1] $radius,$radius" \) \
    -compose DstIn -composite -compose over \
    \( +clone -background black -shadow "45x${blur}+0+${offset}" \) +swap -background none -layers merge +repage \
    \( -size "${width}x${height}" -define gradient:angle=135 "$background" \) +swap \
    -gravity center -composite -alpha off -depth 8 -strip \
    "PNG24:$output"
}

shopt -s nullglob
raws=("$raw_dir"/*.png)
if [ ${#raws[@]} -eq 0 ]; then
  echo "No PNGs found in $raw_dir" >&2
  exit 1
fi

mkdir -p "$readme_dir" "$store_dir"

for raw in "${raws[@]}"; do
  name=$(basename "$raw" .png)
  frame "$raw" 1600 1000 "$readme_dir/$name.png"
  frame "$raw" 1280 800 "$store_dir/$name-1280x800.png"
  echo "✔ $name → $readme_dir/$name.png, $store_dir/$name-1280x800.png"
done
