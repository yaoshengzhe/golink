// Safari Messaging Helper - Cross-browser compatibility utility
// This file provides a unified messaging interface for Safari Web Extensions

/**
 * Send a message to the background script with Safari compatibility
 * @param {Object} message - The message to send
 * @returns {Promise} - Promise that resolves with the response
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    // Detect browser environment
    const extensionAPI = (typeof browser !== 'undefined') ? browser : 
                        (typeof chrome !== 'undefined') ? chrome : null;

    if (!extensionAPI || !extensionAPI.runtime) {
      reject(new Error('Extension API not available'));
      return;
    }

    console.log('Safari: Sending message:', message);

    // Safari/Firefox use browser.runtime.sendMessage with promises
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
      try {
        // Safari 14+ and Firefox support promise-based messaging
        const sendPromise = browser.runtime.sendMessage(message);
        
        if (sendPromise && typeof sendPromise.then === 'function') {
          sendPromise
            .then(response => {
              console.log('Safari: Received response:', response);
              
              if (browser.runtime.lastError) {
                reject(new Error(browser.runtime.lastError.message));
              } else {
                resolve(response);
              }
            })
            .catch(error => {
              console.error('Safari: Message error:', error);
              reject(error);
            });
        } else {
          // Fallback for older Safari versions
          browser.runtime.sendMessage(message, (response) => {
            if (browser.runtime.lastError) {
              reject(new Error(browser.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        }
      } catch (error) {
        console.error('Safari: Browser sendMessage error:', error);
        reject(error);
      }
    } 
    // Chrome/Edge use chrome.runtime.sendMessage with callbacks
    else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Chrome: Runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            console.log('Chrome: Received response:', response);
            resolve(response);
          }
        });
      } catch (error) {
        console.error('Chrome: sendMessage error:', error);
        reject(error);
      }
    } else {
      reject(new Error('No compatible messaging API found'));
    }
  });
}

/**
 * Get the extension API object (browser or chrome)
 * @returns {Object} - The extension API object
 */
function getExtensionAPI() {
  return (typeof browser !== 'undefined') ? browser : 
         (typeof chrome !== 'undefined') ? chrome : null;
}

/**
 * Check if we're running in Safari
 * @returns {boolean} - True if running in Safari
 */
function isSafari() {
  return typeof browser !== 'undefined' && 
         typeof chrome === 'undefined' &&
         navigator.userAgent.includes('Safari');
}

/**
 * Get a URL for an extension resource
 * @param {string} path - Path to the resource
 * @returns {string} - Full URL to the resource
 */
function getResourceURL(path) {
  const api = getExtensionAPI();
  if (api && api.runtime && api.runtime.getURL) {
    return api.runtime.getURL(path);
  }
  return path;
}

/**
 * Create a new tab with the given URL
 * @param {string} url - URL to open
 * @returns {Promise} - Promise that resolves when tab is created
 */
function createTab(url) {
  return new Promise((resolve, reject) => {
    const api = getExtensionAPI();
    if (api && api.tabs && api.tabs.create) {
      api.tabs.create({ url }, (tab) => {
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    } else {
      reject(new Error('Tabs API not available'));
    }
  });
}

/**
 * Storage helper functions with Safari compatibility
 */
const SafariStorage = {
  /**
   * Get data from storage
   * @param {string|Array|Object} keys - Keys to retrieve
   * @returns {Promise} - Promise that resolves with the data
   */
  get(keys) {
    return new Promise((resolve, reject) => {
      const api = getExtensionAPI();
      if (api && api.storage && api.storage.local) {
        api.storage.local.get(keys, (result) => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } else {
        reject(new Error('Storage API not available'));
      }
    });
  },

  /**
   * Set data in storage
   * @param {Object} data - Data to store
   * @returns {Promise} - Promise that resolves when data is stored
   */
  set(data) {
    return new Promise((resolve, reject) => {
      const api = getExtensionAPI();
      if (api && api.storage && api.storage.local) {
        api.storage.local.set(data, () => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Storage API not available'));
      }
    });
  },

  /**
   * Remove data from storage
   * @param {string|Array} keys - Keys to remove
   * @returns {Promise} - Promise that resolves when data is removed
   */
  remove(keys) {
    return new Promise((resolve, reject) => {
      const api = getExtensionAPI();
      if (api && api.storage && api.storage.local) {
        api.storage.local.remove(keys, () => {
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Storage API not available'));
      }
    });
  }
};

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendMessage,
    getExtensionAPI,
    isSafari,
    getResourceURL,
    createTab,
    SafariStorage
  };
}

// Make functions available globally for Safari extension pages
if (typeof window !== 'undefined') {
  window.SafariMessaging = {
    sendMessage,
    getExtensionAPI,
    isSafari,
    getResourceURL,
    createTab,
    SafariStorage
  };
}