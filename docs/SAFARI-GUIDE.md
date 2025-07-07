# GoLinks Safari Setup & Usage Guide

## 🦎 Safari Installation

### Step 1: Build the Extension
```bash
npm run safari:full
```

### Step 2: Open Xcode Project
```bash
open "safari-build/GoLinks Safari/GoLinks Safari.xcodeproj"
```

### Step 3: Build in Xcode
1. Select the scheme "GoLinks Safari (macOS)"
2. Press `⌘B` (Product → Build)
3. Wait for successful build

### Step 4: Enable in Safari
1. **Safari → Develop → Allow Unsigned Extensions**
2. **Safari → Preferences → Extensions**
3. **Enable "GoLinks Safari"**

## 🔗 How to Use GoLinks in Safari

### Important: Safari Limitations
- ❌ **No omnibox support** (`go` + Tab doesn't work)
- ✅ **Direct URLs work**: Type full URLs in address bar
- ✅ **Extension popup works**: Click icon to manage links

### Method 1: Direct URL Navigation
Type these **exact formats** in Safari's address bar:

```
http://go/gmail     ← Type this exactly
http://go/drive     ← Must include http://
http://go/calendar  ← Safari needs the protocol
```

### Method 2: Using the Extension Popup
1. **Click the GoLinks icon** in Safari toolbar
2. **Click "Create your first link"** 
3. **Add shortcuts**:
   - Short name: `gmail`
   - URL: `https://mail.google.com`
4. **Test by typing**: `http://go/gmail`

### Method 3: Safari Bookmarks (Recommended Alternative)
Since omnibox doesn't work in Safari, create bookmarks instead:

1. **Create bookmark**: Name it `go gmail`
2. **Set URL**: `http://go/gmail`
3. **Type in address bar**: `go gmail` → Safari will suggest the bookmark

## 🧪 Testing Your Setup

### Test 1: Create a Link
1. Click GoLinks extension icon
2. Create: `test` → `https://google.com`
3. Type in address bar: `http://go/test`
4. Should redirect to Google

### Test 2: No Link Found
1. Type in address bar: `http://go/nonexistent`
2. Should open the create page for "nonexistent"

### Test 3: Extension Popup
1. Click GoLinks icon
2. Should see your created links
3. Can edit, delete, or create new ones

## 🔧 Troubleshooting

### "Extension not working"
- ✅ Check Safari → Preferences → Extensions → GoLinks is enabled
- ✅ Verify you typed `http://go/linkname` (not just `go/linkname`)
- ✅ Try refreshing Safari after enabling extension
- ✅ Rebuild extension in Xcode if you made changes

### "Can't type go links"
- ❌ Don't type: `go/gmail` 
- ✅ Type instead: `http://go/gmail`
- ℹ️ Safari requires the full protocol

### "No redirect happening"
1. **Check Extension Console**:
   - Safari → Develop → Web Extension Background Pages → GoLinks Safari
   - Look for console messages starting with "Safari:"
   - Should see: "Safari: Detected go link: gmail"

2. **Verify Extension Permissions**:
   - Safari → Preferences → Extensions → GoLinks Safari
   - Click "Details" and ensure permissions are granted

3. **Test Extension Popup**:
   - Click GoLinks icon → should show popup
   - Create a test link: `test` → `https://google.com`
   - Try: `http://go/test`

4. **Debug Steps**:
   - Disable/re-enable the extension
   - Restart Safari completely
   - Check if you have any content blockers that might interfere

## 💡 Safari vs Chrome Differences

| Feature | Chrome | Safari |
|---------|---------|---------|
| **Omnibox** | ✅ `go` + Tab + `gmail` | ❌ Not supported |
| **Direct URLs** | ✅ `go/gmail` | ✅ `http://go/gmail` |
| **Extension Popup** | ✅ Full featured | ✅ Full featured |
| **Auto-redirect** | ✅ Instant | ✅ Works but needs full URL |

## 🎯 Best Safari Workflow

1. **Use the extension popup** to manage your links
2. **Type full URLs**: `http://go/linkname`
3. **Consider Safari bookmarks** as backup for frequently used links
4. **Bookmark the pattern**: Create a bookmark for `http://go/` to quickly start typing

This way you get the full GoLinks experience in Safari! 🚀