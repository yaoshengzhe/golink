const { setupExtensionTest, cleanupExtensionTest } = require('./test-helpers');

describe('Popup', () => {
  let browser, page, extensionId;

  beforeAll(async () => {
    ({ browser, page, extensionId } = await setupExtensionTest());
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

    // Navigate to popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
  });

  describe('Initial State', () => {
    test('should show empty state when no mappings exist', async () => {
      await page.waitForSelector('#emptyState:not(.hidden)', { timeout: 2000 });

      const emptyStateVisible = await page.evaluate(() => {
        return !document
          .getElementById('emptyState')
          .classList.contains('hidden');
      });

      expect(emptyStateVisible).toBe(true);

      const linkCount = await page.$eval('#linkCount', el => el.textContent);
      expect(linkCount).toBe('0 links');
    });

    test('should show loading state initially', async () => {
      // Reload page to see loading state
      await page.reload();

      const loadingVisible = await page.evaluate(() => {
        return !document
          .getElementById('loadingSpinner')
          .classList.contains('hidden');
      });

      expect(loadingVisible).toBe(true);
    });
  });

  describe('Mappings Display', () => {
    beforeEach(async () => {
      // Create test mappings
      const testMappings = [
        {
          shortName: 'docs',
          url: 'https://docs.example.com',
          description: 'Documentation',
        },
        {
          shortName: 'jira',
          url: 'https://jira.example.com',
          description: 'Issue Tracker',
        },
        {
          shortName: 'github',
          url: 'https://github.com/company/repo',
          description: '',
        },
      ];

      for (const mapping of testMappings) {
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

      // Reload popup to show mappings
      await page.reload();
      await page.waitForSelector('#linksList:not(.hidden)', { timeout: 3000 });
    });

    test('should display all mappings', async () => {
      const linkItems = await page.$$('.link-item');
      expect(linkItems).toHaveLength(3);

      const linkCount = await page.$eval('#linkCount', el => el.textContent);
      expect(linkCount).toBe('3 links');
    });

    test('should display mapping details correctly', async () => {
      const firstLinkShortName = await page.$eval(
        '.link-item:first-child .link-short-name',
        el => el.textContent
      );
      const firstLinkUrl = await page.$eval(
        '.link-item:first-child .link-url',
        el => el.textContent
      );

      expect(firstLinkShortName).toContain('docs'); // Contains go/ prefix
      expect(firstLinkUrl).toBe('https://docs.example.com');
    });

    test('should show description when available', async () => {
      const descriptions = await page.$$eval('.link-description', elements =>
        elements.map(el => el.textContent)
      );

      expect(descriptions).toContain('Documentation');
      expect(descriptions).toContain('Issue Tracker');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Create test mappings
      const testMappings = [
        {
          shortName: 'docs',
          url: 'https://docs.example.com',
          description: 'Documentation site',
        },
        {
          shortName: 'jira',
          url: 'https://jira.example.com',
          description: 'Issue tracker',
        },
        {
          shortName: 'confluence',
          url: 'https://wiki.example.com',
          description: 'Wiki and docs',
        },
      ];

      for (const mapping of testMappings) {
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

      await page.reload();
      await page.waitForSelector('#linksList:not(.hidden)', { timeout: 3000 });
    });

    test('should filter by short name', async () => {
      await page.type('#searchInput', 'docs');

      // Wait for filtering to complete
      await page.waitForTimeout(500);

      const visibleItems = await page.$$('.link-item');
      expect(visibleItems).toHaveLength(2); // docs and confluence (contains "docs" in description)
    });

    test('should filter by URL', async () => {
      await page.type('#searchInput', 'jira');

      await page.waitForTimeout(500);

      const visibleItems = await page.$$('.link-item');
      expect(visibleItems).toHaveLength(1);

      const shortName = await page.$eval(
        '.link-item .link-short-name',
        el => el.textContent
      );
      expect(shortName).toContain('jira');
    });

    test('should filter by description', async () => {
      await page.type('#searchInput', 'tracker');

      await page.waitForTimeout(500);

      const visibleItems = await page.$$('.link-item');
      expect(visibleItems).toHaveLength(1);

      const shortName = await page.$eval(
        '.link-item .link-short-name',
        el => el.textContent
      );
      expect(shortName).toContain('jira');
    });

    test('should show all items when search is cleared', async () => {
      await page.type('#searchInput', 'docs');
      await page.waitForTimeout(500);

      // Clear search
      await page.evaluate(() => {
        document.getElementById('searchInput').value = '';
        document
          .getElementById('searchInput')
          .dispatchEvent(new Event('input'));
      });

      await page.waitForTimeout(500);

      const visibleItems = await page.$$('.link-item');
      expect(visibleItems).toHaveLength(3);
    });

    test('should update link count during search', async () => {
      await page.type('#searchInput', 'docs');
      await page.waitForTimeout(500);

      const linkCount = await page.$eval('#linkCount', el => el.textContent);
      expect(linkCount).toBe('2 links');
    });
  });

  describe('Link Actions', () => {
    beforeEach(async () => {
      // Create a test mapping
      await page.evaluate(() => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: 'test',
              url: 'https://test.example.com',
              description: 'Test mapping',
            },
            resolve
          );
        });
      });

      await page.reload();
      await page.waitForSelector('#linksList:not(.hidden)', { timeout: 3000 });
    });

    test('should copy go/shortname to clipboard', async () => {
      // Mock clipboard API
      await page.evaluate(() => {
        navigator.clipboard = {
          writeText: jest.fn().mockResolvedValue(),
        };
      });

      await page.click('[data-action="copy"]');

      const clipboardCalled = await page.evaluate(() => {
        return navigator.clipboard.writeText.mock.calls.length > 0;
      });

      expect(clipboardCalled).toBe(true);
    });

    test('should open edit modal', async () => {
      await page.click('[data-action="edit"]');

      await page.waitForSelector('#editModal:not(.hidden)', { timeout: 2000 });

      const modalVisible = await page.evaluate(() => {
        return !document
          .getElementById('editModal')
          .classList.contains('hidden');
      });

      expect(modalVisible).toBe(true);

      // Check pre-filled values
      const shortName = await page.$eval('#editShortName', el => el.value);
      const url = await page.$eval('#editUrl', el => el.value);
      const description = await page.$eval('#editDescription', el => el.value);

      expect(shortName).toBe('test');
      expect(url).toBe('https://test.example.com');
      expect(description).toBe('Test mapping');
    });

    test('should delete mapping with confirmation', async () => {
      // Mock confirm dialog
      await page.evaluate(() => {
        window.confirm = jest.fn().mockReturnValue(true);
      });

      await page.click('[data-action="delete"]');

      // Wait for deletion to complete
      await page.waitForTimeout(1000);

      // Should show empty state
      const emptyStateVisible = await page.evaluate(() => {
        return !document
          .getElementById('emptyState')
          .classList.contains('hidden');
      });

      expect(emptyStateVisible).toBe(true);
    });

    test('should cancel deletion when confirm is false', async () => {
      // Mock confirm dialog to return false
      await page.evaluate(() => {
        window.confirm = jest.fn().mockReturnValue(false);
      });

      await page.click('[data-action="delete"]');

      // Wait a bit
      await page.waitForTimeout(500);

      // Should still show the link
      const linkItems = await page.$$('.link-item');
      expect(linkItems).toHaveLength(1);
    });
  });

  describe('Edit Modal', () => {
    beforeEach(async () => {
      // Create a test mapping
      await page.evaluate(() => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: 'editable',
              url: 'https://original.example.com',
              description: 'Original description',
            },
            resolve
          );
        });
      });

      await page.reload();
      await page.waitForSelector('#linksList:not(.hidden)', { timeout: 3000 });

      // Open edit modal
      await page.click('[data-action="edit"]');
      await page.waitForSelector('#editModal:not(.hidden)', { timeout: 2000 });
    });

    test('should save changes successfully', async () => {
      // Clear and type new values
      await page.evaluate(() => {
        document.getElementById('editUrl').value = '';
        document.getElementById('editDescription').value = '';
      });

      await page.type('#editUrl', 'https://updated.example.com');
      await page.type('#editDescription', 'Updated description');

      await page.click('#editForm button[type="submit"]');

      // Wait for modal to close
      await page.waitForSelector('#editModal.hidden', { timeout: 2000 });

      // Check updated values in list
      const url = await page.$eval('.link-url', el => el.textContent);
      const description = await page.$eval(
        '.link-description',
        el => el.textContent
      );

      expect(url).toBe('https://updated.example.com');
      expect(description).toBe('Updated description');
    });

    test('should close modal on cancel', async () => {
      await page.click('#cancelEdit');

      const modalHidden = await page.evaluate(() => {
        return document
          .getElementById('editModal')
          .classList.contains('hidden');
      });

      expect(modalHidden).toBe(true);
    });

    test('should close modal when clicking outside', async () => {
      await page.click('#editModal'); // Click on modal background

      const modalHidden = await page.evaluate(() => {
        return document
          .getElementById('editModal')
          .classList.contains('hidden');
      });

      expect(modalHidden).toBe(true);
    });
  });

  describe('Navigation', () => {
    test('should open create page when clicking Add New', async () => {
      // Mock chrome.tabs.create
      await page.evaluate(() => {
        chrome.tabs = {
          create: jest.fn(),
        };
        window.close = jest.fn();
      });

      await page.click('#addNewBtn');

      const tabsCreateCalled = await page.evaluate(() => {
        return chrome.tabs.create.mock.calls.length > 0;
      });

      expect(tabsCreateCalled).toBe(true);
    });

    test('should open create page from empty state', async () => {
      // Mock chrome.tabs.create
      await page.evaluate(() => {
        chrome.tabs = {
          create: jest.fn(),
        };
        window.close = jest.fn();
      });

      await page.click('#createFirstBtn');

      const tabsCreateCalled = await page.evaluate(() => {
        return chrome.tabs.create.mock.calls.length > 0;
      });

      expect(tabsCreateCalled).toBe(true);
    });
  });
});
