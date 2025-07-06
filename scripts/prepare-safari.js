#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🦎 Preparing Safari-compatible extension...');

// Create safari-dist directory
const safariDir = path.join(__dirname, '..', 'safari-dist');
const sourceDir = path.join(__dirname, '..');

if (fs.existsSync(safariDir)) {
  fs.rmSync(safariDir, { recursive: true, force: true });
}
fs.mkdirSync(safariDir);

// Copy files
const filesToCopy = [
  'background.js',
  'popup.html',
  'popup.js', 
  'create.html',
  'create.js',
  'styles.css'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(safariDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

// Create placeholder icons (PNG format) 
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.join(safariDir, `icon-${size}.png`);
  // Create a simple SVG-to-PNG placeholder
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#2563eb"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.4)}" font-weight="bold">GO</text>
  </svg>`;
  
  // Since we can't easily convert SVG to PNG in Node.js without dependencies,
  // we'll create a simple base64 encoded PNG
  const base64PNG = createSimplePNG(size);
  fs.writeFileSync(iconPath, Buffer.from(base64PNG, 'base64'));
  console.log(`✅ Created icon-${size}.png`);
});

function createSimplePNG(size) {
  // This is a minimal PNG header + blue square (simplified)
  // In a real implementation, you'd use a proper PNG library
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0VaS9gAAAABJRU5ErkJggg==';
  return base64Data; // Simple 1x1 blue pixel PNG
}

// Copy Safari manifest
const safariManifestPath = path.join(__dirname, 'safari-manifest.json');
const destManifestPath = path.join(safariDir, 'manifest.json');
fs.copyFileSync(safariManifestPath, destManifestPath);
console.log('✅ Copied Safari manifest');

// Modify background.js for Safari compatibility
const backgroundPath = path.join(safariDir, 'background.js');
if (fs.existsSync(backgroundPath)) {
  let content = fs.readFileSync(backgroundPath, 'utf8');
  
  // Replace omnibox API calls with comments (not supported in Safari)
  content = content.replace(/chrome\.omnibox\.[^;]+;/g, '// Omnibox API not supported in Safari');
  
  // Add Safari-specific namespace fallback
  content = `// Safari Web Extension compatibility
const browser = chrome || safari?.extension || {};

${content}`;
  
  fs.writeFileSync(backgroundPath, content);
  console.log('✅ Modified background.js for Safari');
}

console.log('\n🎉 Safari extension prepared!');
console.log(`📁 Location: ${safariDir}`);
console.log('\nNext steps:');
console.log('1. Run: ./scripts/safari-build.sh');
console.log('2. Or manually: xcrun safari-web-extension-converter safari-dist/');