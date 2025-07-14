# Safari Extension Diagnostic Guide

## Common Issues and Solutions

### 1. Extension Not Working in Safari

**Symptoms:**
- Create GoLink button doesn't work
- Manage Links button doesn't work
- No API access in popup

**Solutions:**

1. **Check Extension is Enabled:**
   - Open Safari → Preferences → Extensions
   - Ensure "GoLinks Safari" is checked/enabled
   - Make sure it has permissions for "All websites"

2. **Build and Install Extension Properly:**
   ```bash
   # Step 1: Prepare Safari extension files
   npm run safari:prepare
   
   # Step 2: Convert to Safari extension
   ./scripts/safari-build.sh
   
   # Step 3: Open in Xcode
   # The script will automatically open Xcode
   
   # Step 4: In Xcode
   # - Select your development team
   # - Build the project (Cmd+B)
   # - Run the extension (Cmd+R)
   ```

3. **Enable Developer Mode:**
   - Safari → Preferences → Advanced
   - Check "Show Develop menu in menu bar"
   - Develop → Allow Unsigned Extensions (may need to do this each Safari restart)

### 2. Debugging Steps

1. **Check Web Inspector Console:**
   - Right-click on extension icon → Inspect Element
   - Look for console errors
   - Check if browser/chrome API is available

2. **Test in Safari Technology Preview:**
   - Download Safari Technology Preview
   - It has better extension debugging support

3. **Check Background Script:**
   - Develop → Web Extension Background Pages → GoLinks Safari
   - Look for any errors in console

### 3. Known Safari Limitations

1. **Popup Behavior:**
   - Safari may not properly support popup.html in some versions
   - The extension uses inline forms as fallback

2. **API Access:**
   - Safari uses `browser` API, not `chrome`
   - Some APIs may behave differently

3. **URL Requirements:**
   - Must type full URL: `http://go/link` (not just `go/link`)
   - Safari doesn't support omnibox API like Chrome

### 4. Testing the Extension

1. **Manual Test:**
   - Click extension icon
   - Try creating a link (e.g., "test" → "https://example.com")
   - Open new tab and type: `http://go/test`
   - Should redirect to https://example.com

2. **Use Test Page:**
   - Open `test-safari-extension.html` in Safari
   - This will test API availability and messaging

### 5. If Nothing Works

1. **Clean Build:**
   ```bash
   rm -rf safari-dist safari-build
   npm run safari:full
   ```

2. **Check Safari Version:**
   - Requires Safari 14 or later
   - Best tested on Safari 15+

3. **File Bug Report:**
   - Check Safari console for errors
   - Include Safari version
   - Include macOS version