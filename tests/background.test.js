const { setupExtensionTest, cleanupExtensionTest } = require('./test-helpers');

describe('Background Script', () => {
  let browser, page;

  beforeAll(async () => {
    ({ browser, page } = await setupExtensionTest());
  });

  afterAll(async () => {
    await cleanupExtensionTest(browser);
  });

  beforeEach(async () => {
    // Clear storage before each test
    await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.clear(() => resolve());
      });
    });
  });

  describe('URL Pattern Detection', () => {
    test('should detect go/xyz pattern', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('http://go/docs');
        return window.testUtils.isGoLink(url);
      });
      expect(result).toBe(true);
    });

    test('should detect https://go/xyz pattern', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('https://go/docs');
        return window.testUtils.isGoLink(url);
      });
      expect(result).toBe(true);
    });

    test('should not detect non-go URLs', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('https://google.com');
        return window.testUtils.isGoLink(url);
      });
      expect(result).toBe(false);
    });
  });

  describe('Short Name Extraction', () => {
    test('should extract short name from go/xyz', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('http://go/docs');
        return window.testUtils.extractShortName(url);
      });
      expect(result).toBe('docs');
    });

    test('should extract short name with query params', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('http://go/docs?test=1');
        return window.testUtils.extractShortName(url);
      });
      expect(result).toBe('docs');
    });

    test('should extract short name with fragments', async () => {
      const result = await page.evaluate(() => {
        const url = new URL('http://go/docs#section');
        return window.testUtils.extractShortName(url);
      });
      expect(result).toBe('docs');
    });
  });

  describe('Storage Operations', () => {
    test('should save and retrieve mapping', async () => {
      const mapping = {
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test mapping',
      };

      await page.evaluate(mapping => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: mapping.shortName,
              url: mapping.url,
              description: mapping.description,
            },
            resolve
          );
        });
      }, mapping);

      const retrieved = await page.evaluate(shortName => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'getMapping',
              shortName: shortName,
            },
            resolve
          );
        });
      }, mapping.shortName);

      expect(retrieved.shortName).toBe(mapping.shortName);
      expect(retrieved.url).toBe(mapping.url);
      expect(retrieved.description).toBe(mapping.description);
    });

    test('should get all mappings', async () => {
      // Create multiple mappings
      const mappings = [
        {
          shortName: 'docs',
          url: 'https://docs.example.com',
          description: 'Documentation',
        },
        {
          shortName: 'jira',
          url: 'https://jira.example.com',
          description: 'Issue tracker',
        },
      ];

      for (const mapping of mappings) {
        await page.evaluate(mapping => {
          return new Promise(resolve => {
            chrome.runtime.sendMessage(
              {
                action: 'saveMapping',
                shortName: mapping.shortName,
                url: mapping.url,
                description: mapping.description,
              },
              resolve
            );
          });
        }, mapping);
      }

      const allMappings = await page.evaluate(() => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'getAllMappings',
            },
            resolve
          );
        });
      });

      expect(Object.keys(allMappings)).toHaveLength(2);
      expect(allMappings.docs).toBeDefined();
      expect(allMappings.jira).toBeDefined();
    });

    test('should delete mapping', async () => {
      const mapping = {
        shortName: 'temp',
        url: 'https://temp.example.com',
        description: 'Temporary mapping',
      };

      // Save mapping
      await page.evaluate(mapping => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: mapping.shortName,
              url: mapping.url,
              description: mapping.description,
            },
            resolve
          );
        });
      }, mapping);

      // Delete mapping
      await page.evaluate(shortName => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'deleteMapping',
              shortName: shortName,
            },
            resolve
          );
        });
      }, mapping.shortName);

      // Verify deletion
      const retrieved = await page.evaluate(shortName => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'getMapping',
              shortName: shortName,
            },
            resolve
          );
        });
      }, mapping.shortName);

      expect(retrieved).toBeNull();
    });
  });

  describe('Navigation Handling', () => {
    test('should redirect to mapped URL when mapping exists', async () => {
      // Save a mapping
      await page.evaluate(() => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: 'redirect-test',
              url: 'https://example.com/redirected',
              description: 'Redirect test',
            },
            resolve
          );
        });
      });

      // Navigate to go/redirect-test
      const newPage = await browser.newPage();
      await newPage.goto('http://go/redirect-test');

      // Wait for redirect
      await newPage.waitForNavigation({ waitUntil: 'networkidle0' });

      // Check if redirected to correct URL
      const currentUrl = newPage.url();
      expect(currentUrl).toBe('https://example.com/redirected');

      await newPage.close();
    });

    test('should redirect to create page when mapping does not exist', async () => {
      const newPage = await browser.newPage();
      await newPage.goto('http://go/nonexistent');

      // Wait for redirect
      await newPage.waitForNavigation({ waitUntil: 'networkidle0' });

      // Check if redirected to create page
      const currentUrl = newPage.url();
      expect(currentUrl).toContain('create.html');
      expect(currentUrl).toContain('shortName=nonexistent');

      await newPage.close();
    });
  });
});
