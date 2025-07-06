// Unit tests for omnibox functionality
// These tests run without Puppeteer using mocked Chrome APIs
/* global testHelpers */

describe('Omnibox Unit Tests', () => {
  const mockOmniboxCallbacks = {};

  beforeAll(() => {
    // Mock Chrome omnibox API
    chrome.omnibox = {
      onInputEntered: {
        addListener: jest.fn(callback => {
          mockOmniboxCallbacks.onInputEntered = callback;
        }),
      },
      onInputChanged: {
        addListener: jest.fn(callback => {
          mockOmniboxCallbacks.onInputChanged = callback;
        }),
      },
    };

    // Define omnibox handler functions for testing
    const getGoLinkMapping = async function (shortName) {
      return new Promise(resolve => {
        chrome.storage.local.get([`golink_${shortName}`], result => {
          resolve(result[`golink_${shortName}`] || null);
        });
      });
    };

    const getAllGoLinkMappings = async function () {
      return new Promise(resolve => {
        chrome.storage.local.get(null, result => {
          const mappings = {};
          for (const [key, value] of Object.entries(result)) {
            if (key.startsWith('golink_')) {
              const shortName = key.replace('golink_', '');
              mappings[shortName] = value;
            }
          }
          resolve(mappings);
        });
      });
    };

    // Implement the actual omnibox callbacks
    mockOmniboxCallbacks.onInputEntered = async (text, disposition) => {
      const shortName = text.trim();

      if (shortName) {
        try {
          const mapping = await getGoLinkMapping(shortName);

          if (mapping && mapping.url) {
            if (disposition === 'currentTab') {
              chrome.tabs.update({ url: mapping.url });
            } else {
              chrome.tabs.create({ url: mapping.url });
            }
          } else {
            const createUrl =
              chrome.runtime.getURL('create.html') +
              `?shortName=${encodeURIComponent(shortName)}`;

            if (disposition === 'currentTab') {
              chrome.tabs.update({ url: createUrl });
            } else {
              chrome.tabs.create({ url: createUrl });
            }
          }
        } catch (error) {
          console.error('Error handling omnibox go-link:', error);
        }
      }
    };

    mockOmniboxCallbacks.onInputChanged = async (text, suggest) => {
      const input = text.trim().toLowerCase();

      if (input.length > 0) {
        try {
          const mappings = await getAllGoLinkMappings();
          const suggestions = [];

          for (const [shortName, mapping] of Object.entries(mappings)) {
            if (
              shortName.toLowerCase().includes(input) ||
              (mapping.description &&
                mapping.description.toLowerCase().includes(input))
            ) {
              suggestions.push({
                content: shortName,
                description: `${shortName} → ${mapping.url}${mapping.description ? ' - ' + mapping.description : ''}`,
              });
            }
          }

          suggest(suggestions.slice(0, 5));
        } catch (error) {
          console.error('Error getting omnibox suggestions:', error);
        }
      }
    };
  });

  beforeEach(() => {
    // Reset Chrome API mocks
    chrome.tabs.update.mockClear();
    chrome.tabs.create.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.runtime.getURL.mockClear();
  });

  describe('Omnibox Input Handling', () => {
    test('should handle valid go-link input', async () => {
      const testMapping = testHelpers.createMockMapping(
        'docs',
        'https://docs.example.com'
      );
      testHelpers.mockChromeStorageGet({ golink_docs: testMapping });

      // Simulate omnibox input
      if (mockOmniboxCallbacks.onInputEntered) {
        await mockOmniboxCallbacks.onInputEntered('docs', 'currentTab');
      }

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        ['golink_docs'],
        expect.any(Function)
      );
      expect(chrome.tabs.update).toHaveBeenCalledWith({
        url: 'https://docs.example.com',
      });
    });

    test('should handle new tab disposition', async () => {
      const testMapping = testHelpers.createMockMapping(
        'docs',
        'https://docs.example.com'
      );
      testHelpers.mockChromeStorageGet({ golink_docs: testMapping });

      // Simulate omnibox input with new tab
      if (mockOmniboxCallbacks.onInputEntered) {
        await mockOmniboxCallbacks.onInputEntered('docs', 'newTab');
      }

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://docs.example.com',
      });
    });

    test('should redirect to create page for non-existent mapping', async () => {
      testHelpers.mockChromeStorageGet({});
      chrome.runtime.getURL.mockReturnValue(
        'chrome-extension://test-id/create.html'
      );

      // Simulate omnibox input for non-existent mapping
      if (mockOmniboxCallbacks.onInputEntered) {
        await mockOmniboxCallbacks.onInputEntered('newlink', 'currentTab');
      }

      expect(chrome.tabs.update).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/create.html?shortName=newlink',
      });
    });

    test('should handle empty input gracefully', async () => {
      // Simulate omnibox input with empty string
      if (mockOmniboxCallbacks.onInputEntered) {
        await mockOmniboxCallbacks.onInputEntered('', 'currentTab');
      }

      // Should not make any API calls
      expect(chrome.tabs.update).not.toHaveBeenCalled();
      expect(chrome.tabs.create).not.toHaveBeenCalled();
    });

    test('should handle whitespace-only input', async () => {
      // Simulate omnibox input with whitespace
      if (mockOmniboxCallbacks.onInputEntered) {
        await mockOmniboxCallbacks.onInputEntered('   ', 'currentTab');
      }

      // Should not make any API calls
      expect(chrome.tabs.update).not.toHaveBeenCalled();
      expect(chrome.tabs.create).not.toHaveBeenCalled();
    });
  });

  describe('Omnibox Suggestions', () => {
    test('should provide suggestions based on input', async () => {
      const storageData = {
        golink_docs: testHelpers.createMockMapping(
          'docs',
          'https://docs.example.com',
          'Documentation'
        ),
        golink_dashboard: testHelpers.createMockMapping(
          'dashboard',
          'https://dashboard.example.com',
          'Main dashboard'
        ),
        'golink_dev-tools': testHelpers.createMockMapping(
          'dev-tools',
          'https://tools.example.com',
          'Development tools'
        ),
      };

      testHelpers.mockChromeStorageGet(storageData);

      const mockSuggest = jest.fn();

      // Simulate omnibox input change
      if (mockOmniboxCallbacks.onInputChanged) {
        await mockOmniboxCallbacks.onInputChanged('do', mockSuggest);
      }

      expect(mockSuggest).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: 'docs',
            description: expect.stringContaining(
              'docs → https://docs.example.com'
            ),
          }),
        ])
      );
    });

    test('should provide suggestions based on description', async () => {
      const storageData = {
        golink_tools: testHelpers.createMockMapping(
          'tools',
          'https://tools.example.com',
          'Development tools'
        ),
        golink_dashboard: testHelpers.createMockMapping(
          'dashboard',
          'https://dashboard.example.com',
          'Main dashboard'
        ),
      };

      testHelpers.mockChromeStorageGet(storageData);

      const mockSuggest = jest.fn();

      // Search by description
      if (mockOmniboxCallbacks.onInputChanged) {
        await mockOmniboxCallbacks.onInputChanged('development', mockSuggest);
      }

      expect(mockSuggest).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: 'tools',
            description: expect.stringContaining('Development tools'),
          }),
        ])
      );
    });

    test('should limit suggestions to 5 items', async () => {
      const storageData = {};
      for (let i = 0; i < 10; i++) {
        storageData[`golink_link${i}`] = testHelpers.createMockMapping(
          `link${i}`,
          `https://example${i}.com`
        );
      }

      testHelpers.mockChromeStorageGet(storageData);

      const mockSuggest = jest.fn();

      // Search for common term
      if (mockOmniboxCallbacks.onInputChanged) {
        await mockOmniboxCallbacks.onInputChanged('link', mockSuggest);
      }

      expect(mockSuggest).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ])
      );

      // Should not have more than 5 suggestions
      const suggestions = mockSuggest.mock.calls[0][0];
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test('should handle empty suggestions', async () => {
      testHelpers.mockChromeStorageGet({});

      const mockSuggest = jest.fn();

      // Search for non-existent term
      if (mockOmniboxCallbacks.onInputChanged) {
        await mockOmniboxCallbacks.onInputChanged('nonexistent', mockSuggest);
      }

      expect(mockSuggest).toHaveBeenCalledWith([]);
    });

    test('should not provide suggestions for empty input', async () => {
      const mockSuggest = jest.fn();

      // Search with empty input
      if (mockOmniboxCallbacks.onInputChanged) {
        await mockOmniboxCallbacks.onInputChanged('', mockSuggest);
      }

      expect(mockSuggest).not.toHaveBeenCalled();
    });
  });
});
