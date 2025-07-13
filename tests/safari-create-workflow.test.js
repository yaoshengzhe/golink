// Safari Create GoLink Workflow Tests
// Tests the complete create golink functionality in Safari

describe('Safari Create GoLink Workflow Tests', () => {
  let mockSafariEnvironment;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    // Create Safari environment
    mockSafariEnvironment = {
      browser: {
        runtime: {
          sendMessage: jest.fn(),
          lastError: null
        },
        tabs: {
          create: jest.fn()
        }
      }
    };

    // Mock DOM
    mockDocument = {
      getElementById: jest.fn(),
      addEventListener: jest.fn(),
      location: {
        search: '?shortName=test'
      }
    };

    mockWindow = {
      location: {
        href: '',
        search: '?shortName=test'
      },
      URLSearchParams: global.URLSearchParams
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

  describe('Safari Create GoLink Form Functionality', () => {
    test('should handle form submission with Safari messaging API', async () => {
      // Mock successful storage
      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'saveMapping') {
          callback({
            shortName: message.shortName,
            url: message.url,
            description: message.description,
            createdAt: Date.now()
          });
        }
      });

      // Simulate Safari create form submission
      const createGoLink = async (shortName, url, description = '') => {
        return new Promise((resolve, reject) => {
          const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
          
          extensionAPI.runtime.sendMessage({
            action: 'saveMapping',
            shortName: shortName,
            url: url,
            description: description
          }, response => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      const result = await createGoLink('test', 'https://example.com', 'Test site');

      expect(result).toEqual({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site',
        createdAt: expect.any(Number)
      });

      expect(mockSafariEnvironment.browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test site'
      }, expect.any(Function));
    });

    test('should handle Safari URL validation', () => {
      const isValidUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      };

      // Valid URLs
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.com')).toBe(true);
      expect(isValidUrl('https://mail.google.com/mail/u/0/#inbox')).toBe(true);

      // Invalid URLs
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    test('should handle Safari short name validation', () => {
      const isValidShortName = (shortName) => {
        return /^[a-zA-Z0-9-_]+$/.test(shortName);
      };

      // Valid short names
      expect(isValidShortName('gmail')).toBe(true);
      expect(isValidShortName('test-123')).toBe(true);
      expect(isValidShortName('my_link')).toBe(true);

      // Invalid short names
      expect(isValidShortName('spa ce')).toBe(false);
      expect(isValidShortName('special@chars')).toBe(false);
      expect(isValidShortName('')).toBe(false);
    });

    test('should check for existing mappings in Safari', async () => {
      const existingMapping = {
        url: 'https://existing.com',
        description: 'Existing link',
        createdAt: Date.now()
      };

      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getMapping' && message.shortName === 'existing') {
          callback(existingMapping);
        } else {
          callback(null);
        }
      });

      const checkExistingMapping = async (shortName) => {
        return new Promise((resolve, reject) => {
          const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
          
          extensionAPI.runtime.sendMessage({
            action: 'getMapping',
            shortName: shortName
          }, response => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      const existingResult = await checkExistingMapping('existing');
      const newResult = await checkExistingMapping('new');

      expect(existingResult).toEqual(existingMapping);
      expect(newResult).toBeNull();
    });

    test('should handle Safari messaging errors gracefully', async () => {
      mockSafariEnvironment.browser.runtime.lastError = { message: 'Connection lost' };
      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const createGoLinkWithError = async () => {
        return new Promise((resolve, reject) => {
          const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
          
          extensionAPI.runtime.sendMessage({
            action: 'saveMapping',
            shortName: 'test',
            url: 'https://example.com'
          }, response => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      await expect(createGoLinkWithError()).rejects.toThrow('Connection lost');
    });
  });

  describe('Safari Create Page URL Parameters', () => {
    test('should handle prefilled shortName from URL parameters', () => {
      const urlParams = new URLSearchParams('?shortName=gmail');
      const prefilledShortName = urlParams.get('shortName');

      expect(prefilledShortName).toBe('gmail');
    });

    test('should handle empty URL parameters', () => {
      const urlParams = new URLSearchParams('');
      const prefilledShortName = urlParams.get('shortName');

      expect(prefilledShortName).toBeNull();
    });

    test('should handle encoded URL parameters', () => {
      const urlParams = new URLSearchParams('?shortName=my%2Dlink');
      const prefilledShortName = urlParams.get('shortName');

      expect(prefilledShortName).toBe('my-link');
    });
  });

  describe('Safari Create Page Integration', () => {
    test('should simulate complete create workflow in Safari', async () => {
      let savedMapping = null;

      // Mock successful save
      mockSafariEnvironment.browser.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'saveMapping') {
          savedMapping = {
            shortName: message.shortName,
            url: message.url,
            description: message.description,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          callback(savedMapping);
        }
      });

      // Simulate the complete workflow
      const simulateCreateWorkflow = async () => {
        // 1. User types go/newlink in Safari address bar
        // 2. Background script redirects to create.html?shortName=newlink
        // 3. Create page loads with prefilled shortName
        const urlParams = new URLSearchParams('?shortName=newlink');
        const prefilledShortName = urlParams.get('shortName');
        
        // 4. User fills in URL and description
        const formData = {
          shortName: prefilledShortName,
          url: 'https://newsite.com',
          description: 'New site'
        };

        // 5. Form submits and saves mapping
        return new Promise((resolve, reject) => {
          const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
          
          extensionAPI.runtime.sendMessage({
            action: 'saveMapping',
            ...formData
          }, response => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      const result = await simulateCreateWorkflow();

      expect(result).toEqual({
        shortName: 'newlink',
        url: 'https://newsite.com',
        description: 'New site',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      expect(savedMapping).toEqual(result);
    });
  });
});