// Safari Web Extension - GoLinks Background Script (FIXED)
console.log('GoLinks Safari Extension loaded');

// Cross-browser API compatibility - FIXED for Safari
const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Storage helper functions - FIXED storage format for Safari compatibility
async function getGoLinkMapping(shortName) {
  return new Promise((resolve, reject) => {
    extensionAPI.storage.local.get(['golinks'], result => {
      if (extensionAPI.runtime.lastError) {
        reject(new Error(extensionAPI.runtime.lastError.message));
        return;
      }
      const golinks = result.golinks || {};
      resolve(golinks[shortName] || null);
    });
  });
}

async function saveGoLinkMapping(shortName, url, description = '') {
  console.log(`Safari: saveGoLinkMapping called with: ${shortName}, ${url}, ${description}`);
  
  const mapping = {
    shortName,
    url,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  console.log('Safari: Created mapping object:', mapping);

  return new Promise((resolve, reject) => {
    console.log('Safari: Getting existing golinks from storage...');
    extensionAPI.storage.local.get(['golinks'], result => {
      console.log('Safari: Storage GET result:', result);
      console.log('Safari: Runtime error after GET:', extensionAPI.runtime.lastError);
      
      if (extensionAPI.runtime.lastError) {
        console.error('Safari: GET failed with error:', extensionAPI.runtime.lastError.message);
        reject(new Error(extensionAPI.runtime.lastError.message));
        return;
      }
      
      const golinks = result.golinks || {};
      console.log('Safari: Existing golinks:', golinks);
      
      golinks[shortName] = mapping;
      console.log('Safari: Updated golinks object:', golinks);
      
      console.log('Safari: Setting updated golinks to storage...');
      extensionAPI.storage.local.set({ golinks }, () => {
        console.log('Safari: Storage SET completed');
        console.log('Safari: Runtime error after SET:', extensionAPI.runtime.lastError);
        
        if (extensionAPI.runtime.lastError) {
          console.error('Safari: SET failed with error:', extensionAPI.runtime.lastError.message);
          reject(new Error(extensionAPI.runtime.lastError.message));
        } else {
          console.log('Safari: Save successful, resolving with mapping:', mapping);
          resolve(mapping);
        }
      });
    });
  });
}

async function getAllGoLinkMappings() {
  return new Promise((resolve, reject) => {
    extensionAPI.storage.local.get(['golinks'], result => {
      if (extensionAPI.runtime.lastError) {
        reject(new Error(extensionAPI.runtime.lastError.message));
        return;
      }
      resolve(result.golinks || {});
    });
  });
}

async function deleteGoLinkMapping(shortName) {
  return new Promise((resolve, reject) => {
    extensionAPI.storage.local.get(['golinks'], result => {
      if (extensionAPI.runtime.lastError) {
        reject(new Error(extensionAPI.runtime.lastError.message));
        return;
      }
      
      const golinks = result.golinks || {};
      delete golinks[shortName];
      
      extensionAPI.storage.local.set({ golinks }, () => {
        if (extensionAPI.runtime.lastError) {
          reject(new Error(extensionAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  });
}

// FIXED: Handle extension icon clicks properly for Safari
// Note: Since manifest has default_popup, this handler might not be needed
// But keeping for compatibility with Safari versions that don't support popup
const actionAPI = extensionAPI.browserAction || extensionAPI.action;

if (actionAPI && actionAPI.onClicked) {
  actionAPI.onClicked.addListener((tab) => {
    console.log('Safari: Extension icon clicked - opening popup in new tab');
    extensionAPI.tabs.create({
      url: extensionAPI.runtime.getURL('popup.html')
    });
  });
}

// FIXED: Safari URL navigation using webNavigation API
if (extensionAPI.webNavigation && extensionAPI.webNavigation.onBeforeNavigate) {
  extensionAPI.webNavigation.onBeforeNavigate.addListener(
    async (details) => {
      // Only handle main frame navigation (not iframes)
      if (details.frameId !== 0) return;

      try {
        const url = new URL(details.url);
        
        // Check if this is a go/ URL pattern
        if (url.hostname === 'go' && url.pathname && url.pathname.length > 1) {
          const shortName = url.pathname.substring(1); // Remove leading slash
          
          console.log(`Safari: Detected go link: ${shortName}`);
          
          // Look up the mapping
          const mapping = await getGoLinkMapping(shortName);
          
          if (mapping && mapping.url) {
            console.log(`Safari: Redirecting go/${shortName} to ${mapping.url}`);
            extensionAPI.tabs.update(details.tabId, { url: mapping.url });
          } else {
            console.log(`Safari: No mapping found for ${shortName}, showing create page`);
            const createUrl = extensionAPI.runtime.getURL('create.html') + 
                             `?shortName=${encodeURIComponent(shortName)}`;
            extensionAPI.tabs.update(details.tabId, { url: createUrl });
          }
        }
      } catch (error) {
        console.error('Safari GoLinks error:', error);
      }
    },
    {
      url: [
        { hostEquals: 'go' },
        { urlMatches: '^https?://go/.*' }
      ]
    }
  );
}

// FIXED: Fallback using tabs.onUpdated for Safari compatibility
extensionAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL is loading to avoid duplicate processing
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      
      // Check if this is a go/ URL pattern
      if (url.hostname === 'go' && url.pathname && url.pathname.length > 1) {
        const shortName = url.pathname.substring(1); // Remove leading slash
        
        console.log(`Safari: Detected go link via tab update: ${shortName}`);
        
        // Look up the mapping
        const mapping = await getGoLinkMapping(shortName);
        
        if (mapping && mapping.url) {
          console.log(`Safari: Redirecting go/${shortName} to ${mapping.url}`);
          extensionAPI.tabs.update(tabId, { url: mapping.url });
        } else {
          console.log(`Safari: No mapping found for ${shortName}, showing create page`);
          const createUrl = extensionAPI.runtime.getURL('create.html') + 
                           `?shortName=${encodeURIComponent(shortName)}`;
          extensionAPI.tabs.update(tabId, { url: createUrl });
        }
      }
    } catch (error) {
      console.error('Safari GoLinks tab update error:', error);
    }
  }
});

// FIXED: Message handler for popup communication with better error handling
extensionAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Safari: Received message:', request.action, 'from:', sender.tab ? sender.tab.url : 'popup');
  console.log('Safari: Message details:', request);
  
  switch (request.action) {
    case 'saveMapping':
      console.log(`Safari: Attempting to save mapping: ${request.shortName} -> ${request.url}`);
      saveGoLinkMapping(request.shortName, request.url, request.description)
        .then(result => {
          console.log('Safari: Save successful, returning result:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Safari: Save mapping error:', error);
          console.error('Safari: Error stack:', error.stack);
          sendResponse({ error: error.message });
        });
      return true; // Keep message channel open for async response

    case 'getMapping':
      getGoLinkMapping(request.shortName)
        .then(result => {
          console.log('Safari: Retrieved mapping:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Safari: Get mapping error:', error);
          sendResponse({ error: error.message });
        });
      return true;

    case 'getAllMappings':
      getAllGoLinkMappings()
        .then(result => {
          console.log('Safari: Retrieved all mappings, count:', Object.keys(result).length);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Safari: Get all mappings error:', error);
          sendResponse({ error: error.message });
        });
      return true;

    case 'deleteMapping':
      deleteGoLinkMapping(request.shortName)
        .then(() => {
          console.log('Safari: Deleted mapping:', request.shortName);
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Safari: Delete mapping error:', error);
          sendResponse({ error: error.message });
        });
      return true;

    default:
      console.warn('Safari: Unknown action:', request.action);
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

console.log('GoLinks Safari Extension ready');