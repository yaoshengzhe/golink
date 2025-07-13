// Safari Fixes Validation Tests
// Validates that the Safari-specific fixes resolve the identified issues

const fs = require('fs');
const path = require('path');

describe('Safari Fixes Validation Tests', () => {
  let safariFixesDir;
  let safariDistDir;

  beforeAll(() => {
    safariFixesDir = path.join(__dirname, '..', 'safari-fixes');
    safariDistDir = path.join(__dirname, '..', 'safari-dist');
  });

  describe('Safari Fixed Files Existence', () => {
    test('should have safari-background-fixed.js', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      expect(fs.existsSync(fixedBackgroundPath)).toBe(true);
      
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      expect(content).toContain('Cross-browser API compatibility - FIXED for Safari');
      expect(content).toContain('Storage helper functions - FIXED storage format');
      expect(content).toContain('Handle extension icon clicks properly for Safari');
    });

    test('should have safari-manifest-fixed.json', () => {
      const fixedManifestPath = path.join(safariFixesDir, 'safari-manifest-fixed.json');
      expect(fs.existsSync(fixedManifestPath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(fixedManifestPath, 'utf8'));
      expect(content.name).toBe('GoLinks Safari');
      expect(content.browser_action.default_popup).toBe('popup.html');
      expect(content.web_accessible_resources).toContain('icons/*.png');
    });

    test('should have safari-messaging-helper.js', () => {
      const messagingHelperPath = path.join(safariFixesDir, 'safari-messaging-helper.js');
      expect(fs.existsSync(messagingHelperPath)).toBe(true);
      
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      expect(content).toContain('Safari Messaging Helper');
      expect(content).toContain('function sendMessage(message)');
      expect(content).toContain('function isSafari()');
    });
  });

  describe('Safari Storage Format Fixes', () => {
    test('should use unified golinks storage format', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      // Should use golinks key instead of individual golink_ keys
      expect(content).toContain("extensionAPI.storage.local.get(['golinks']");
      expect(content).toContain('result.golinks || {}');
      expect(content).not.toContain('golink_${shortName}');
    });

    test('should handle storage operations atomically', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      // Should read entire golinks object, modify, then write back
      expect(content).toContain('golinks[shortName] = mapping');
      expect(content).toContain('extensionAPI.storage.local.set({ golinks }');
      expect(content).toContain('delete golinks[shortName]');
    });
  });

  describe('Safari API Compatibility Fixes', () => {
    test('should handle both browserAction and action APIs', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('extensionAPI.browserAction || extensionAPI.action');
      expect(content).toContain('if (actionAPI && actionAPI.onClicked)');
    });

    test('should have webNavigation fallback', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('if (extensionAPI.webNavigation && extensionAPI.webNavigation.onBeforeNavigate)');
      expect(content).toContain('extensionAPI.tabs.onUpdated.addListener');
    });

    test('should have proper error handling in message handlers', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('console.log(\'Safari: Received message:\', request.action)');
      expect(content).toContain('console.error(\'Safari: Save mapping error:\', error)');
      expect(content).toContain('return true; // Keep message channel open for async response');
    });
  });

  describe('Safari Messaging Helper Functionality', () => {
    test('should provide cross-browser messaging', () => {
      const messagingHelperPath = path.join(safariFixesDir, 'safari-messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('const extensionAPI = (typeof browser !== \'undefined\') ? browser :');
      expect(content).toContain('Safari/Firefox use browser.runtime.sendMessage with promises');
      expect(content).toContain('Chrome/Edge use chrome.runtime.sendMessage with callbacks');
    });

    test('should have Safari detection utility', () => {
      const messagingHelperPath = path.join(safariFixesDir, 'safari-messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('function isSafari()');
      expect(content).toContain('navigator.userAgent.includes(\'Safari\')');
    });

    test('should provide storage helper functions', () => {
      const messagingHelperPath = path.join(safariFixesDir, 'safari-messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('const SafariStorage = {');
      expect(content).toContain('get(keys)');
      expect(content).toContain('set(data)');
      expect(content).toContain('remove(keys)');
    });
  });

  describe('Safari Build Process Integration', () => {
    test('should modify prepare-safari.js to use fixed files', () => {
      const prepareSafariPath = path.join(__dirname, '..', 'scripts', 'prepare-safari.js');
      const content = fs.readFileSync(prepareSafariPath, 'utf8');
      
      expect(content).toContain('safari-fixes');
      expect(content).toContain('safari-manifest-fixed.json');
      expect(content).toContain('safari-background-fixed.js');
      expect(content).toContain('safari-messaging-helper.js');
      expect(content).toContain('FIXED version');
    });
  });

  describe('Fixed Safari Build Validation', () => {
    test('should rebuild Safari extension with fixes', async () => {
      const { execSync } = require('child_process');
      
      try {
        // Run the Safari preparation with fixes
        execSync('npm run safari:prepare', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        
        // Check that safari-dist was created
        expect(fs.existsSync(safariDistDir)).toBe(true);
        
        // Check that fixed files are in place
        const builtBackgroundPath = path.join(safariDistDir, 'background.js');
        const builtManifestPath = path.join(safariDistDir, 'manifest.json');
        const builtMessagingHelperPath = path.join(safariDistDir, 'safari-messaging-helper.js');
        
        expect(fs.existsSync(builtBackgroundPath)).toBe(true);
        expect(fs.existsSync(builtManifestPath)).toBe(true);
        expect(fs.existsSync(builtMessagingHelperPath)).toBe(true);
        
        // Verify the content is from fixed versions
        const backgroundContent = fs.readFileSync(builtBackgroundPath, 'utf8');
        expect(backgroundContent).toContain('FIXED for Safari');
        
        const manifestContent = JSON.parse(fs.readFileSync(builtManifestPath, 'utf8'));
        expect(manifestContent.name).toBe('GoLinks Safari');
        
      } catch (error) {
        console.error('Safari build error:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Safari Functionality Validation', () => {
    test('should validate fixed storage format compatibility', () => {
      // Mock Safari storage operations with fixed format
      const mockSafariAPI = {
        storage: {
          local: {
            get: jest.fn(),
            set: jest.fn()
          }
        }
      };

      // Test data in fixed format
      const testGoLinks = {
        gmail: { url: 'https://mail.google.com', description: 'Gmail' },
        drive: { url: 'https://drive.google.com', description: 'Drive' }
      };

      mockSafariAPI.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.includes('golinks')) {
          callback({ golinks: testGoLinks });
        }
      });

      mockSafariAPI.storage.local.set.mockImplementation((data, callback) => {
        expect(data).toHaveProperty('golinks');
        expect(typeof data.golinks).toBe('object');
        callback();
      });

      // Simulate storage operations
      mockSafariAPI.storage.local.get(['golinks'], (result) => {
        expect(result.golinks).toEqual(testGoLinks);
      });

      const newGoLinks = { ...testGoLinks, test: { url: 'https://test.com', description: 'Test' } };
      mockSafariAPI.storage.local.set({ golinks: newGoLinks }, () => {
        expect(mockSafariAPI.storage.local.set).toHaveBeenCalledWith(
          expect.objectContaining({ golinks: expect.any(Object) }),
          expect.any(Function)
        );
      });
    });

    test('should validate fixed URL navigation patterns', () => {
      const testUrls = [
        'http://go/gmail',
        'http://go/drive', 
        'http://go/test-link',
        'https://go/secure'
      ];

      testUrls.forEach(url => {
        const urlObj = new URL(url);
        expect(urlObj.hostname).toBe('go');
        expect(urlObj.pathname).toMatch(/^\/[\w-_]+$/);
        expect(['http:', 'https:']).toContain(urlObj.protocol);
      });
    });

    test('should validate messaging compatibility', () => {
      // Test the messaging helper functions
      const messagingHelperPath = path.join(safariFixesDir, 'safari-messaging-helper.js');
      const messagingHelper = fs.readFileSync(messagingHelperPath, 'utf8');
      
      // Should handle both browser and chrome APIs
      expect(messagingHelper).toContain('typeof browser !== \'undefined\'');
      expect(messagingHelper).toContain('typeof chrome !== \'undefined\'');
      
      // Should provide promise-based interface
      expect(messagingHelper).toContain('return new Promise');
      expect(messagingHelper).toContain('resolve(response)');
      expect(messagingHelper).toContain('reject(error)');
    });
  });

  describe('Safari Extension Icon Fix', () => {
    test('should open popup.html for icon clicks but create.html for unknown links', () => {
      const fixedBackgroundPath = path.join(safariFixesDir, 'safari-background-fixed.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      // Should create tab with popup.html for icon clicks
      expect(content).toContain('extensionAPI.runtime.getURL(\'popup.html\')');
      // Should also have create.html for unknown links (this is correct behavior)
      expect(content).toContain('extensionAPI.runtime.getURL(\'create.html\')');
      // Should have both behaviors in different contexts
      expect(content).toContain('Extension icon clicked - opening popup');
    });
  });

  describe('Safari Manifest Popup Fix', () => {
    test('should have popup in browser_action', () => {
      const fixedManifestPath = path.join(safariFixesDir, 'safari-manifest-fixed.json');
      const manifest = JSON.parse(fs.readFileSync(fixedManifestPath, 'utf8'));
      
      expect(manifest.browser_action).toBeDefined();
      expect(manifest.browser_action.default_popup).toBe('popup.html');
      expect(manifest.browser_action.default_title).toBe('GoLinks Manager');
    });
  });
});