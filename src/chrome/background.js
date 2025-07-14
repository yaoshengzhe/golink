// GoLinks background script for URL interception and redirection

// Cross-browser API compatibility  
const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Listen for navigation events
extensionAPI.webNavigation.onBeforeNavigate.addListener(
  async details => {
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
            extensionAPI.tabs.update(details.tabId, { url: mapping.url });
          } else {
            // No mapping found, redirect to create page
            console.log(
              `No mapping found for go/${shortName}, redirecting to create page`
            );
            const createUrl =
              extensionAPI.runtime.getURL('create.html') +
              `?shortName=${encodeURIComponent(shortName)}`;
            extensionAPI.tabs.update(details.tabId, { url: createUrl });
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
      { urlMatches: '^go/.*' },
    ],
  }
);

// Safari fallback: also listen for tab updates
extensionAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      if (isGoLink(url)) {
        const shortName = extractShortName(url);
        if (shortName) {
          const mapping = await getGoLinkMapping(shortName);
          if (mapping && mapping.url) {
            console.log(`Safari fallback: Redirecting go/${shortName} to ${mapping.url}`);
            extensionAPI.tabs.update(tabId, { url: mapping.url });
          } else {
            console.log(`Safari fallback: No mapping found for ${shortName}`);
            const createUrl = extensionAPI.runtime.getURL('create.html') + 
                           `?shortName=${encodeURIComponent(shortName)}`;
            extensionAPI.tabs.update(tabId, { url: createUrl });
          }
        }
      }
    } catch (error) {
      console.error('Safari fallback error:', error);
    }
  }
});

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
  return new Promise(resolve => {
    extensionAPI.storage.local.get(['golinks'], result => {
      const golinks = result.golinks || {};
      resolve(golinks[shortName] || null);
    });
  });
}

/**
 * Save a go-link mapping to storage
 */
async function saveGoLinkMapping(shortName, url, description = '') {
  const mapping = {
    shortName,
    url,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise(resolve => {
    extensionAPI.storage.local.get(['golinks'], result => {
      const golinks = result.golinks || {};
      golinks[shortName] = mapping;
      extensionAPI.storage.local.set({ golinks }, () => {
        resolve(mapping);
      });
    });
  });
}

/**
 * Get all go-link mappings
 */
async function getAllGoLinkMappings() {
  return new Promise(resolve => {
    extensionAPI.storage.local.get(['golinks'], result => {
      resolve(result.golinks || {});
    });
  });
}

/**
 * Delete a go-link mapping
 */
async function deleteGoLinkMapping(shortName) {
  return new Promise(resolve => {
    extensionAPI.storage.local.get(['golinks'], result => {
      const golinks = result.golinks || {};
      delete golinks[shortName];
      extensionAPI.storage.local.set({ golinks }, () => {
        resolve();
      });
    });
  });
}

// Expose functions for use by other extension pages
extensionAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

// Handle omnibox input (go xyz)
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const shortName = text.trim();

  if (shortName) {
    try {
      const mapping = await getGoLinkMapping(shortName);

      if (mapping && mapping.url) {
        // Navigate to the mapped URL
        console.log(`Navigating to go/${shortName} -> ${mapping.url}`);

        if (disposition === 'currentTab') {
          chrome.tabs.update({ url: mapping.url });
        } else {
          chrome.tabs.create({ url: mapping.url });
        }
      } else {
        // No mapping found, redirect to create page
        console.log(
          `No mapping found for go/${shortName}, redirecting to create page`
        );
        const createUrl =
          chrome.runtime.getURL('create.html') +
          `?shortName=${encodeURIComponent(shortName)}`;

        if (disposition === 'currentTab') {
          chrome.tabs.update({ url: createUrl });
        } else {
          chrome.tabs.create({ url: createUrl });
        }
      }
    } catch (error) {
      console.error('Error handling omnibox go-link:', error);
    }
  }
});

// Provide suggestions for omnibox
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const input = text.trim().toLowerCase();

  if (input.length > 0) {
    try {
      const mappings = await getAllGoLinkMappings();
      const suggestions = [];

      for (const [shortName, mapping] of Object.entries(mappings)) {
        if (
          shortName.toLowerCase().includes(input) ||
          (mapping.description &&
            mapping.description.toLowerCase().includes(input))
        ) {
          suggestions.push({
            content: shortName,
            description: `${shortName} → ${mapping.url}${mapping.description ? ' - ' + mapping.description : ''}`,
          });
        }
      }

      suggest(suggestions.slice(0, 5)); // Limit to 5 suggestions
    } catch (error) {
      console.error('Error getting omnibox suggestions:', error);
    }
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('GoLinks extension installed');
    // Could show welcome page or setup instructions
  }
});
