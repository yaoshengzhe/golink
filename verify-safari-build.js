#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Safari extension build...\n');

const safariDistDir = path.join(__dirname, 'safari-dist');
const requiredFiles = [
    'manifest.json',
    'background.js',
    'popup.html',
    'create.html',
    'create.js',
    'styles.css',
    'icons/icon-16.png',
    'icons/icon-48.png',
    'icons/icon-128.png'
];

let allGood = true;

// Check safari-dist exists
if (!fs.existsSync(safariDistDir)) {
    console.error('❌ safari-dist directory not found!');
    console.error('   Run: npm run safari:prepare');
    process.exit(1);
}

// Check required files
console.log('Checking required files:');
requiredFiles.forEach(file => {
    const filePath = path.join(safariDistDir, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
        console.error(`❌ ${file} - MISSING!`);
        allGood = false;
    }
});

// Check manifest content
console.log('\nChecking manifest.json:');
const manifestPath = path.join(safariDistDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.manifest_version === 2) {
        console.log('✅ Manifest version: 2 (correct for Safari)');
    } else {
        console.error('❌ Manifest version should be 2 for Safari');
        allGood = false;
    }
    
    if (manifest.browser_action && manifest.browser_action.default_popup) {
        console.log('✅ Browser action popup: ' + manifest.browser_action.default_popup);
    } else {
        console.error('❌ Browser action popup not defined');
        allGood = false;
    }
}

// Check background script
console.log('\nChecking background.js:');
const backgroundPath = path.join(safariDistDir, 'background.js');
if (fs.existsSync(backgroundPath)) {
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    if (backgroundContent.includes('golinks')) {
        console.log('✅ Uses unified golinks storage format');
    } else {
        console.error('❌ Should use unified golinks storage format');
        allGood = false;
    }
    
    if (!backgroundContent.includes('browserAction.onClicked')) {
        console.log('✅ No conflicting browserAction.onClicked handler');
    } else {
        console.error('❌ Has browserAction.onClicked (conflicts with popup)');
        allGood = false;
    }
}

// Check popup
console.log('\nChecking popup.html:');
const popupPath = path.join(safariDistDir, 'popup.html');
if (fs.existsSync(popupPath)) {
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    if (popupContent.includes('openCreatePage') && popupContent.includes('openManagePage')) {
        console.log('✅ Has required functions');
    } else {
        console.error('❌ Missing required functions');
        allGood = false;
    }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('✅ Safari extension files look good!');
    console.log('\nNext steps:');
    console.log('1. Run: ./scripts/safari-build.sh');
    console.log('2. Build in Xcode and enable in Safari');
} else {
    console.error('❌ Issues found! Fix them and run npm run safari:prepare again');
    process.exit(1);
}