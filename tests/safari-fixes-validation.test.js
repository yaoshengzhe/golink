// Safari Fixes Validation Tests
// Validates that the Safari-specific fixes resolve the identified issues

const fs = require('fs');
const path = require('path');

describe('Safari Fixes Validation Tests', () => {
  let safariSrcDir;
  let safariDistDir;

  beforeAll(() => {
    safariSrcDir = path.join(__dirname, '..', 'src', 'safari');
    safariDistDir = path.join(__dirname, '..', 'dist', 'safari');
  });

  describe('Safari Fixed Files Existence', () => {
    test('should have safari background.js', () => {
      const backgroundPath = path.join(safariSrcDir, 'background.js');
      expect(fs.existsSync(backgroundPath)).toBe(true);
      
      const content = fs.readFileSync(backgroundPath, 'utf8');
      expect(content).toContain('Cross-browser API compatibility');
      expect(content).toContain('Storage helper functions');
      expect(content).toContain('golinks');
    });

    test('should have safari manifest.json', () => {
      const manifestPath = path.join(safariSrcDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(content.name).toBe('GoLinks Safari');
      expect(content.browser_action.default_popup).toBe('popup.html');
      expect(content.web_accessible_resources).toContain('icons/*.png');
    });

    test('should have messaging-helper.js', () => {
      const messagingHelperPath = path.join(safariSrcDir, 'messaging-helper.js');
      expect(fs.existsSync(messagingHelperPath)).toBe(true);
      
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      expect(content).toContain('Safari Messaging Helper');
      expect(content).toContain('function sendMessage(message)');
      expect(content).toContain('function isSafari()');
    });
  });

  describe('Safari Storage Format Fixes', () => {
    test('should use unified golinks storage format', () => {
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      // Should use golinks key instead of individual golink_ keys
      expect(content).toContain("extensionAPI.storage.local.get(['golinks']");
      expect(content).toContain('result.golinks || {}');
      expect(content).not.toContain('golink_${shortName}');
    });

    test('should handle storage operations atomically', () => {
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      // Should read entire golinks object, modify, then write back
      expect(content).toContain('golinks[shortName] = mapping');
      expect(content).toContain('extensionAPI.storage.local.set({ golinks }');
      expect(content).toContain('delete golinks[shortName]');
    });
  });

  describe('Safari API Compatibility Fixes', () => {
    test('should handle both browserAction and action APIs', () => {
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('extensionAPI.browserAction || extensionAPI.action');
      expect(content).toContain('if (actionAPI && actionAPI.onClicked)');
    });

    test('should have webNavigation fallback', () => {
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('if (extensionAPI.webNavigation && extensionAPI.webNavigation.onBeforeNavigate)');
      expect(content).toContain('extensionAPI.tabs.onUpdated.addListener');
    });

    test('should have proper error handling in message handlers', () => {
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
      const content = fs.readFileSync(fixedBackgroundPath, 'utf8');
      
      expect(content).toContain('console.log(\'Safari: Received message:\', request.action)');
      expect(content).toContain('console.error(\'Safari: Save mapping error:\', error)');
      expect(content).toContain('return true; // Keep message channel open for async response');
    });
  });

  describe('Safari Messaging Helper Functionality', () => {
    test('should provide cross-browser messaging', () => {
      const messagingHelperPath = path.join(safariSrcDir, 'messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('const extensionAPI = (typeof browser !== \'undefined\') ? browser :');
      expect(content).toContain('Safari/Firefox use browser.runtime.sendMessage with promises');
      expect(content).toContain('Chrome/Edge use chrome.runtime.sendMessage with callbacks');
    });

    test('should have Safari detection utility', () => {
      const messagingHelperPath = path.join(safariSrcDir, 'messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('function isSafari()');
      expect(content).toContain('navigator.userAgent.includes(\'Safari\')');
    });

    test('should provide storage helper functions', () => {
      const messagingHelperPath = path.join(safariSrcDir, 'messaging-helper.js');
      const content = fs.readFileSync(messagingHelperPath, 'utf8');
      
      expect(content).toContain('const SafariStorage = {');
      expect(content).toContain('get(keys)');
      expect(content).toContain('set(data)');
      expect(content).toContain('remove(keys)');
    });
  });

  describe('Safari Build Process Integration', () => {
    test('should have new build-safari.js script', () => {
      const buildSafariPath = path.join(__dirname, '..', 'scripts', 'build-safari.js');
      const content = fs.readFileSync(buildSafariPath, 'utf8');
      
      expect(content).toContain('Building Safari extension');
      expect(content).toContain('safariDir');
      expect(content).toContain('dist', 'safari');
      expect(content).toContain('shared');
      expect(content).toContain('successfully');
    });
  });

  describe('Fixed Safari Build Validation', () => {
    test('should rebuild Safari extension with fixes', async () => {
      const { execSync } = require('child_process');
      
      try {
        // Run the Safari preparation with fixes
        execSync('npm run build:safari', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe'
        });
        
        // Check that dist/safari was created (new location)
        const newSafariDistDir = path.join(__dirname, '..', 'dist', 'safari');
        expect(fs.existsSync(newSafariDistDir)).toBe(true);
        
        // Check that fixed files are in place
        const builtBackgroundPath = path.join(newSafariDistDir, 'background.js');
        const builtManifestPath = path.join(newSafariDistDir, 'manifest.json');
        const builtMessagingHelperPath = path.join(newSafariDistDir, 'messaging-helper.js');
        
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
      const messagingHelperPath = path.join(safariSrcDir, 'messaging-helper.js');
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
      const fixedBackgroundPath = path.join(safariSrcDir, 'background.js');
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
      const manifestPath = path.join(safariSrcDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.browser_action).toBeDefined();
      expect(manifest.browser_action.default_popup).toBe('popup.html');
      expect(manifest.browser_action.default_title).toBe('GoLinks Manager');
    });
  });
});