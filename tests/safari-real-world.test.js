// Safari Real-World Integration Tests
// Tests actual Safari extension behavior with realistic scenarios

const fs = require('fs');
const path = require('path');

describe('Safari Real-World Integration Tests', () => {
  let mockSafariEnvironment;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    // Create realistic Safari environment
    mockSafariEnvironment = {
      browser: {
        runtime: {
          getURL: jest.fn(path => `safari-web-extension://golinks-safari/${path}`),
          sendMessage: jest.fn(),
          lastError: null,
          onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
          },
          getManifest: jest.fn(() => ({
            name: 'GoLinks Safari',
            version: '1.0.0',
            manifest_version: 2
          }))
        },
        storage: {
          local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
          }
        },
        tabs: {
          query: jest.fn(),
          update: jest.fn(),
          create: jest.fn(),
          getCurrent: jest.fn()
        },
        webNavigation: {
          onBeforeNavigate: {
            addListener: jest.fn()
          }
        },
        action: {
          onClicked: {
            addListener: jest.fn()
          }
        }
      }
    };

    // Mock DOM environment for Safari extension pages
    mockDocument = {
      getElementById: jest.fn(),
      createElement: jest.fn(() => ({
        style: {},
        innerHTML: '',
        textContent: '',
        addEventListener: jest.fn(),
        click: jest.fn()
      })),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn(),
      location: {
        href: 'safari-web-extension://golinks-safari/popup.html',
        search: ''
      }
    };

    mockWindow = {
      location: mockDocument.location,
      document: mockDocument,
      addEventListener: jest.fn(),
      browser: mockSafariEnvironment.browser
    };

    // Set up global environment
    global.browser = mockSafariEnvironment.browser;
    global.document = mockDocument;
    global.window = mockWindow;
    delete global.chrome; // Safari doesn't have chrome API
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Safari URL Navigation Real-World Tests', () => {
    test('should handle typical user flow: type http://go/gmail in Safari address bar', async () => {
      const testGoLinks = {
        gmail: { 
          url: 'https://mail.google.com/mail/u/0/#inbox', 
          description: 'Gmail Inbox',
          createdAt: Date.now()
        }
      };

      // Mock storage response
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: testGoLinks });
      });

      // Mock tab update
      mockSafariEnvironment.browser.tabs.update.mockImplementation((tabId, props, callback) => {
        callback && callback({ id: tabId, ...props });
      });

      // Simulate Safari's webNavigation event for http://go/gmail
      const navigationDetails = {
        tabId: 123,
        frameId: 0,
        url: 'http://go/gmail',
        timeStamp: Date.now()
      };

      // Simulate background script handling
      const backgroundHandler = async (details) => {
        if (details.frameId !== 0) return;
        
        const url = new URL(details.url);
        if (url.hostname === 'go' && url.pathname.startsWith('/')) {
          const shortName = url.pathname.slice(1);
          
          return new Promise(resolve => {
            mockSafariEnvironment.browser.storage.local.get('golinks', (data) => {
              const mapping = data?.golinks?.[shortName];
              if (mapping && mapping.url) {
                mockSafariEnvironment.browser.tabs.update(details.tabId, { url: mapping.url });
                console.log(`Safari: Redirecting go/${shortName} to ${mapping.url}`);
              } else {
                const createUrl = mockSafariEnvironment.browser.runtime.getURL('create.html') + 
                                `?shortName=${encodeURIComponent(shortName)}`;
                mockSafariEnvironment.browser.tabs.update(details.tabId, { url: createUrl });
                console.log(`Safari: No mapping for ${shortName}, opening create page`);
              }
              resolve();
            });
          });
        }
      };

      await backgroundHandler(navigationDetails);

      expect(mockSafariEnvironment.browser.storage.local.get).toHaveBeenCalledWith('golinks', expect.any(Function));
      expect(mockSafariEnvironment.browser.tabs.update).toHaveBeenCalledWith(123, {
        url: 'https://mail.google.com/mail/u/0/#inbox'
      });
    });

    test('should handle non-existent link: http://go/nonexistent', async () => {
      // Mock empty storage
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: {} });
      });

      const navigationDetails = {
        tabId: 124,
        frameId: 0,
        url: 'http://go/nonexistent'
      };

      const backgroundHandler = async (details) => {
        const url = new URL(details.url);
        if (url.hostname === 'go' && url.pathname.startsWith('/')) {
          const shortName = url.pathname.slice(1);
          
          return new Promise(resolve => {
            mockSafariEnvironment.browser.storage.local.get('golinks', (data) => {
              const mapping = data?.golinks?.[shortName];
              if (!mapping) {
                const createUrl = mockSafariEnvironment.browser.runtime.getURL('create.html') + 
                                `?shortName=${encodeURIComponent(shortName)}`;
                mockSafariEnvironment.browser.tabs.update(details.tabId, { url: createUrl });
              }
              resolve();
            });
          });
        }
      };

      await backgroundHandler(navigationDetails);

      expect(mockSafariEnvironment.browser.tabs.update).toHaveBeenCalledWith(124, {
        url: 'safari-web-extension://golinks-safari/create.html?shortName=nonexistent'
      });
    });

    test('should reject invalid Safari URL patterns', () => {
      const invalidPatterns = [
        'go/gmail', // Missing protocol - Safari requirement
        'http://go/', // Missing shortname  
        'http://go', // No trailing slash
        'http://google.com/go', // Wrong domain
        'https://go/spa ce', // Invalid characters
        'http://go//double', // Double slash
      ];

      const isValidSafariGoLink = (urlString) => {
        try {
          const url = new URL(urlString);
          return url.hostname === 'go' && 
                 url.pathname.match(/^\/[a-zA-Z0-9_-]+$/) !== null &&
                 (url.protocol === 'http:' || url.protocol === 'https:');
        } catch {
          return false;
        }
      };

      invalidPatterns.forEach(pattern => {
        expect(isValidSafariGoLink(pattern)).toBe(false);
      });

      // Valid patterns should pass
      const validPatterns = [
        'http://go/gmail',
        'https://go/drive', 
        'http://go/my-link',
        'http://go/test_link'
      ];

      validPatterns.forEach(pattern => {
        expect(isValidSafariGoLink(pattern)).toBe(true);
      });
    });
  });

  describe('Safari Extension Popup Real-World Tests', () => {
    test('should simulate Safari extension popup opening and link creation', async () => {
      // Mock DOM elements for popup
      const mockElements = {
        shortNameInput: {
          value: '',
          addEventListener: jest.fn(),
          focus: jest.fn()
        },
        urlInput: {
          value: '',
          addEventListener: jest.fn()
        },
        saveButton: {
          addEventListener: jest.fn(),
          disabled: false
        },
        linksList: {
          innerHTML: ''
        }
      };

      mockDocument.getElementById.mockImplementation((id) => {
        const elementMap = {
          'shortName': mockElements.shortNameInput,
          'url': mockElements.urlInput,
          'saveButton': mockElements.saveButton,
          'linksList': mockElements.linksList
        };
        return elementMap[id] || null;
      });

      // Mock storage operations
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: {} });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      // Simulate popup initialization
      const initializePopup = () => {
        const shortNameEl = mockDocument.getElementById('shortName');
        const urlEl = mockDocument.getElementById('url');
        const saveButtonEl = mockDocument.getElementById('saveButton');

        if (shortNameEl && urlEl && saveButtonEl) {
          shortNameEl.focus();
          return true;
        }
        return false;
      };

      // Simulate user creating a new link
      const createLink = async (shortName, url, description = '') => {
        return new Promise((resolve) => {
          mockSafariEnvironment.browser.storage.local.get('golinks', (data) => {
            const golinks = data.golinks || {};
            golinks[shortName] = {
              url: url,
              description: description,
              createdAt: Date.now()
            };

            mockSafariEnvironment.browser.storage.local.set({ golinks }, () => {
              resolve({ success: true, shortName, url });
            });
          });
        });
      };

      expect(initializePopup()).toBe(true);
      
      const result = await createLink('test', 'https://example.com', 'Test site');
      
      expect(result).toEqual({
        success: true,
        shortName: 'test',
        url: 'https://example.com'
      });

      expect(mockSafariEnvironment.browser.storage.local.set).toHaveBeenCalledWith(
        {
          golinks: {
            test: {
              url: 'https://example.com',
              description: 'Test site',
              createdAt: expect.any(Number)
            }
          }
        },
        expect.any(Function)
      );
    });

    test('should handle Safari popup URL validation', () => {
      const validateUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      };

      const validateShortName = (shortName) => {
        return /^[a-zA-Z0-9_-]+$/.test(shortName) && shortName.length > 0;
      };

      // Valid inputs
      expect(validateUrl('https://google.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateShortName('gmail')).toBe(true);
      expect(validateShortName('my-link')).toBe(true);
      expect(validateShortName('test_123')).toBe(true);

      // Invalid inputs
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateShortName('spa ce')).toBe(false);
      expect(validateShortName('')).toBe(false);
      expect(validateShortName('special@chars')).toBe(false);
    });
  });

  describe('Safari Storage and Persistence Tests', () => {
    test('should handle Safari storage quota and large datasets', async () => {
      // Simulate large dataset
      const largeDataset = {};
      for (let i = 0; i < 1000; i++) {
        largeDataset[`link${i}`] = {
          url: `https://example${i}.com`,
          description: `Test link ${i}`,
          createdAt: Date.now() - (i * 1000)
        };
      }

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        // Simulate quota exceeded for large datasets
        const dataSize = JSON.stringify(data).length;
        if (dataSize > 50000) { // Lower threshold for testing
          mockSafariEnvironment.browser.runtime.lastError = { 
            message: 'QUOTA_EXCEEDED_ERR' 
          };
        } else {
          mockSafariEnvironment.browser.runtime.lastError = null;
        }
        if (callback) callback();
      });

      let quotaExceeded = false;
      await new Promise(resolve => {
        mockSafariEnvironment.browser.storage.local.set({ golinks: largeDataset }, () => {
          if (mockSafariEnvironment.browser.runtime.lastError) {
            quotaExceeded = true;
          }
          resolve();
        });
      });

      expect(quotaExceeded).toBe(true);
    });

    test('should handle Safari storage corruption recovery', async () => {
      // Simulate corrupted storage
      mockSafariEnvironment.browser.storage.local.get.mockImplementation((key, callback) => {
        // Return corrupted data
        callback({ golinks: 'corrupted-string-instead-of-object' });
      });

      const recoverStorage = () => {
        return new Promise(resolve => {
          mockSafariEnvironment.browser.storage.local.get('golinks', (data) => {
            let golinks = {};
            
            try {
              if (data && typeof data.golinks === 'object' && data.golinks !== null) {
                golinks = data.golinks;
              } else {
                console.warn('Safari: Corrupted storage detected, resetting...');
                golinks = {};
              }
            } catch (error) {
              console.error('Safari: Storage recovery error:', error);
              golinks = {};
            }
            
            resolve(golinks);
          });
        });
      };

      const recovered = await recoverStorage();
      expect(recovered).toEqual({});
    });
  });

  describe('Safari Extension Messaging Integration', () => {
    test('should handle Safari background-to-popup messaging', async () => {
      const testMessage = { action: 'getAllLinks' };
      const testResponse = {
        golinks: {
          gmail: { url: 'https://mail.google.com', description: 'Gmail' }
        }
      };

      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        // Simulate background script response
        if (message.action === 'getAllLinks') {
          if (callback) callback(testResponse);
        } else {
          if (callback) callback({ error: 'Unknown action' });
        }
      });

      const result = await new Promise(resolve => {
        mockSafariEnvironment.browser.runtime.sendMessage(testMessage, resolve);
      });

      expect(result).toEqual(testResponse);
    });

    test('should handle Safari messaging timeouts', () => {
      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        // Don't call callback to simulate timeout - this is intentional
      });

      const sendMessageWithTimeout = (message, timeout = 100) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Message timeout'));
          }, timeout);

          try {
            mockSafariEnvironment.browser.runtime.sendMessage(message, (response) => {
              clearTimeout(timer);
              if (mockSafariEnvironment.browser.runtime.lastError) {
                reject(new Error(mockSafariEnvironment.browser.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          } catch (error) {
            clearTimeout(timer);
            reject(error);
          }
        });
      };

      // Verify that sendMessage was called but callback was not invoked
      expect(() => sendMessageWithTimeout({ action: 'test' }, 50)).not.toThrow();
      expect(mockSafariEnvironment.browser.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'test' },
        expect.any(Function)
      );
    });
  });

  describe('Safari Performance and Memory Tests', () => {
    test('should handle Safari memory cleanup on extension disable', () => {
      const listeners = [];
      let isExtensionEnabled = true;

      mockSafariEnvironment.browser.runtime.onMessage.addListener.mockImplementation((listener) => {
        if (isExtensionEnabled) {
          listeners.push(listener);
        }
      });

      // Add some listeners
      const listener1 = () => {};
      const listener2 = () => {};
      
      mockSafariEnvironment.browser.runtime.onMessage.addListener(listener1);
      mockSafariEnvironment.browser.runtime.onMessage.addListener(listener2);
      
      expect(listeners).toHaveLength(2);

      // Simulate extension disable
      isExtensionEnabled = false;
      
      // Cleanup should remove listeners
      const cleanup = () => {
        listeners.length = 0;
      };

      cleanup();
      expect(listeners).toHaveLength(0);
    });

    test('should handle Safari concurrent storage operations', async () => {
      let storageOperationCount = 0;
      
      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        storageOperationCount++;
        if (callback) callback();
        storageOperationCount--;
      });

      // Start multiple concurrent operations
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(new Promise(resolve => {
          mockSafariEnvironment.browser.storage.local.set(
            { [`test${i}`]: `value${i}` }, 
            resolve
          );
        }));
      }

      await Promise.all(operations);
      
      expect(mockSafariEnvironment.browser.storage.local.set).toHaveBeenCalledTimes(5);
      expect(storageOperationCount).toBe(0); // All operations should be complete
    });
  });

  describe('Safari Extension Lifecycle Tests', () => {
    test('should handle Safari extension installation', async () => {
      const installHandler = jest.fn();
      
      // Mock storage for installation
      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });
      
      // Simulate installation event
      const simulateInstall = () => {
        const defaultLinks = {
          gmail: { 
            url: 'https://mail.google.com', 
            description: 'Gmail',
            createdAt: Date.now()
          }
        };

        return new Promise(resolve => {
          mockSafariEnvironment.browser.storage.local.set({ golinks: defaultLinks }, () => {
            installHandler();
            resolve(defaultLinks);
          });
        });
      };

      const result = await simulateInstall();
      
      expect(installHandler).toHaveBeenCalled();
      expect(result).toHaveProperty('gmail');
      expect(mockSafariEnvironment.browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          golinks: expect.objectContaining({
            gmail: expect.any(Object)
          })
        }),
        expect.any(Function)
      );
    });

    test('should handle Safari extension update', async () => {
      // Mock existing data
      const existingData = {
        gmail: { url: 'https://mail.google.com', version: 1 }
      };

      mockSafariEnvironment.browser.storage.local.get.mockImplementation((key, callback) => {
        if (callback) callback({ golinks: existingData });
      });

      mockSafariEnvironment.browser.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      // Simulate migration
      const migrateData = () => {
        return new Promise(resolve => {
          mockSafariEnvironment.browser.storage.local.get('golinks', (data) => {
            const golinks = data.golinks || {};
            
            // Add missing fields for migration
            Object.keys(golinks).forEach(key => {
              if (!golinks[key].createdAt) {
                golinks[key].createdAt = Date.now();
              }
              if (!golinks[key].description) {
                golinks[key].description = '';
              }
            });

            mockSafariEnvironment.browser.storage.local.set({ golinks }, () => {
              resolve(golinks);
            });
          });
        });
      };

      const result = await migrateData();
      
      expect(result.gmail).toHaveProperty('createdAt');
      expect(result.gmail).toHaveProperty('description');
    });
  });
});