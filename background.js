// GoLinks background script for URL interception and redirection

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    // Only handle main frame navigation (not iframes)
    if (details.frameId !== 0) return;
    
    const url = new URL(details.url);
    
    // Check if this is a go/ URL pattern
    if (isGoLink(url)) {
      const shortName = extractShortName(url);
      
      if (shortName) {
        try {
          // Look up the mapping
          const mapping = await getGoLinkMapping(shortName);
          
          if (mapping && mapping.url) {
            // Redirect to the mapped URL
            console.log(`Redirecting go/${shortName} to ${mapping.url}`);
            chrome.tabs.update(details.tabId, { url: mapping.url });
          } else {
            // No mapping found, redirect to create page
            console.log(`No mapping found for go/${shortName}, redirecting to create page`);
            const createUrl = chrome.runtime.getURL('create.html') + `?shortName=${encodeURIComponent(shortName)}`;
            chrome.tabs.update(details.tabId, { url: createUrl });
          }
        } catch (error) {
          console.error('Error handling go-link:', error);
        }
      }
    }
  },
  {
    url: [
      { hostEquals: 'go' },
      { urlMatches: '^https?://go/.*' },
      { urlMatches: '^go/.*' }
    ]
  }
);

/**
 * Check if a URL is a go-link pattern
 */
function isGoLink(url) {
  // Handle various go-link patterns:
  // - http://go/xyz
  // - https://go/xyz
  // - go/xyz (when typed in address bar)
  return (
    url.hostname === 'go' ||
    url.href.startsWith('go/') ||
    url.href.match(/^https?:\/\/go\//)
  );
}

/**
 * Extract the short name from a go-link URL
 */
function extractShortName(url) {
  let shortName = '';
  
  if (url.hostname === 'go') {
    // http://go/xyz or https://go/xyz
    shortName = url.pathname.substring(1); // Remove leading slash
  } else if (url.href.startsWith('go/')) {
    // go/xyz
    shortName = url.href.substring(3); // Remove 'go/'
  } else if (url.href.match(/^https?:\/\/go\//)) {
    // Alternative pattern matching
    const match = url.href.match(/^https?:\/\/go\/(.+)/);
    if (match) {
      shortName = match[1];
    }
  }
  
  // Clean up any query parameters or fragments
  if (shortName.includes('?')) {
    shortName = shortName.split('?')[0];
  }
  if (shortName.includes('#')) {
    shortName = shortName.split('#')[0];
  }
  
  return shortName;
}

/**
 * Get a go-link mapping from storage
 */
async function getGoLinkMapping(shortName) {
  return new Promise((resolve) => {
    chrome.storage.local.get([`golink_${shortName}`], (result) => {
      resolve(result[`golink_${shortName}`] || null);
    });
  });
}

/**
 * Save a go-link mapping to storage
 */
async function saveGoLinkMapping(shortName, url, description = '') {
  const key = `golink_${shortName}`;
  const mapping = {
    shortName,
    url,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: mapping }, () => {
      resolve(mapping);
    });
  });
}

/**
 * Get all go-link mappings
 */
async function getAllGoLinkMappings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
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

/**
 * Delete a go-link mapping
 */
async function deleteGoLinkMapping(shortName) {
  const key = `golink_${shortName}`;
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], () => {
      resolve();
    });
  });
}

// Expose functions for use by other extension pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveMapping':
      saveGoLinkMapping(request.shortName, request.url, request.description)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Will respond asynchronously
      
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

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('GoLinks extension installed');
    // Could show welcome page or setup instructions
  }
});