#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Generating GoLinks extension icons...');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Icon sizes needed
const sizes = [16, 48, 128];

// Create beautiful icon using the provided link SVG design
function createSVGIcon(size) {
  const cornerRadius = size * 0.18; // Clean rounded corners
  const iconScale = size / 256; // Scale from 256px viewBox to target size
  const iconSize = size * 0.7; // Icon takes 70% of the space
  const iconOffset = (size - iconSize) / 2; // Center the icon
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Clean white background -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" 
        fill="white" stroke="none"/>
  
  <!-- Beautiful link icon centered and scaled -->
  <g transform="translate(${iconOffset}, ${iconOffset}) scale(${iconScale * 0.7})">
    <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149.31,102a8,8,0,1,1-10.64,12,40,40,0,0,0-54.85,1.63L59.7,139.72a40,40,0,0,0,56.58,56.58l9.94-9.94A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.58,56.58L172.18,140.4A40,40,0,0,1,117.33,142,8,8,0,1,0,106.69,154a56,56,0,0,0,76.81-2.26l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z" 
          fill="#1a1a1a"/>
  </g>
</svg>`;
}

// Generate SVG icons
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created icon-${size}.svg`);
});

// Create PNG versions using Canvas API simulation
function createPNGIcon(size) {
  // Simple PNG data URI for testing - in production you'd use a proper SVG to PNG converter
  const canvas = `data:image/svg+xml;base64,${Buffer.from(createSVGIcon(size)).toString('base64')}`;
  return canvas;
}

// Create manifest.json icons entry
const manifestIcons = {
  "16": "icons/icon-16.png",
  "48": "icons/icon-48.png", 
  "128": "icons/icon-128.png"
};

console.log('\n📝 Add this to your manifest.json:');
console.log(JSON.stringify({ icons: manifestIcons }, null, 2));

// Create favicon
const faviconSVG = createSVGIcon(32);
const faviconPath = path.join(iconsDir, 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSVG);
console.log('✅ Created favicon.svg');

// Create a simple PNG converter script
const converterScript = `#!/bin/bash
# PNG Icon Converter
# Requires: librsvg (install with: brew install librsvg)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$SCRIPT_DIR/../icons"

if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert not found. Install with: brew install librsvg"
    exit 1
fi

echo "🖼️  Converting SVG icons to PNG..."

for size in 16 48 128; do
    rsvg-convert -w \${size} -h \${size} "$ICONS_DIR/icon-\${size}.svg" -o "$ICONS_DIR/icon-\${size}.png"
    echo "✅ Created icon-\${size}.png"
done

echo "🎉 All PNG icons generated!"
`;

const converterPath = path.join(__dirname, 'convert-icons.sh');
fs.writeFileSync(converterPath, converterScript);
fs.chmodSync(converterPath, '755');
console.log('✅ Created convert-icons.sh');

console.log('\n🎨 Icon generation complete!');
console.log('📁 Icons saved to: icons/');
console.log('🔧 Run ./scripts/convert-icons.sh to generate PNG files');
console.log('💡 Design: Beautiful link icon - clean, professional, instantly recognizable');