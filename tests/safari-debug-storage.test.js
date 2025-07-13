// Safari Storage Debug Tests
// Debug actual storage operations to identify why golinks aren't being saved

describe('Safari Storage Debug Tests', () => {
  let mockSafariEnvironment;
  let actualStorageData = {};

  beforeEach(() => {
    // Reset storage
    actualStorageData = {};

    // Create realistic Safari environment that simulates actual storage behavior
    mockSafariEnvironment = {
      browser: {
        runtime: {
          sendMessage: jest.fn(),
          lastError: null,
          onMessage: {
            addListener: jest.fn()
          }
        },
        storage: {
          local: {
            get: jest.fn((keys, callback) => {
              console.log('Storage GET called with keys:', keys);
              if (Array.isArray(keys)) {
                const result = {};
                keys.forEach(key => {
                  result[key] = actualStorageData[key];
                });
                console.log('Storage GET returning:', result);
                callback(result);
              } else if (typeof keys === 'string') {
                const result = { [keys]: actualStorageData[keys] };
                console.log('Storage GET returning:', result);
                callback(result);
              } else {
                console.log('Storage GET returning all:', actualStorageData);
                callback(actualStorageData);
              }
            }),
            set: jest.fn((data, callback) => {
              console.log('Storage SET called with data:', data);
              Object.assign(actualStorageData, data);
              console.log('Storage after SET:', actualStorageData);
              if (callback) callback();
            }),
            remove: jest.fn(),
            clear: jest.fn()
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

  describe('Safari Storage Operation Debug', () => {
    test('should trace complete save operation step by step', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Step 1: Simulate saveGoLinkMapping function exactly as in background.js
      const saveGoLinkMapping = async (shortName, url, description = '') => {
        console.log(`Starting saveGoLinkMapping: ${shortName} -> ${url}`);
        
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        console.log('Created mapping object:', mapping);

        return new Promise(resolve => {
          console.log('Getting existing golinks from storage...');
          extensionAPI.storage.local.get(['golinks'], result => {
            console.log('Got storage result:', result);
            const golinks = result.golinks || {};
            console.log('Existing golinks:', golinks);
            
            golinks[shortName] = mapping;
            console.log('Updated golinks object:', golinks);
            
            console.log('Setting golinks back to storage...');
            extensionAPI.storage.local.set({ golinks }, () => {
              console.log('Storage set complete, resolving with mapping:', mapping);
              resolve(mapping);
            });
          });
        });
      };

      // Step 2: Save a mapping
      const result = await saveGoLinkMapping('test', 'https://example.com', 'Test site');
      
      // Step 3: Verify the result
      expect(result).toEqual({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      // Step 4: Verify storage was called correctly
      expect(mockSafariEnvironment.browser.storage.local.get).toHaveBeenCalledWith(['golinks'], expect.any(Function));
      expect(mockSafariEnvironment.browser.storage.local.set).toHaveBeenCalledWith({
        golinks: {
          test: {
            shortName: 'test',
            url: 'https://example.com',
            description: 'Test site',
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number)
          }
        }
      }, expect.any(Function));

      // Step 5: Verify actual storage state
      expect(actualStorageData).toEqual({
        golinks: {
          test: {
            shortName: 'test',
            url: 'https://example.com',
            description: 'Test site',
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number)
          }
        }
      });
    });

    test('should verify retrieval after save', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // First save a mapping
      const saveGoLinkMapping = async (shortName, url, description = '') => {
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
      };

      // Then retrieve it
      const getGoLinkMapping = async (shortName) => {
        return new Promise(resolve => {
          extensionAPI.storage.local.get(['golinks'], result => {
            const golinks = result.golinks || {};
            resolve(golinks[shortName] || null);
          });
        });
      };

      // Save and retrieve
      const savedMapping = await saveGoLinkMapping('test', 'https://example.com', 'Test site');
      const retrievedMapping = await getGoLinkMapping('test');

      expect(retrievedMapping).toEqual(savedMapping);
      expect(retrievedMapping).not.toBeNull();
      expect(retrievedMapping.url).toBe('https://example.com');
    });

    test('should handle multiple mappings correctly', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      const saveGoLinkMapping = async (shortName, url, description = '') => {
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
      };

      // Save multiple mappings
      await saveGoLinkMapping('gmail', 'https://mail.google.com', 'Gmail');
      await saveGoLinkMapping('drive', 'https://drive.google.com', 'Google Drive');
      await saveGoLinkMapping('test', 'https://example.com', 'Test site');

      // Verify all are stored
      expect(actualStorageData.golinks).toHaveProperty('gmail');
      expect(actualStorageData.golinks).toHaveProperty('drive');
      expect(actualStorageData.golinks).toHaveProperty('test');
      expect(Object.keys(actualStorageData.golinks)).toHaveLength(3);
    });

    test('should simulate message handler exactly as background script', async () => {
      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      // Simulate the exact message handler from background.js
      const messageHandler = (request, sender, sendResponse) => {
        console.log('Message handler received:', request.action);
        
        const saveGoLinkMapping = async (shortName, url, description = '') => {
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
        };
        
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
            return true; // Keep message channel open for async response

          default:
            console.warn('Safari: Unknown action:', request.action);
            sendResponse({ error: 'Unknown action' });
            return false;
        }
      };

      // Simulate sending a message
      const mockSendResponse = jest.fn();
      const request = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site'
      };

      const keepChannelOpen = messageHandler(request, null, mockSendResponse);
      
      // Give async operation time to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(keepChannelOpen).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      // Verify storage
      expect(actualStorageData.golinks.test).toBeDefined();
      expect(actualStorageData.golinks.test.url).toBe('https://example.com');
    });
  });

  describe('Safari Storage Edge Cases', () => {
    test('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        mockSafariEnvironment.browser.runtime.lastError = { message: 'Storage quota exceeded' };
        if (callback) callback();
      });

      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
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

    test('should handle corrupted storage data', async () => {
      // Set corrupted data
      actualStorageData.golinks = 'corrupted-string';

      const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
      
      const saveGoLinkMapping = async (shortName, url, description = '') => {
        const mapping = {
          shortName,
          url,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return new Promise(resolve => {
          extensionAPI.storage.local.get(['golinks'], result => {
            let golinks = {};
            
            // Handle corrupted data
            if (result.golinks && typeof result.golinks === 'object') {
              golinks = result.golinks;
            } else {
              console.warn('Corrupted golinks data detected, resetting...');
              golinks = {};
            }
            
            golinks[shortName] = mapping;
            
            extensionAPI.storage.local.set({ golinks }, () => {
              resolve(mapping);
            });
          });
        });
      };

      const result = await saveGoLinkMapping('test', 'https://example.com');
      
      expect(result.shortName).toBe('test');
      expect(actualStorageData.golinks).toEqual({
        test: expect.any(Object)
      });
    });
  });
});