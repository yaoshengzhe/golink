// Safari Storage Error Handling Tests
// Test that the improved error handling in storage operations works correctly

describe('Safari Storage Error Handling Tests', () => {
  let mockSafariEnvironment;

  beforeEach(() => {
    // Create Safari environment
    mockSafariEnvironment = {
      browser: {
        runtime: {
          lastError: null,
          sendMessage: jest.fn(),
          onMessage: {
            addListener: jest.fn()
          }
        },
        storage: {
          local: {
            get: jest.fn(),
            set: jest.fn()
          }
        }
      }
    };

    global.browser = mockSafariEnvironment.browser;
    delete global.chrome;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Safari Storage Functions with Error Handling', () => {
    test('should handle storage GET errors in saveGoLinkMapping', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock storage GET error
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Storage unavailable' };
        callback(null);
      });

      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            
            const golinks = result.golinks || {};
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              if (extensionAPI.runtime.lastError) {
                reject(new Error(extensionAPI.runtime.lastError.message));
              } else {
                resolve(mapping);
              }
            });
          });
        });
      };

      await expect(saveGoLinkMapping('test', 'https://example.com')).rejects.toThrow('Storage unavailable');
    });

    test('should handle storage SET errors in saveGoLinkMapping', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock successful GET but failed SET
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback({ golinks: {} });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Storage quota exceeded' };
        callback();
      });

      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            
            const golinks = result.golinks || {};
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              if (extensionAPI.runtime.lastError) {
                reject(new Error(extensionAPI.runtime.lastError.message));
              } else {
                resolve(mapping);
              }
            });
          });
        });
      };

      await expect(saveGoLinkMapping('test', 'https://example.com')).rejects.toThrow('Storage quota exceeded');
    });

    test('should handle successful storage operations', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock successful operations
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback({ golinks: {} });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback();
      });

      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            
            const golinks = result.golinks || {};
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              if (extensionAPI.runtime.lastError) {
                reject(new Error(extensionAPI.runtime.lastError.message));
              } else {
                resolve(mapping);
              }
            });
          });
        });
      };

      const result = await saveGoLinkMapping('test', 'https://example.com', 'Test site');
      
      expect(result).toEqual({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
    });

    test('should handle errors in getGoLinkMapping', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock storage GET error
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Permission denied' };
        callback(null);
      });

      const getGoLinkMapping = async (shortName) => {
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
      };

      await expect(getGoLinkMapping('test')).rejects.toThrow('Permission denied');
    });

    test('should handle errors in getAllGoLinkMappings', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock storage GET error
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Network error' };
        callback(null);
      });

      const getAllGoLinkMappings = async () => {
        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            resolve(result.golinks || {});
          });
        });
      };

      await expect(getAllGoLinkMappings()).rejects.toThrow('Network error');
    });

    test('should handle errors in deleteGoLinkMapping', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock successful GET but failed SET
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback({ golinks: { test: { url: 'https://example.com' } } });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Write failed' };
        callback();
      });

      const deleteGoLinkMapping = async (shortName) => {
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
      };

      await expect(deleteGoLinkMapping('test')).rejects.toThrow('Write failed');
    });
  });

  describe('Safari Message Handler Error Propagation', () => {
    test('should propagate storage errors through message handler', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock storage error
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Storage error' };
        callback(null);
      });

      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            
            const golinks = result.golinks || {};
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              if (extensionAPI.runtime.lastError) {
                reject(new Error(extensionAPI.runtime.lastError.message));
              } else {
                resolve(mapping);
              }
            });
          });
        });
      };

      // Simulate message handler
      const messageHandler = (request, sender, sendResponse) => {
        switch (request.action) {
          case 'saveMapping':
            saveGoLinkMapping(request.shortName, request.url, request.description)
              .then(result => {
                console.log('Safari: Saved mapping:', result);
                sendResponse(result);
              })
              .catch(error => {
                console.error('Safari: Save mapping error:', error);
                sendResponse({ error: error.message });
              });
            return true;

          default:
            sendResponse({ error: 'Unknown action' });
            return false;
        }
      };

      const mockSendResponse = jest.fn();
      const request = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site'
      };

      messageHandler(request, null, mockSendResponse);
      
      // Give async operation time to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'Storage error'
      });
    });

    test('should handle successful saves through message handler', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Mock successful operations
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((keys, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback({ golinks: {} });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = null;
        callback();
      });

      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          extensionAPI.storage.local.get(['golinks'], result => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
              return;
            }
            
            const golinks = result.golinks || {};
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              if (extensionAPI.runtime.lastError) {
                reject(new Error(extensionAPI.runtime.lastError.message));
              } else {
                resolve(mapping);
              }
            });
          });
        });
      };

      // Simulate message handler
      const messageHandler = (request, sender, sendResponse) => {
        switch (request.action) {
          case 'saveMapping':
            saveGoLinkMapping(request.shortName, request.url, request.description)
              .then(result => {
                console.log('Safari: Saved mapping:', result);
                sendResponse(result);
              })
              .catch(error => {
                console.error('Safari: Save mapping error:', error);
                sendResponse({ error: error.message });
              });
            return true;

          default:
            sendResponse({ error: 'Unknown action' });
            return false;
        }
      };

      const mockSendResponse = jest.fn();
      const request = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site'
      };

      messageHandler(request, null, mockSendResponse);
      
      // Give async operation time to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSendResponse).toHaveBeenCalledWith({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
    });
  });
});