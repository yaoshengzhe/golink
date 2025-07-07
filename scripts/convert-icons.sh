#!/bin/bash
# PNG Icon Converter
# Requires: librsvg (install with: brew install librsvg)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ICONS_DIR="$SCRIPT_DIR/../icons"

if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert not found. Install with: brew install librsvg"
    exit 1
fi

echo "🖼️  Converting SVG icons to PNG..."

for size in 16 48 128; do
    rsvg-convert -w ${size} -h ${size} "$ICONS_DIR/icon-${size}.svg" -o "$ICONS_DIR/icon-${size}.png"
    echo "✅ Created icon-${size}.png"
done

echo "🎉 All PNG icons generated!"