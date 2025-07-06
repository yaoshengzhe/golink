// Test helpers for browser extension testing

const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Set up browser extension for testing
 */
async function setupExtensionTest() {
  const extensionPath = path.resolve(__dirname, '..');

  const browser = await puppeteer.launch({
    headless: false, // Extensions require non-headless mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
  });

  const page = await browser.newPage();

  // Get extension ID
  await page.goto('chrome://extensions/');
  await page.waitForSelector('extensions-manager', { timeout: 5000 });

  const extensionId = await page.evaluate(() => {
    const manager = document.querySelector('extensions-manager');
    const extensionElements =
      manager.shadowRoot.querySelectorAll('extensions-item');

    for (const element of extensionElements) {
      const name = element.shadowRoot.querySelector('#name').textContent;
      if (name.includes('GoLinks')) {
        return element.id;
      }
    }
    return null;
  });

  if (!extensionId) {
    throw new Error('Extension not found. Make sure it loaded correctly.');
  }

  // Set up test utilities in background script
  await page.goto(`chrome-extension://${extensionId}/background.js`);
  await page.evaluate(() => {
    // Expose internal functions for testing
    window.testUtils = {
      isGoLink: url => {
        return (
          url.hostname === 'go' ||
          url.href.startsWith('go/') ||
          url.href.match(/^https?:\/\/go\//)
        );
      },
      extractShortName: url => {
        let shortName = '';

        if (url.hostname === 'go') {
          shortName = url.pathname.substring(1);
        } else if (url.href.startsWith('go/')) {
          shortName = url.href.substring(3);
        } else if (url.href.match(/^https?:\/\/go\//)) {
          const match = url.href.match(/^https?:\/\/go\/(.+)/);
          if (match) {
            shortName = match[1];
          }
        }

        if (shortName.includes('?')) {
          shortName = shortName.split('?')[0];
        }
        if (shortName.includes('#')) {
          shortName = shortName.split('#')[0];
        }

        return shortName;
      },
    };
  });

  return { browser, page, extensionId };
}

/**
 * Clean up browser instance
 */
async function cleanupExtensionTest(browser) {
  if (browser) {
    await browser.close();
  }
}

/**
 * Wait for extension to be ready
 */
async function waitForExtension(page, extensionId, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.waitForSelector('body', { timeout: 1000 });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  throw new Error('Extension did not become ready within timeout');
}

/**
 * Create test mappings for consistent testing
 */
async function createTestMappings(page) {
  const testMappings = [
    {
      shortName: 'docs',
      url: 'https://docs.example.com',
      description: 'Documentation site',
    },
    {
      shortName: 'jira',
      url: 'https://jira.example.com',
      description: 'Issue tracking system',
    },
    {
      shortName: 'github',
      url: 'https://github.com/company/repo',
      description: 'Source code repository',
    },
    {
      shortName: 'confluence',
      url: 'https://wiki.example.com',
      description: 'Wiki and documentation',
    },
    {
      shortName: 'dashboard',
      url: 'https://dashboard.example.com',
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

  return testMappings;
}

/**
 * Clear all storage for clean test state
 */
async function clearStorage(page) {
  await page.evaluate(() => {
    return new Promise(resolve => {
      chrome.storage.local.clear(() => resolve());
    });
  });
}

/**
 * Mock Chrome APIs for testing
 */
async function mockChromeAPIs(page) {
  await page.evaluate(() => {
    // Mock clipboard API
    if (!navigator.clipboard) {
      navigator.clipboard = {
        writeText: jest.fn().mockResolvedValue(),
        readText: jest.fn().mockResolvedValue(''),
      };
    }

    // Mock chrome.tabs API
    if (!chrome.tabs) {
      chrome.tabs = {
        create: jest.fn(),
        update: jest.fn(),
        query: jest.fn(),
      };
    }

    // Mock window methods
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();
    window.close = jest.fn();

    // Mock history API
    window.history.back = jest.fn();
    window.history.forward = jest.fn();
  });
}

/**
 * Wait for element and click it
 */
async function waitAndClick(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

/**
 * Type text with proper clearing
 */
async function clearAndType(page, selector, text) {
  await page.evaluate(selector => {
    document.querySelector(selector).value = '';
  }, selector);
  await page.type(selector, text);
}

/**
 * Get extension manifest for version checking
 */
async function getExtensionManifest(_extensionId) {
  const fs = require('fs');
  const manifestPath = path.resolve(__dirname, '..', 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest;
  }

  throw new Error('Manifest file not found');
}

/**
 * Validate manifest.json structure
 */
function validateManifest(manifest) {
  const requiredFields = [
    'manifest_version',
    'name',
    'version',
    'description',
    'permissions',
    'background',
  ];

  const errors = [];

  for (const field of requiredFields) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (manifest.manifest_version !== 3) {
    errors.push('Manifest version must be 3');
  }

  if (!Array.isArray(manifest.permissions)) {
    errors.push('Permissions must be an array');
  }

  if (!manifest.background || !manifest.background.service_worker) {
    errors.push('Background service worker must be specified');
  }

  return errors;
}

module.exports = {
  setupExtensionTest,
  cleanupExtensionTest,
  waitForExtension,
  createTestMappings,
  clearStorage,
  mockChromeAPIs,
  waitAndClick,
  clearAndType,
  getExtensionManifest,
  validateManifest,
};
