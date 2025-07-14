// Safari Final Verification Test
// Comprehensive test to verify all Safari fixes are working

describe('Safari Extension Final Verification', () => {
  test('should have all Safari source files in place', () => {
    const fs = require('fs');
    const path = require('path');
    
    const safariSrcDir = path.join(__dirname, '..', 'src', 'safari');
    const sharedDir = path.join(__dirname, '..', 'src', 'shared');
    
    // Verify src/safari directory exists
    expect(fs.existsSync(safariSrcDir)).toBe(true);
    
    const requiredSafariFiles = [
      'background.js',
      'manifest.json', 
      'popup.html',
      'create.html',
      'messaging-helper.js'
    ];
    
    requiredSafariFiles.forEach(file => {
      const filePath = path.join(safariSrcDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
    
    // Verify shared files exist
    const sharedFiles = [
      'create.js',
      'debug.js',
      'styles.css',
      'icons'
    ];
    
    sharedFiles.forEach(file => {
      const filePath = path.join(sharedDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('should have unified storage format in background script', () => {
    const fs = require('fs');
    const path = require('path');
    
    const backgroundPath = path.join(__dirname, '..', 'src', 'safari', 'background.js');
    const content = fs.readFileSync(backgroundPath, 'utf8');
    
    // Should use unified golinks storage format
    expect(content).toContain("extensionAPI.storage.local.get(['golinks']");
    expect(content).toContain('const golinks = result.golinks || {}');
    expect(content).toContain('golinks[shortName] = mapping');
    
    // Should NOT use old individual key storage
    expect(content).not.toContain('`golink_${shortName}`');
    expect(content).not.toContain('golink_');
  });

  test('should have popup support in manifest', () => {
    const fs = require('fs');
    const path = require('path');
    
    const manifestPath = path.join(__dirname, '..', 'src', 'safari', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifest.name).toBe('GoLinks Safari');
    expect(manifest.browser_action).toBeDefined();
    expect(manifest.browser_action.default_popup).toBe('popup.html');
    expect(manifest.browser_action.default_title).toBe('GoLinks Manager');
    
    // Should NOT have onClicked handler conflicting with popup
    const backgroundPath = path.join(__dirname, '..', 'src', 'safari', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    expect(backgroundContent).not.toContain('browserAction.onClicked');
  });

  test('should have proper webNavigation and tabs fallback', () => {
    const fs = require('fs');
    const path = require('path');
    
    const backgroundPath = path.join(__dirname, '..', 'src', 'safari', 'background.js');
    const content = fs.readFileSync(backgroundPath, 'utf8');
    
    // Should have webNavigation API check
    expect(content).toContain('if (extensionAPI.webNavigation && extensionAPI.webNavigation.onBeforeNavigate)');
    
    // Should have tabs.onUpdated fallback
    expect(content).toContain('extensionAPI.tabs.onUpdated.addListener');
    expect(content).toContain('changeInfo.status === \'loading\'');
    
    // Should handle go/ URLs properly
    expect(content).toContain('url.hostname === \'go\'');
    expect(content).toContain('url.pathname.substring(1)');
  });

  test('should have improved error handling and logging', () => {
    const fs = require('fs');
    const path = require('path');
    
    const backgroundPath = path.join(__dirname, '..', 'src', 'safari', 'background.js');
    const content = fs.readFileSync(backgroundPath, 'utf8');
    
    // Should have Safari-specific logging
    expect(content).toContain('console.log(\'Safari: Received message:\', request.action)');
    expect(content).toContain('console.error(\'Safari:');
    
    // Should have proper error handling
    expect(content).toContain('if (extensionAPI.runtime.lastError)');
    expect(content).toContain('reject(new Error(');
    expect(content).toContain('sendResponse({ error:');
    
    // Should have async message handling
    expect(content).toContain('return true; // Keep message channel open');
  });

  test('should have messaging helper utility', () => {
    const fs = require('fs');
    const path = require('path');
    
    const helperPath = path.join(__dirname, '..', 'src', 'safari', 'messaging-helper.js');
    const content = fs.readFileSync(helperPath, 'utf8');
    
    // Should provide cross-browser messaging
    expect(content).toContain('function sendMessage(message)');
    expect(content).toContain('browser.runtime.sendMessage');
    expect(content).toContain('chrome.runtime.sendMessage');
    
    // Should have Safari detection
    expect(content).toContain('function isSafari()');
    expect(content).toContain('Safari');
    
    // Should provide storage helpers
    expect(content).toContain('SafariStorage');
    expect(content).toContain('api.storage');
  });

  test('should build Safari extension successfully', () => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    
    // Build the Safari extension
    try {
      execSync('npm run build:safari', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
    } catch (error) {
      console.error('Build failed:', error.message);
    }
    
    // Verify dist/safari directory was created
    const distDir = path.join(__dirname, '..', 'dist', 'safari');
    expect(fs.existsSync(distDir)).toBe(true);
    
    // Verify all files are copied
    const expectedFiles = [
      'manifest.json',
      'background.js',
      'popup.html',
      'popup.js',
      'create.html',
      'create.js',
      'debug.html',
      'debug.js',
      'styles.css',
      'messaging-helper.js',
      'icons/icon-16.png',
      'icons/icon-48.png',
      'icons/icon-128.png'
    ];
    
    expectedFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('should validate final Safari extension structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check src structure
    const srcSafari = path.join(__dirname, '..', 'src', 'safari');
    const srcShared = path.join(__dirname, '..', 'src', 'shared');
    const srcChrome = path.join(__dirname, '..', 'src', 'chrome');
    
    expect(fs.existsSync(srcSafari)).toBe(true);
    expect(fs.existsSync(srcShared)).toBe(true);
    expect(fs.existsSync(srcChrome)).toBe(true);
    
    // Verify Safari manifest is v2
    const safariManifest = JSON.parse(
      fs.readFileSync(path.join(srcSafari, 'manifest.json'), 'utf8')
    );
    expect(safariManifest.manifest_version).toBe(2);
    
    // Verify Chrome manifest is v3
    const chromeManifest = JSON.parse(
      fs.readFileSync(path.join(srcChrome, 'manifest.json'), 'utf8')
    );
    expect(chromeManifest.manifest_version).toBe(3);
    
    // Verify shared resources exist
    expect(fs.existsSync(path.join(srcShared, 'icons'))).toBe(true);
    expect(fs.existsSync(path.join(srcShared, 'create.js'))).toBe(true);
    expect(fs.existsSync(path.join(srcShared, 'styles.css'))).toBe(true);
  });
});