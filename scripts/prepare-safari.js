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

// Copy icons directory
const iconsSourceDir = path.join(sourceDir, 'icons');
const iconsDestDir = path.join(safariDir, 'icons');

if (fs.existsSync(iconsSourceDir)) {
  if (!fs.existsSync(iconsDestDir)) {
    fs.mkdirSync(iconsDestDir);
  }
  
  const iconFiles = fs.readdirSync(iconsSourceDir).filter(file => file.endsWith('.png'));
  iconFiles.forEach(file => {
    const srcPath = path.join(iconsSourceDir, file);
    const destPath = path.join(iconsDestDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied icons/${file}`);
  });
} else {
  console.log('⚠️  Icons directory not found, run: npm run icons:generate');
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