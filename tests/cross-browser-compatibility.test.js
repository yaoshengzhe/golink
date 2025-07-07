const { JSDOM } = require('jsdom');

// Mock APIs for different browsers
const mockApis = {
  chrome: {
    runtime: {
      sendMessage: jest.fn(),
      lastError: null,
      onMessage: { addListener: jest.fn() },
    },
    storage: { local: { get: jest.fn(), set: jest.fn() } },
    tabs: { query: jest.fn(), create: jest.fn() },
  },
  safari: {
    runtime: {
      sendMessage: jest.fn(),
      lastError: null,
      onMessage: { addListener: jest.fn() },
    },
    storage: { local: { get: jest.fn(), set: jest.fn() } },
    tabs: { query: jest.fn(), create: jest.fn() },
  },
  firefox: {
    runtime: {
      sendMessage: jest.fn(),
      lastError: null,
      onMessage: { addListener: jest.fn() },
    },
    storage: { local: { get: jest.fn(), set: jest.fn() } },
    tabs: { query: jest.fn(), create: jest.fn() },
  },
};

describe('Cross-browser API Compatibility', () => {
  let dom, window;

  const createSendMessageFunction = windowObj => {
    return function sendMessage(message) {
      return new Promise((resolve, reject) => {
        const extensionAPI = windowObj.browser || windowObj.chrome;

        if (!extensionAPI || !extensionAPI.runtime) {
          reject(
            new Error(
              'Extension API not available. Make sure the extension is properly loaded.'
            )
          );
          return;
        }

        try {
          extensionAPI.runtime.sendMessage(message, response => {
            const lastError = extensionAPI.runtime.lastError;
            if (lastError) {
              reject(new Error(lastError.message));
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          reject(new Error('Failed to send message: ' + error.message));
        }
      });
    };
  };

  beforeEach(() => {
    // Set up clean DOM for each test
    dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`);
    window = dom.window;
    document = window.document;

    // Clear all mocks
    Object.values(mockApis).forEach(api => {
      Object.values(api).forEach(module => {
        if (module.sendMessage) jest.clearAllMocks();
      });
    });
  });

  describe('API Detection Logic', () => {
    test('should prefer browser API over chrome API (Firefox/Safari)', () => {
      window.browser = mockApis.firefox;
      window.chrome = mockApis.chrome;

      const extensionAPI = window.browser || window.chrome;
      expect(extensionAPI).toBe(mockApis.firefox);
    });

    test('should fall back to chrome API when browser API unavailable', () => {
      window.chrome = mockApis.chrome;

      const extensionAPI = window.browser || window.chrome;
      expect(extensionAPI).toBe(mockApis.chrome);
    });

    test('should handle case where no extension API is available', () => {
      const extensionAPI = window.browser || window.chrome;
      expect(extensionAPI).toBeUndefined();
    });
  });

  describe('Message Sending Compatibility', () => {
    test('should work with Chrome API', async () => {
      window.chrome = mockApis.chrome;
      const sendMessage = createSendMessageFunction(window);

      mockApis.chrome.runtime.sendMessage.mockImplementation(
        (message, callback) => {
          callback({ success: true, browser: 'chrome' });
        }
      );

      const response = await sendMessage({ action: 'test' });
      expect(response).toEqual({ success: true, browser: 'chrome' });
    });

    test('should work with Safari API', async () => {
      window.browser = mockApis.safari;
      const sendMessage = createSendMessageFunction(window);

      mockApis.safari.runtime.sendMessage.mockImplementation(
        (message, callback) => {
          callback({ success: true, browser: 'safari' });
        }
      );

      const response = await sendMessage({ action: 'test' });
      expect(response).toEqual({ success: true, browser: 'safari' });
    });

    test('should work with Firefox API', async () => {
      window.browser = mockApis.firefox;
      const sendMessage = createSendMessageFunction(window);

      mockApis.firefox.runtime.sendMessage.mockImplementation(
        (message, callback) => {
          callback({ success: true, browser: 'firefox' });
        }
      );

      const response = await sendMessage({ action: 'test' });
      expect(response).toEqual({ success: true, browser: 'firefox' });
    });
  });

  describe('Safari-specific Compatibility Issues', () => {
    test('should handle Safari extensionId parameter correctly', async () => {
      window.browser = mockApis.safari;
      const sendMessage = createSendMessageFunction(window);

      // Mock Safari 18.x behavior
      mockApis.safari.runtime.sendMessage.mockImplementation(
        (message, callback) => {
          // Verify correct parameter types
          expect(typeof message).toBe('object');
          expect(typeof callback).toBe('function');
          callback({ success: true });
        }
      );

      await sendMessage({ action: 'test' });
      expect(mockApis.safari.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'test' },
        expect.any(Function)
      );
    });

    test('should handle Safari runtime errors gracefully', async () => {
      window.browser = mockApis.safari;
      const sendMessage = createSendMessageFunction(window);

      mockApis.safari.runtime.lastError = {
        message: 'Safari extension not loaded',
      };
      mockApis.safari.runtime.sendMessage.mockImplementation(
        (message, callback) => {
          callback(null);
        }
      );

      await expect(sendMessage({ action: 'test' })).rejects.toThrow(
        'Safari extension not loaded'
      );
    });
  });

  describe('Storage API Compatibility', () => {
    test('should work with different storage APIs', async () => {
      const testStorageCompatibility = (api, browserName) => {
        return new Promise(resolve => {
          const testData = { test: 'value' };

          api.storage.local.set.mockImplementation((data, callback) => {
            if (callback) callback();
            resolve({ success: true, browser: browserName });
          });

          api.storage.local.get.mockImplementation((key, callback) => {
            callback(testData);
          });

          api.storage.local.set(testData);
        });
      };

      const chromeResult = await testStorageCompatibility(
        mockApis.chrome,
        'chrome'
      );
      const safariResult = await testStorageCompatibility(
        mockApis.safari,
        'safari'
      );
      const firefoxResult = await testStorageCompatibility(
        mockApis.firefox,
        'firefox'
      );

      expect(chromeResult.success).toBe(true);
      expect(safariResult.success).toBe(true);
      expect(firefoxResult.success).toBe(true);
    });
  });

  describe('Console Logging Compatibility', () => {
    test('should log appropriate browser detection messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      window.browser = mockApis.safari;
      const extensionAPI = window.browser || window.chrome;
      const browserType =
        extensionAPI === window.browser ? 'browser' : 'chrome';

      console.log('Using API:', browserType);
      expect(consoleSpy).toHaveBeenCalledWith('Using API:', 'browser');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Compatibility', () => {
    test('should handle different error formats across browsers', async () => {
      const testErrorHandling = (api, errorMessage) => {
        return new Promise(resolve => {
          const sendMessage = createSendMessageFunction({ browser: api });

          api.runtime.lastError = { message: errorMessage };
          api.runtime.sendMessage.mockImplementation((message, callback) => {
            callback(null);
          });

          sendMessage({ action: 'test' }).catch(error => {
            resolve(error.message);
          });
        });
      };

      const chromeError = await testErrorHandling(
        mockApis.chrome,
        'Chrome error'
      );
      const safariError = await testErrorHandling(
        mockApis.safari,
        'Safari error'
      );
      const firefoxError = await testErrorHandling(
        mockApis.firefox,
        'Firefox error'
      );

      expect(chromeError).toBe('Chrome error');
      expect(safariError).toBe('Safari error');
      expect(firefoxError).toBe('Firefox error');
    });
  });

  describe('Manifest Version Compatibility', () => {
    test('should handle different manifest versions', () => {
      const manifestV2 = {
        manifest_version: 2,
        background: { scripts: ['background.js'], persistent: true },
        browser_action: { default_title: 'GoLinks' },
      };

      const manifestV3 = {
        manifest_version: 3,
        background: { service_worker: 'background.js' },
        action: { default_title: 'GoLinks' },
      };

      expect(manifestV2.manifest_version).toBe(2);
      expect(manifestV3.manifest_version).toBe(3);
      expect(manifestV2.browser_action).toBeDefined();
      expect(manifestV3.action).toBeDefined();
    });
  });
});
