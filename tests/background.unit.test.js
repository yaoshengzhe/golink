/* global testHelpers */

describe('Background Script Unit Tests', () => {
  // Mock the background script functions
  let isGoLink, extractShortName, getGoLinkMapping, saveGoLinkMapping;

  beforeAll(() => {
    // Define the functions from background.js for testing
    isGoLink = function (url) {
      if (!url) return false;
      // Check hostname for actual URL objects
      if (url.hostname === 'go') return true;
      // Check href for string patterns
      if (url.href && url.href.startsWith('go/')) return true;
      if (url.href && url.href.match(/^https?:\/\/go\//)) return true;
      return false;
    };

    extractShortName = function (url) {
      let shortName = '';

      if (url.hostname === 'go') {
        shortName = url.pathname.substring(1); // Remove leading slash
      } else if (url.href.startsWith('go/')) {
        shortName = url.href.substring(3); // Remove 'go/'
      } else if (url.href.match(/^https?:\/\/go\//)) {
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
    };

    getGoLinkMapping = async function (shortName) {
      return new Promise(resolve => {
        chrome.storage.local.get([`golink_${shortName}`], result => {
          resolve(result[`golink_${shortName}`] || null);
        });
      });
    };

    saveGoLinkMapping = async function (shortName, url, description = '') {
      const key = `golink_${shortName}`;
      const mapping = {
        shortName,
        url,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return new Promise(resolve => {
        chrome.storage.local.set({ [key]: mapping }, () => {
          resolve(mapping);
        });
      });
    };
  });

  describe('URL Pattern Detection', () => {
    test('should detect go/xyz pattern', () => {
      const url = new URL('http://go/docs');
      expect(isGoLink(url)).toBe(true);
    });

    test('should detect https://go/xyz pattern', () => {
      const url = new URL('https://go/docs');
      expect(isGoLink(url)).toBe(true);
    });

    test('should detect go/xyz pattern without protocol', () => {
      const url = { href: 'go/docs', hostname: '', pathname: '' };
      expect(isGoLink(url)).toBe(true);
    });

    test('should reject non-go URLs', () => {
      const url = new URL('https://example.com/docs');
      expect(isGoLink(url)).toBe(false);
    });

    test('should reject URLs with go in path but different hostname', () => {
      const url = new URL('https://example.com/go/docs');
      expect(isGoLink(url)).toBe(false);
    });
  });

  describe('Short Name Extraction', () => {
    test('should extract short name from go/ URL', () => {
      const url = new URL('http://go/docs');
      expect(extractShortName(url)).toBe('docs');
    });

    test('should extract short name from https://go/ URL', () => {
      const url = new URL('https://go/calendar');
      expect(extractShortName(url)).toBe('calendar');
    });

    test('should extract short name from go/ pattern without protocol', () => {
      const url = { href: 'go/jira', hostname: '', pathname: '' };
      expect(extractShortName(url)).toBe('jira');
    });

    test('should handle URLs with query parameters', () => {
      const url = new URL('http://go/docs?param=value');
      expect(extractShortName(url)).toBe('docs');
    });

    test('should handle URLs with fragments', () => {
      const url = new URL('http://go/docs#section');
      expect(extractShortName(url)).toBe('docs');
    });

    test('should handle complex short names', () => {
      const url = new URL('http://go/team-docs');
      expect(extractShortName(url)).toBe('team-docs');
    });

    test('should handle nested paths', () => {
      const url = new URL('http://go/docs/api');
      expect(extractShortName(url)).toBe('docs/api');
    });
  });

  describe('Storage Operations', () => {
    beforeEach(() => {
      // Reset Chrome storage mocks
      chrome.storage.local.get.mockClear();
      chrome.storage.local.set.mockClear();
    });

    test('should save a go-link mapping', async () => {
      testHelpers.mockChromeStorageSet();

      const mapping = await saveGoLinkMapping(
        'test',
        'https://example.com',
        'Test description'
      );

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          golink_test: expect.objectContaining({
            shortName: 'test',
            url: 'https://example.com',
            description: 'Test description',
          }),
        }),
        expect.any(Function)
      );
      expect(mapping.shortName).toBe('test');
      expect(mapping.url).toBe('https://example.com');
    });

    test('should retrieve a go-link mapping', async () => {
      const testMapping = testHelpers.createMockMapping(
        'docs',
        'https://docs.example.com'
      );
      testHelpers.mockChromeStorageGet({ golink_docs: testMapping });

      const mapping = await getGoLinkMapping('docs');

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        ['golink_docs'],
        expect.any(Function)
      );
      expect(mapping).toEqual(testMapping);
    });

    test('should return null for non-existent mapping', async () => {
      testHelpers.mockChromeStorageGet({});

      const mapping = await getGoLinkMapping('nonexistent');

      expect(mapping).toBe(null);
    });
  });

  describe('URL Validation', () => {
    test('should validate HTTPS URLs', () => {
      expect('https://example.com').toBeValidUrl();
    });

    test('should validate HTTP URLs', () => {
      expect('http://example.com').toBeValidUrl();
    });

    test('should reject invalid URLs', () => {
      expect('not-a-url').not.toBeValidUrl();
    });

    test('should reject empty URLs', () => {
      expect('').not.toBeValidUrl();
    });
  });

  describe('Short Name Validation', () => {
    test('should validate simple short names', () => {
      expect('docs').toBeValidShortName();
    });

    test('should validate short names with numbers', () => {
      expect('docs2').toBeValidShortName();
    });

    test('should validate short names with hyphens', () => {
      expect('team-docs').toBeValidShortName();
    });

    test('should validate short names with underscores', () => {
      expect('team_docs').toBeValidShortName();
    });

    test('should reject short names with spaces', () => {
      expect('team docs').not.toBeValidShortName();
    });

    test('should reject short names with special characters', () => {
      expect('docs@').not.toBeValidShortName();
    });

    test('should reject empty short names', () => {
      expect('').not.toBeValidShortName();
    });
  });
});
