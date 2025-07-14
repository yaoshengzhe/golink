#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🦁 Building Safari extension...');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist', 'safari');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy Safari-specific files
const safariDir = path.join(srcDir, 'safari');
const safariFiles = fs.readdirSync(safariDir);
safariFiles.forEach(file => {
  const srcPath = path.join(safariDir, file);
  const destPath = path.join(distDir, file);
  fs.copyFileSync(srcPath, destPath);
  console.log(`✅ Copied ${file}`);
});

// Copy shared files
const sharedDir = path.join(srcDir, 'shared');
const sharedFiles = fs.readdirSync(sharedDir);
sharedFiles.forEach(file => {
  const srcPath = path.join(sharedDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.statSync(srcPath).isDirectory()) {
    // Handle directories (like icons)
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
  console.log(`✅ Copied shared/${file}`);
});

// Safari popup.js is the Chrome version
const chromePopupJs = path.join(srcDir, 'chrome', 'popup.js');
if (fs.existsSync(chromePopupJs)) {
  fs.copyFileSync(chromePopupJs, path.join(distDir, 'popup.js'));
  console.log('✅ Copied popup.js from Chrome');
}

// Copy debug.html from Chrome (shared)
const chromeDebugHtml = path.join(srcDir, 'chrome', 'debug.html');
if (fs.existsSync(chromeDebugHtml)) {
  fs.copyFileSync(chromeDebugHtml, path.join(distDir, 'debug.html'));
  console.log('✅ Copied debug.html from Chrome');
}

console.log('\n✅ Safari extension prepared successfully!');
console.log(`📁 Location: ${distDir}`);
console.log('\nNext steps:');
console.log('1. Run: npm run safari:convert');
console.log('2. Build in Xcode and enable in Safari');