const { setupExtensionTest, cleanupExtensionTest } = require('./test-helpers');

describe('Create Page', () => {
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

    // Navigate to create page
    await page.goto(`chrome-extension://${extensionId}/create.html`);
  });

  describe('Form Validation', () => {
    test('should validate short name format', async () => {
      await page.type('#shortName', 'invalid name with spaces');
      await page.type('#url', 'https://example.com');

      const isValid = await page.evaluate(() => {
        const input = document.getElementById('shortName');
        return input.checkValidity();
      });

      expect(isValid).toBe(false);
    });

    test('should accept valid short name', async () => {
      await page.type('#shortName', 'valid-name_123');

      const isValid = await page.evaluate(() => {
        const input = document.getElementById('shortName');
        return input.checkValidity();
      });

      expect(isValid).toBe(true);
    });

    test('should validate URL format', async () => {
      await page.type('#shortName', 'test');
      await page.type('#url', 'not-a-valid-url');

      const isValid = await page.evaluate(() => {
        const input = document.getElementById('url');
        return input.checkValidity();
      });

      expect(isValid).toBe(false);
    });

    test('should accept valid HTTPS URL', async () => {
      await page.type('#url', 'https://example.com');

      const isValid = await page.evaluate(() => {
        const input = document.getElementById('url');
        return input.checkValidity();
      });

      expect(isValid).toBe(true);
    });

    test('should accept valid HTTP URL', async () => {
      await page.type('#url', 'http://localhost:3000');

      const isValid = await page.evaluate(() => {
        const input = document.getElementById('url');
        return input.checkValidity();
      });

      expect(isValid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    test('should create new mapping successfully', async () => {
      await page.type('#shortName', 'test-mapping');
      await page.type('#url', 'https://test.example.com');
      await page.type('#description', 'Test description');

      await page.click('button[type="submit"]');

      // Wait for success message
      await page.waitForSelector('.message.success', { timeout: 5000 });

      const message = await page.$eval(
        '.message.success',
        el => el.textContent
      );
      expect(message).toContain('GoLink created successfully');
    });

    test('should prevent submission with empty required fields', async () => {
      await page.click('button[type="submit"]');

      const shortNameValidity = await page.evaluate(() => {
        return document.getElementById('shortName').checkValidity();
      });

      const urlValidity = await page.evaluate(() => {
        return document.getElementById('url').checkValidity();
      });

      expect(shortNameValidity).toBe(false);
      expect(urlValidity).toBe(false);
    });

    test('should handle duplicate short names', async () => {
      // First, create a mapping
      await page.evaluate(() => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: 'saveMapping',
              shortName: 'duplicate',
              url: 'https://first.example.com',
              description: 'First mapping',
            },
            resolve
          );
        });
      });

      // Navigate to create page with the same short name
      await page.goto(
        `chrome-extension://${extensionId}/create.html?shortName=duplicate`
      );

      // Should show existing mapping section
      await page.waitForSelector('#existingMapping:not(.hidden)', {
        timeout: 2000,
      });

      const existingUrl = await page.$eval(
        '#existingUrl',
        el => el.textContent
      );
      expect(existingUrl).toBe('https://first.example.com');
    });
  });

  describe('Pre-filled Short Name', () => {
    test('should pre-fill short name from URL parameter', async () => {
      await page.goto(
        `chrome-extension://${extensionId}/create.html?shortName=prefilled`
      );

      const shortNameValue = await page.$eval('#shortName', el => el.value);
      expect(shortNameValue).toBe('prefilled');
    });

    test('should focus on URL field when short name is pre-filled', async () => {
      await page.goto(
        `chrome-extension://${extensionId}/create.html?shortName=test`
      );

      // Check if existing mapping section is visible or form is visible
      const formVisible = await page.evaluate(() => {
        const form = document.getElementById('createForm');
        return !form.classList.contains('hidden');
      });

      expect(formVisible).toBe(true);
      const focusedElement = await page.evaluate(
        () => document.activeElement.id
      );
      expect(focusedElement).toBe('url');
    });
  });

  describe('Cancel Functionality', () => {
    test('should handle cancel button click', async () => {
      // Mock window.history.back
      await page.evaluate(() => {
        window.historyBackCalled = false;
        window.history.back = () => {
          window.historyBackCalled = true;
        };
      });

      await page.click('#cancelBtn');

      const backCalled = await page.evaluate(() => window.historyBackCalled);
      expect(backCalled).toBe(true);
    });
  });

  describe('Real-time Validation', () => {
    test('should show validation error for invalid short name in real-time', async () => {
      await page.type('#shortName', 'invalid name');
      await page.click('#url'); // Trigger blur event

      const customValidity = await page.evaluate(() => {
        return document.getElementById('shortName').validationMessage;
      });

      expect(customValidity).toContain(
        'Only letters, numbers, hyphens, and underscores allowed'
      );
    });

    test('should show validation error for invalid URL in real-time', async () => {
      await page.type('#url', 'not-a-url');
      await page.click('#shortName'); // Trigger blur event

      const customValidity = await page.evaluate(() => {
        return document.getElementById('url').validationMessage;
      });

      expect(customValidity).toContain('valid URL');
    });
  });
});
