#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Building Chrome extension...');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist', 'chrome');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy Chrome-specific files
const chromeDir = path.join(srcDir, 'chrome');
const chromeFiles = fs.readdirSync(chromeDir);
chromeFiles.forEach(file => {
  const srcPath = path.join(chromeDir, file);
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

console.log('\n✅ Chrome extension built successfully!');
console.log(`📁 Location: ${distDir}`);
console.log('\nTo load in Chrome:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked"');
console.log(`4. Select: ${distDir}`);