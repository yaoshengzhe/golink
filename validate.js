#!/usr/bin/env node

// Validation script for GoLinks extension
// Ensures all files are valid and follow best practices

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  success(message) {
    this.log(message, 'success');
  }

  /**
   * Validate manifest.json
   */
  validateManifest() {
    this.log('Validating manifest.json...');
    
    const manifestPath = path.join(__dirname, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      this.error('manifest.json not found');
      return false;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      // Check required fields
      const requiredFields = [
        'manifest_version',
        'name', 
        'version',
        'description',
        'permissions',
        'background'
      ];

      for (const field of requiredFields) {
        if (!manifest[field]) {
          this.error(`Missing required field in manifest: ${field}`);
        }
      }

      // Validate manifest version
      if (manifest.manifest_version !== 3) {
        this.error('Manifest version must be 3 for Chrome extensions');
      }

      // Validate permissions
      if (!Array.isArray(manifest.permissions)) {
        this.error('Permissions must be an array');
      } else {
        const requiredPermissions = ['storage', 'tabs', 'webNavigation'];
        for (const perm of requiredPermissions) {
          if (!manifest.permissions.includes(perm)) {
            this.warning(`Missing recommended permission: ${perm}`);
          }
        }
      }

      // Validate background script
      if (!manifest.background || !manifest.background.service_worker) {
        this.error('Background service worker must be specified');
      }

      // Check for trailing commas by re-parsing
      const jsonLines = manifestContent.split('\n');
      for (let i = 0; i < jsonLines.length; i++) {
        const line = jsonLines[i].trim();
        if (line.endsWith(',}') || line.endsWith(',]')) {
          this.error(`Trailing comma found in manifest.json at line ${i + 1}`);
        }
      }

      this.success('manifest.json validation passed');
      return true;
    } catch (error) {
      this.error(`Invalid JSON in manifest.json: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate JavaScript files
   */
  validateJavaScript() {
    this.log('Validating JavaScript files...');
    
    const jsFiles = [
      'background.js',
      'create.js', 
      'popup.js'
    ];

    let allValid = true;

    for (const file of jsFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        this.error(`JavaScript file not found: ${file}`);
        allValid = false;
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax validation
        this.validateJSSyntax(content, file);
        
        // Check for common issues
        this.checkJSBestPractices(content, file);
        
      } catch (error) {
        this.error(`Error reading ${file}: ${error.message}`);
        allValid = false;
      }
    }

    if (allValid) {
      this.success('JavaScript validation passed');
    }
    
    return allValid;
  }

  /**
   * Basic JavaScript syntax validation
   */
  validateJSSyntax(content, filename) {
    // Check for basic syntax issues
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check for console.log in production (warning only)
      if (line.includes('console.log') && !line.includes('//')) {
        this.warning(`Console.log found in ${filename}:${lineNum} - consider removing for production`);
      }
      
      // Check for eval usage (security risk)
      if (line.includes('eval(')) {
        this.error(`eval() usage found in ${filename}:${lineNum} - security risk`);
      }
      
      // Check for proper chrome API usage
      if (line.includes('chrome.') && !line.includes('chrome.runtime') && 
          !line.includes('chrome.storage') && !line.includes('chrome.tabs') && 
          !line.includes('chrome.webNavigation')) {
        this.warning(`Uncommon chrome API usage in ${filename}:${lineNum}: ${line.trim()}`);
      }
    }
  }

  /**
   * Check JavaScript best practices
   */
  checkJSBestPractices(content, filename) {
    // Check for proper error handling
    if (content.includes('chrome.runtime.sendMessage') && !content.includes('chrome.runtime.lastError')) {
      this.warning(`${filename}: Consider checking chrome.runtime.lastError in message callbacks`);
    }
    
    // Check for storage operations with error handling
    if (content.includes('chrome.storage') && !content.includes('chrome.runtime.lastError')) {
      this.warning(`${filename}: Consider error handling for storage operations`);
    }
    
    // Check for proper async/await or Promise usage
    if (content.includes('chrome.storage.local.get') && !content.includes('Promise') && !content.includes('callback')) {
      this.warning(`${filename}: Storage operations should use proper async patterns`);
    }
  }

  /**
   * Validate HTML files
   */
  validateHTML() {
    this.log('Validating HTML files...');
    
    const htmlFiles = [
      'create.html',
      'popup.html'
    ];

    let allValid = true;

    for (const file of htmlFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        this.error(`HTML file not found: ${file}`);
        allValid = false;
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.validateHTMLContent(content, file);
      } catch (error) {
        this.error(`Error reading ${file}: ${error.message}`);
        allValid = false;
      }
    }

    if (allValid) {
      this.success('HTML validation passed');
    }
    
    return allValid;
  }

  /**
   * Validate HTML content
   */
  validateHTMLContent(content, filename) {
    // Check for required meta tags
    if (!content.includes('<meta charset="UTF-8">')) {
      this.warning(`${filename}: Missing UTF-8 charset declaration`);
    }
    
    if (!content.includes('viewport')) {
      this.warning(`${filename}: Missing viewport meta tag`);
    }
    
    // Check for proper script loading
    if (content.includes('<script') && !content.includes('defer') && !content.includes('async')) {
      this.warning(`${filename}: Consider using defer or async for script loading`);
    }
    
    // Check for inline scripts (CSP violation)
    if (content.includes('<script>') && !content.includes('src=')) {
      this.error(`${filename}: Inline scripts violate Content Security Policy`);
    }
    
    // Check for inline styles (CSP violation)
    if (content.includes('style=')) {
      this.warning(`${filename}: Inline styles may violate Content Security Policy`);
    }
    
    // Check for proper form validation
    if (content.includes('<form') && !content.includes('novalidate')) {
      // This is actually good - HTML5 validation should be enabled
    }
    
    // Check for accessibility
    if (content.includes('<input') && !content.includes('label')) {
      this.warning(`${filename}: Form inputs should have associated labels for accessibility`);
    }
  }

  /**
   * Validate CSS files
   */
  validateCSS() {
    this.log('Validating CSS files...');
    
    const cssPath = path.join(__dirname, 'styles.css');
    
    if (!fs.existsSync(cssPath)) {
      this.error('styles.css not found');
      return false;
    }

    try {
      const content = fs.readFileSync(cssPath, 'utf8');
      
      // Basic CSS validation
      const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
      if (braceCount !== 0) {
        this.error('CSS: Mismatched braces detected');
      }
      
      // Check for vendor prefixes without standard property
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('-webkit-') || line.startsWith('-moz-') || line.startsWith('-ms-')) {
          this.warning(`CSS line ${i + 1}: Vendor prefix found, ensure standard property is also included`);
        }
      }
      
      this.success('CSS validation passed');
      return true;
    } catch (error) {
      this.error(`Error reading styles.css: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate file structure
   */
  validateFileStructure() {
    this.log('Validating file structure...');
    
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'create.html',
      'create.js',
      'popup.html',
      'popup.js',
      'styles.css',
      'README.md'
    ];

    let allPresent = true;

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        this.error(`Required file missing: ${file}`);
        allPresent = false;
      }
    }

    // Check for recommended files
    const recommendedFiles = [
      'package.json',
      '.gitignore'
    ];

    for (const file of recommendedFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        this.warning(`Recommended file missing: ${file}`);
      }
    }

    if (allPresent) {
      this.success('File structure validation passed');
    }
    
    return allPresent;
  }

  /**
   * Validate security practices
   */
  validateSecurity() {
    this.log('Validating security practices...');
    
    const jsFiles = ['background.js', 'create.js', 'popup.js'];
    let secure = true;

    for (const file of jsFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for dangerous functions
      const dangerousFunctions = ['eval', 'innerHTML', 'document.write'];
      for (const func of dangerousFunctions) {
        if (content.includes(func)) {
          this.error(`Security: Potentially dangerous function '${func}' found in ${file}`);
          secure = false;
        }
      }
      
      // Check for hardcoded credentials/secrets
      const sensitivePatterns = [
        /password\s*=\s*['"]/i,
        /api[_-]?key\s*=\s*['"]/i,
        /secret\s*=\s*['"]/i,
        /token\s*=\s*['"]/i
      ];
      
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          this.error(`Security: Potential hardcoded credential found in ${file}`);
          secure = false;
        }
      }
    }

    if (secure) {
      this.success('Security validation passed');
    }
    
    return secure;
  }

  /**
   * Run all validations
   */
  validateAll() {
    this.log('Starting GoLinks extension validation...');
    
    const validations = [
      () => this.validateFileStructure(),
      () => this.validateManifest(),
      () => this.validateJavaScript(),
      () => this.validateHTML(),
      () => this.validateCSS(),
      () => this.validateSecurity()
    ];

    let allPassed = true;
    
    for (const validation of validations) {
      if (!validation()) {
        allPassed = false;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warning(s) found:`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (allPassed && this.errors.length === 0) {
      console.log('✅ All validations passed!');
      process.exit(0);
    } else {
      console.log('❌ Validation failed');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ExtensionValidator();
  validator.validateAll();
}

module.exports = ExtensionValidator;