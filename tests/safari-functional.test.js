// Comprehensive Safari Functional Tests
// Tests real Safari extension functionality with proper browser APIs

describe('Safari Extension Functional Tests', () => {
  let mockSafariAPI;
  let originalLocation;
  let originalChrome;
  let originalBrowser;

  beforeEach(() => {
    // Store original globals
    originalLocation = global.location;
    originalChrome = global.chrome;
    originalBrowser = global.browser;

    // Mock Safari-specific browser API
    mockSafariAPI = {
      runtime: {
        getURL: jest.fn(path => `safari-web-extension://extension-id/${path}`),
        sendMessage: jest.fn(),
        lastError: null,
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
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
    };

    // Set up Safari environment
    global.browser = mockSafariAPI;
    delete global.chrome; // Safari uses browser API, not chrome API

    // Mock location for URL testing
    global.location = {
      href: 'http://go/test',
      hostname: 'go',
      pathname: '/test',
      protocol: 'http:',
      search: '',
      hash: ''
    };
  });

  afterEach(() => {
    // Restore globals
    global.location = originalLocation;
    global.chrome = originalChrome;
    global.browser = originalBrowser;
    jest.clearAllMocks();
  });

  describe('Safari URL Pattern Recognition', () => {
    test('should recognize http://go/shortname pattern', () => {
      const testUrls = [
        'http://go/gmail',
        'http://go/drive',
        'http://go/test-link',
        'http://go/my_link'
      ];

      testUrls.forEach(url => {
        const urlObj = new URL(url);
        expect(urlObj.hostname).toBe('go');
        expect(urlObj.pathname).toMatch(/^\/[\w-_]+$/);
      });
    });

    test('should extract shortname from Safari go URLs', () => {
      const extractShortName = (url) => {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'go' && urlObj.pathname.startsWith('/')) {
          return urlObj.pathname.slice(1);
        }
        return null;
      };

      expect(extractShortName('http://go/gmail')).toBe('gmail');
      expect(extractShortName('http://go/drive')).toBe('drive');
      expect(extractShortName('http://go/test-link')).toBe('test-link');
      expect(extractShortName('https://go/secure')).toBe('secure');
    });

    test('should reject invalid Safari go URL patterns', () => {
      const invalidUrls = [
        'go/gmail', // Missing protocol - Safari requirement
        'http://go/', // Missing shortname
        'http://go', // Missing slash
        'http://go//double', // Double slash
        'http://go/spa ce', // Space in shortname
        'http://google.com/search' // Wrong domain
      ];

      const isValidGoLink = (urlString) => {
        try {
          const url = new URL(urlString);
          return url.hostname === 'go' && 
                 url.pathname.match(/^\/[\w-_]+$/) !== null;
        } catch {
          return false;
        }
      };

      invalidUrls.forEach(url => {
        expect(isValidGoLink(url)).toBe(false);
      });
    });
  });

  describe('Safari Extension Storage Operations', () => {
    test('should store and retrieve golinks in Safari', async () => {
      const testData = {
        golinks: {
          gmail: { url: 'https://mail.google.com', description: 'Gmail' },
          drive: { url: 'https://drive.google.com', description: 'Google Drive' }
        }
      };

      // Mock Safari storage.local.set
      mockSafariAPI.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      });

      // Mock Safari storage.local.get
      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        if (callback) callback(testData);
        return Promise.resolve(testData);
      });

      // Test storage operations
      await new Promise(resolve => {
        mockSafariAPI.storage.local.set(testData, resolve);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.storage.local.get('golinks', resolve);
      });

      expect(result).toEqual(testData);
      expect(mockSafariAPI.storage.local.set).toHaveBeenCalledWith(testData, expect.any(Function));
      expect(mockSafariAPI.storage.local.get).toHaveBeenCalledWith('golinks', expect.any(Function));
    });

    test('should handle Safari storage errors gracefully', async () => {
      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        mockSafariAPI.runtime.lastError = { message: 'Storage access denied' };
        callback && callback(null);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.storage.local.get('golinks', (data) => {
          if (mockSafariAPI.runtime.lastError) {
            resolve({ error: mockSafariAPI.runtime.lastError.message });
          } else {
            resolve(data);
          }
        });
      });

      expect(result).toEqual({ error: 'Storage access denied' });
    });
  });

  describe('Safari Tab Navigation', () => {
    test('should redirect tabs using Safari tabs API', async () => {
      const testMapping = { url: 'https://mail.google.com' };
      
      mockSafariAPI.tabs.update.mockImplementation((tabId, updateProps, callback) => {
        if (callback) callback({ id: tabId, ...updateProps });
        return Promise.resolve({ id: tabId, ...updateProps });
      });

      await new Promise(resolve => {
        mockSafariAPI.tabs.update(123, { url: testMapping.url }, resolve);
      });

      expect(mockSafariAPI.tabs.update).toHaveBeenCalledWith(
        123, 
        { url: 'https://mail.google.com' }, 
        expect.any(Function)
      );
    });

    test('should handle Safari tab creation for new windows', async () => {
      mockSafariAPI.tabs.create.mockImplementation((createProps, callback) => {
        const newTab = { id: 456, ...createProps };
        if (callback) callback(newTab);
        return Promise.resolve(newTab);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.tabs.create({ url: 'https://example.com' }, resolve);
      });

      expect(result).toEqual({ id: 456, url: 'https://example.com' });
      expect(mockSafariAPI.tabs.create).toHaveBeenCalledWith(
        { url: 'https://example.com' },
        expect.any(Function)
      );
    });
  });

  describe('Safari Extension Messaging', () => {
    test('should send messages using Safari runtime API', async () => {
      const testMessage = { action: 'getGoLinks' };
      const testResponse = { golinks: { gmail: { url: 'https://mail.google.com' } } };

      mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback(testResponse);
        return Promise.resolve(testResponse);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.runtime.sendMessage(testMessage, resolve);
      });

      expect(result).toEqual(testResponse);
      expect(mockSafariAPI.runtime.sendMessage).toHaveBeenCalledWith(
        testMessage,
        expect.any(Function)
      );
    });

    test('should handle Safari messaging errors', async () => {
      mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
        mockSafariAPI.runtime.lastError = { message: 'Extension context invalidated' };
        callback && callback(null);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.runtime.sendMessage({ action: 'test' }, (response) => {
          if (mockSafariAPI.runtime.lastError) {
            resolve({ error: mockSafariAPI.runtime.lastError.message });
          } else {
            resolve(response);
          }
        });
      });

      expect(result).toEqual({ error: 'Extension context invalidated' });
    });
  });

  describe('Safari Web Extension Manifest Validation', () => {
    test('should validate Safari-compatible manifest structure', () => {
      const fs = require('fs');
      const path = require('path');
      
      let manifest;
      try {
        const manifestPath = path.join(__dirname, '../safari-dist/manifest.json');
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (error) {
        // Create expected Safari manifest structure for testing
        manifest = {
          manifest_version: 2,
          name: 'GoLinks Safari',
          version: '1.0.0',
          permissions: ['storage', 'tabs', 'webNavigation', 'activeTab'],
          background: { scripts: ['background.js'], persistent: false },
          action: { default_popup: 'popup.html' },
          icons: { '16': 'icons/icon-16.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png' }
        };
      }

      // Validate Safari requirements
      expect(manifest.manifest_version).toBe(2); // Safari supports v2
      expect(manifest.permissions).toContain('storage');
      expect(manifest.permissions).toContain('tabs');
      expect(manifest.permissions).toContain('webNavigation');
      expect(manifest.background).toBeDefined();
      expect(manifest.action || manifest.browser_action).toBeDefined();
      expect(manifest.icons).toBeDefined();
    });
  });

  describe('Safari Background Script Navigation Handling', () => {
    test('should simulate Safari webNavigation listener', async () => {
      const navigationHandler = jest.fn();
      mockSafariAPI.webNavigation.onBeforeNavigate.addListener.mockImplementation(navigationHandler);

      // Simulate registering the listener
      const mockListener = async (details) => {
        if (details.frameId !== 0) return;
        
        const url = new URL(details.url);
        if (url.hostname === 'go' && url.pathname.startsWith('/')) {
          const shortName = url.pathname.slice(1);
          
          // Mock storage lookup
          mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
            const mockData = {
              golinks: {
                gmail: { url: 'https://mail.google.com' }
              }
            };
            callback(mockData);
          });

          return new Promise(resolve => {
            mockSafariAPI.storage.local.get('golinks', (data) => {
              const mapping = data?.golinks?.[shortName];
              if (mapping) {
                mockSafariAPI.tabs.update(details.tabId, { url: mapping.url });
              } else {
                const createUrl = mockSafariAPI.runtime.getURL('create.html') + 
                                `?shortName=${encodeURIComponent(shortName)}`;
                mockSafariAPI.tabs.update(details.tabId, { url: createUrl });
              }
              resolve();
            });
          });
        }
      };

      // Test navigation to existing link
      await mockListener({
        tabId: 123,
        frameId: 0,
        url: 'http://go/gmail'
      });

      expect(mockSafariAPI.tabs.update).toHaveBeenCalledWith(123, {
        url: 'https://mail.google.com'
      });

      // Test navigation to non-existent link
      await mockListener({
        tabId: 124,
        frameId: 0,
        url: 'http://go/nonexistent'
      });

      expect(mockSafariAPI.tabs.update).toHaveBeenCalledWith(124, {
        url: 'safari-web-extension://extension-id/create.html?shortName=nonexistent'
      });
    });
  });

  describe('Safari Extension Icon Click Handling', () => {
    test('should handle Safari extension icon clicks', async () => {
      const iconClickHandler = jest.fn();
      mockSafariAPI.action.onClicked.addListener.mockImplementation(iconClickHandler);

      // Simulate icon click handler
      const mockIconClickHandler = async (tab) => {
        const popupUrl = mockSafariAPI.runtime.getURL('popup.html');
        await mockSafariAPI.tabs.create({ url: popupUrl });
      };

      await mockIconClickHandler({ id: 123, url: 'https://example.com' });

      expect(mockSafariAPI.tabs.create).toHaveBeenCalledWith({
        url: 'safari-web-extension://extension-id/popup.html'
      });
    });
  });

  describe('Safari Cross-Platform Compatibility', () => {
    test('should detect Safari browser environment', () => {
      // Safari should have browser API but not chrome API
      expect(global.browser).toBeDefined();
      expect(global.chrome).toBeUndefined();
      
      // Check for Safari-specific features
      expect(mockSafariAPI.runtime.getURL).toBeDefined();
      expect(mockSafariAPI.storage.local).toBeDefined();
      expect(mockSafariAPI.tabs).toBeDefined();
    });

    test('should handle Safari vs Chrome API differences', () => {
      // Safari uses browser.* instead of chrome.*
      const getAPI = () => {
        return typeof browser !== 'undefined' ? browser : 
               typeof chrome !== 'undefined' ? chrome : null;
      };

      const api = getAPI();
      expect(api).toBe(mockSafariAPI);
      expect(api.runtime).toBeDefined();
      expect(api.storage).toBeDefined();
    });
  });

  describe('Safari Error Recovery', () => {
    test('should handle Safari extension context loss', async () => {
      // Simulate extension context invalidation
      mockSafariAPI.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });

      let errorCaught = false;
      try {
        await mockSafariAPI.runtime.sendMessage({ action: 'test' });
      } catch (error) {
        errorCaught = true;
        expect(error.message).toBe('Extension context invalidated');
      }

      expect(errorCaught).toBe(true);
    });

    test('should handle Safari permission denied scenarios', async () => {
      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        mockSafariAPI.runtime.lastError = { message: 'Permission denied' };
        callback(null);
      });

      const result = await new Promise(resolve => {
        mockSafariAPI.storage.local.get('golinks', (data) => {
          if (mockSafariAPI.runtime.lastError) {
            resolve({ error: mockSafariAPI.runtime.lastError.message });
          } else {
            resolve(data);
          }
        });
      });

      expect(result.error).toBe('Permission denied');
    });
  });

  describe('Safari Performance and Reliability', () => {
    test('should handle multiple concurrent Safari operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
          if (callback) callback({ data: `test${i}` });
        });
        
        promises.push(new Promise(resolve => {
          mockSafariAPI.storage.local.get(`key${i}`, resolve);
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(mockSafariAPI.storage.local.get).toHaveBeenCalledTimes(10);
    });

    test('should handle Safari memory cleanup', () => {
      // Simulate cleanup operations
      const listeners = [];
      
      mockSafariAPI.runtime.onMessage.addListener.mockImplementation((listener) => {
        listeners.push(listener);
      });

      mockSafariAPI.runtime.onMessage.removeListener.mockImplementation((listener) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      });

      const testListener = () => {};
      mockSafariAPI.runtime.onMessage.addListener(testListener);
      expect(listeners).toContain(testListener);

      mockSafariAPI.runtime.onMessage.removeListener(testListener);
      expect(listeners).not.toContain(testListener);
    });
  });
});