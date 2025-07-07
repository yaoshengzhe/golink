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

// Copy files (except create.html which we'll replace with comprehensive version)
const filesToCopy = [
  'background.js',
  'popup.js', 
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

// Copy comprehensive create page
const safariCreateSource = path.join(__dirname, 'safari-create.html');
const safariCreateDest = path.join(safariDir, 'create.html');
fs.copyFileSync(safariCreateSource, safariCreateDest);
console.log('✅ Copied Safari-specific comprehensive create.html');

// Copy Safari-specific popup (simple version for testing)
const safariPopupSource = path.join(__dirname, 'safari-popup-simple.html');
const safariPopupDest = path.join(safariDir, 'popup.html');
fs.copyFileSync(safariPopupSource, safariPopupDest);
console.log('✅ Copied Safari-specific simple popup.html');

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

// Create Safari-specific background.js
const backgroundPath = path.join(safariDir, 'background.js');
const safariBackgroundScript = `// Safari Web Extension - GoLinks Background Script
console.log('GoLinks Safari Extension loaded');

// Storage helper functions
async function getGoLinkMapping(shortName) {
  return new Promise(resolve => {
    chrome.storage.local.get([\`golink_\${shortName}\`], result => {
      resolve(result[\`golink_\${shortName}\`] || null);
    });
  });
}

async function saveGoLinkMapping(shortName, url, description = '') {
  const key = \`golink_\${shortName}\`;
  const mapping = {
    shortName,
    url,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: mapping }, () => {
      resolve(mapping);
    });
  });
}

async function getAllGoLinkMappings() {
  return new Promise(resolve => {
    chrome.storage.local.get(null, result => {
      const mappings = {};
      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('golink_')) {
          const shortName = key.replace('golink_', '');
          mappings[shortName] = value;
        }
      }
      resolve(mappings);
    });
  });
}

async function deleteGoLinkMapping(shortName) {
  const key = \`golink_\${shortName}\`;
  return new Promise(resolve => {
    chrome.storage.local.remove([key], () => {
      resolve();
    });
  });
}

// Handle extension icon clicks (since popup doesn't work properly in Safari)
chrome.browserAction.onClicked.addListener((tab) => {
  console.log('Safari: Extension icon clicked');
  chrome.tabs.create({
    url: chrome.runtime.getURL('create.html')
  });
});

// Safari approach: Listen for tab updates and check URL
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      
      // Check if this is a go/ URL pattern
      if (url.hostname === 'go' && url.pathname && url.pathname.length > 1) {
        const shortName = url.pathname.substring(1); // Remove leading slash
        
        console.log(\`Safari: Detected go link: \${shortName}\`);
        
        // Look up the mapping
        const mapping = await getGoLinkMapping(shortName);
        
        if (mapping && mapping.url) {
          console.log(\`Safari: Redirecting go/\${shortName} to \${mapping.url}\`);
          chrome.tabs.update(tabId, { url: mapping.url });
        } else {
          console.log(\`Safari: No mapping found for \${shortName}, showing create page\`);
          const createUrl = chrome.runtime.getURL('create.html') + 
                           \`?shortName=\${encodeURIComponent(shortName)}\`;
          chrome.tabs.update(tabId, { url: createUrl });
        }
      }
    } catch (error) {
      console.error('Safari GoLinks error:', error);
    }
  }
});

// Message handler for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveMapping':
      saveGoLinkMapping(request.shortName, request.url, request.description)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'getMapping':
      getGoLinkMapping(request.shortName)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'getAllMappings':
      getAllGoLinkMappings()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'deleteMapping':
      deleteGoLinkMapping(request.shortName)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});

console.log('GoLinks Safari Extension ready');
`;

fs.writeFileSync(backgroundPath, safariBackgroundScript);
console.log('✅ Created Safari-specific background.js');

console.log('\n🎉 Safari extension prepared!');
console.log(`📁 Location: ${safariDir}`);
console.log('\nNext steps:');
console.log('1. Run: ./scripts/safari-build.sh');
console.log('2. Or manually: xcrun safari-web-extension-converter safari-dist/');