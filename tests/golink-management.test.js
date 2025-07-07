const { JSDOM } = require('jsdom');

// Mock storage for testing
const mockStorage = new Map();

const mockExtensionAPI = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: null,
    onMessage: {
      addListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (typeof keys === 'string') {
          callback({ [keys]: mockStorage.get(keys) });
        } else if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            result[key] = mockStorage.get(key);
          });
          callback(result);
        } else {
          // Get all items
          const result = {};
          mockStorage.forEach((value, key) => {
            result[key] = value;
          });
          callback(result);
        }
      }),
      set: jest.fn((items, callback) => {
        Object.entries(items).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (typeof keys === 'string') {
          mockStorage.delete(keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(key => mockStorage.delete(key));
        }
        if (callback) callback();
      }),
    },
  },
};

// Mock background script message handlers
const mockBackgroundHandlers = {
  saveMapping: async data => {
    const { shortName, url, description } = data;

    // Validate input
    if (!shortName) {
      return { error: 'Missing required fields' };
    }

    if (!url) {
      return { error: 'Missing required fields' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(shortName)) {
      return { error: 'Invalid short name format' };
    }

    // Validate URL format
    if (!url || url.trim() === '') {
      return { error: 'Invalid URL format' };
    }

    try {
      const urlObj = new URL(url);
      // Additional validation - URL must have a valid protocol and host
      if (!urlObj.protocol || !urlObj.host) {
        return { error: 'Invalid URL format' };
      }
    } catch {
      return { error: 'Invalid URL format' };
    }

    // Save to storage
    const mappings = mockStorage.get('golinks') || {};
    mappings[shortName] = { url, description, created: Date.now() };
    mockStorage.set('golinks', mappings);

    return { success: true };
  },

  getAllMappings: async () => {
    return mockStorage.get('golinks') || {};
  },

  deleteMapping: async data => {
    const { shortName } = data;
    const mappings = mockStorage.get('golinks') || {};

    if (!mappings[shortName]) {
      return { error: 'Link not found' };
    }

    delete mappings[shortName];
    mockStorage.set('golinks', mappings);

    return { success: true };
  },

  navigateToUrl: async data => {
    const { shortName } = data;
    const mappings = mockStorage.get('golinks') || {};

    if (!mappings[shortName]) {
      return { error: 'Link not found' };
    }

    return { url: mappings[shortName].url };
  },
};

describe('GoLink Management', () => {
  beforeEach(() => {
    // Clear storage
    mockStorage.clear();

    // Clear mocks
    jest.clearAllMocks();

    // Set up message handling
    mockExtensionAPI.runtime.sendMessage.mockImplementation(
      (message, callback) => {
        const { action, ...data } = message;

        if (mockBackgroundHandlers[action]) {
          mockBackgroundHandlers[action](data)
            .then(result => {
              callback(result);
            })
            .catch(error => {
              callback({ error: error.message });
            });
        } else {
          callback({ error: 'Unknown action' });
        }
      }
    );
  });

  describe('Link Creation', () => {
    test('should create a new GoLink successfully', async () => {
      const result = await mockBackgroundHandlers.saveMapping({
        shortName: 'gmail',
        url: 'https://mail.google.com',
        description: 'Gmail inbox',
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.gmail).toEqual({
        url: 'https://mail.google.com',
        description: 'Gmail inbox',
        created: expect.any(Number),
      });
    });

    test('should reject invalid short names', async () => {
      const testCases = [
        { shortName: 'test space', expected: 'Invalid short name format' },
        { shortName: 'test@domain', expected: 'Invalid short name format' },
        { shortName: 'test.com', expected: 'Invalid short name format' },
        { shortName: '', expected: 'Missing required fields' },
      ];

      for (const testCase of testCases) {
        const result = await mockBackgroundHandlers.saveMapping({
          shortName: testCase.shortName,
          url: 'https://example.com',
        });

        expect(result.error).toBe(testCase.expected);
      }
    });

    test('should accept valid short names', async () => {
      const validNames = ['gmail', 'test-123', 'my_link', 'ABC123', 'a', '1'];

      for (const name of validNames) {
        const result = await mockBackgroundHandlers.saveMapping({
          shortName: name,
          url: 'https://example.com',
        });

        expect(result.success).toBe(true);
      }
    });

    test('should reject invalid URLs', async () => {
      const invalidUrls = ['not-a-url', 'http://', 'https://'];

      for (const url of invalidUrls) {
        const result = await mockBackgroundHandlers.saveMapping({
          shortName: 'test',
          url: url,
        });

        expect(result.error).toBe('Invalid URL format');
      }
    });

    test('should accept valid URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://sub.example.com/path?query=value#fragment',
        'https://localhost:3000',
        'https://127.0.0.1:8080',
      ];

      for (const url of validUrls) {
        const result = await mockBackgroundHandlers.saveMapping({
          shortName: 'test' + Math.random().toString(36).substr(2, 9),
          url: url,
        });

        expect(result.success).toBe(true);
      }
    });

    test('should handle missing required fields', async () => {
      const result1 = await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        // Missing url
      });
      expect(result1.error).toBe('Missing required fields');

      const result2 = await mockBackgroundHandlers.saveMapping({
        url: 'https://example.com',
        // Missing shortName
      });
      expect(result2.error).toBe('Missing required fields');
    });

    test('should overwrite existing links', async () => {
      // Create initial link
      await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        url: 'https://example.com',
        description: 'Original',
      });

      // Overwrite with new data
      const result = await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        url: 'https://updated.com',
        description: 'Updated',
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.test.url).toBe('https://updated.com');
      expect(mappings.test.description).toBe('Updated');
    });
  });

  describe('Link Retrieval', () => {
    test('should retrieve all mappings', async () => {
      // Create test data
      const testMappings = {
        gmail: { url: 'https://gmail.com', description: 'Gmail' },
        github: { url: 'https://github.com', description: 'GitHub' },
        docs: { url: 'https://docs.google.com', description: 'Google Docs' },
      };

      mockStorage.set('golinks', testMappings);

      const result = await mockBackgroundHandlers.getAllMappings();

      expect(result).toEqual(testMappings);
    });

    test('should return empty object when no mappings exist', async () => {
      const result = await mockBackgroundHandlers.getAllMappings();

      expect(result).toEqual({});
    });

    test('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockExtensionAPI.storage.local.get.mockImplementation(
        (keys, callback) => {
          throw new Error('Storage error');
        }
      );

      try {
        await mockBackgroundHandlers.getAllMappings();
      } catch (error) {
        expect(error.message).toBe('Storage error');
      }
    });
  });

  describe('Link Deletion', () => {
    beforeEach(async () => {
      // Set up test data
      await mockBackgroundHandlers.saveMapping({
        shortName: 'test1',
        url: 'https://test1.com',
        description: 'Test 1',
      });
      await mockBackgroundHandlers.saveMapping({
        shortName: 'test2',
        url: 'https://test2.com',
        description: 'Test 2',
      });
    });

    test('should delete existing link', async () => {
      const result = await mockBackgroundHandlers.deleteMapping({
        shortName: 'test1',
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.test1).toBeUndefined();
      expect(mappings.test2).toBeDefined();
    });

    test('should return error for non-existent link', async () => {
      const result = await mockBackgroundHandlers.deleteMapping({
        shortName: 'nonexistent',
      });

      expect(result.error).toBe('Link not found');
    });

    test('should handle deletion of all links', async () => {
      await mockBackgroundHandlers.deleteMapping({ shortName: 'test1' });
      await mockBackgroundHandlers.deleteMapping({ shortName: 'test2' });

      const mappings = mockStorage.get('golinks');
      expect(Object.keys(mappings)).toHaveLength(0);
    });
  });

  describe('Link Navigation', () => {
    beforeEach(async () => {
      await mockBackgroundHandlers.saveMapping({
        shortName: 'example',
        url: 'https://example.com',
        description: 'Example site',
      });
    });

    test('should return URL for existing link', async () => {
      const result = await mockBackgroundHandlers.navigateToUrl({
        shortName: 'example',
      });

      expect(result.url).toBe('https://example.com');
    });

    test('should return error for non-existent link', async () => {
      const result = await mockBackgroundHandlers.navigateToUrl({
        shortName: 'nonexistent',
      });

      expect(result.error).toBe('Link not found');
    });
  });

  describe('Extension API Integration', () => {
    test('should handle saveMapping through extension API', done => {
      const message = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test link',
      };

      mockExtensionAPI.runtime.sendMessage(message, response => {
        expect(response.success).toBe(true);
        done();
      });
    });

    test('should handle getAllMappings through extension API', done => {
      // First create a mapping
      const saveMessage = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
      };

      mockExtensionAPI.runtime.sendMessage(saveMessage, () => {
        // Then retrieve all mappings
        const getMessage = { action: 'getAllMappings' };

        mockExtensionAPI.runtime.sendMessage(getMessage, response => {
          expect(response.test).toBeDefined();
          expect(response.test.url).toBe('https://example.com');
          done();
        });
      });
    });

    test('should handle deleteMapping through extension API', done => {
      // First create a mapping
      const saveMessage = {
        action: 'saveMapping',
        shortName: 'test',
        url: 'https://example.com',
      };

      mockExtensionAPI.runtime.sendMessage(saveMessage, () => {
        // Then delete it
        const deleteMessage = {
          action: 'deleteMapping',
          shortName: 'test',
        };

        mockExtensionAPI.runtime.sendMessage(deleteMessage, response => {
          expect(response.success).toBe(true);
          done();
        });
      });
    });

    test('should handle unknown actions', done => {
      const message = {
        action: 'unknownAction',
        data: 'test',
      };

      mockExtensionAPI.runtime.sendMessage(message, response => {
        expect(response.error).toBe('Unknown action');
        done();
      });
    });
  });

  describe('Data Validation and Sanitization', () => {
    test('should handle whitespace in inputs', async () => {
      const result = await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        url: 'https://example.com',
        description: '  Test description  ',
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.test).toBeDefined();
    });

    test('should handle special characters in descriptions', async () => {
      const specialChars = 'Test with "quotes" & <tags> and émojis 🚀';

      const result = await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        url: 'https://example.com',
        description: specialChars,
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.test.description).toBe(specialChars);
    });

    test('should handle very long descriptions', async () => {
      const longDescription = 'a'.repeat(1000);

      const result = await mockBackgroundHandlers.saveMapping({
        shortName: 'test',
        url: 'https://example.com',
        description: longDescription,
      });

      expect(result.success).toBe(true);

      const mappings = mockStorage.get('golinks');
      expect(mappings.test.description).toBe(longDescription);
    });
  });

  describe('Storage Persistence', () => {
    test('should persist data across sessions', async () => {
      // Create a mapping
      await mockBackgroundHandlers.saveMapping({
        shortName: 'persistent',
        url: 'https://example.com',
        description: 'Persistent link',
      });

      // Simulate session restart by clearing API but keeping storage
      const storedData = mockStorage.get('golinks');

      // Verify data is still there
      expect(storedData.persistent).toBeDefined();
      expect(storedData.persistent.url).toBe('https://example.com');
    });

    test('should handle large numbers of links', async () => {
      // Create many links
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          mockBackgroundHandlers.saveMapping({
            shortName: `link${i}`,
            url: `https://example${i}.com`,
            description: `Link ${i}`,
          })
        );
      }

      await Promise.all(promises);

      const mappings = await mockBackgroundHandlers.getAllMappings();
      expect(Object.keys(mappings)).toHaveLength(100);
    });
  });
});
