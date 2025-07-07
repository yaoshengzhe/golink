# GoLinks Browser Extension

<div align="center">
  <img src="icons/icon-128.png" alt="GoLinks Logo" width="128" height="128">
  <p><em>Simple, beautiful navigation shortcuts</em></p>
</div>

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yaoshengzhe/golink)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://github.com/yaoshengzhe/golink/actions/workflows/ci.yml/badge.svg)](https://github.com/yaoshengzhe/golink/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-79%20passing-success.svg)](tests/)
[![Chrome](https://img.shields.io/badge/chrome-supported-brightgreen.svg)](https://chrome.google.com/webstore)
[![Edge](https://img.shields.io/badge/edge-supported-brightgreen.svg)](https://microsoftedge.microsoft.com/addons)
[![Safari](https://img.shields.io/badge/safari-supported-brightgreen.svg)](https://developer.apple.com/safari/extensions/)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://prettier.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

Transform long URLs into simple shortcuts. Type `go/gmail` instead of `https://mail.google.com/mail/u/0/#inbox`.

## Quick Start

1. **Install**: Load the extension in Chrome (`chrome://extensions/` > "Load unpacked")
2. **Create**: Type `go` + Tab + `mylink` in your address bar
3. **Navigate**: Enter your destination URL and save
4. **Use**: From now on, `go` + Tab + `mylink` takes you there instantly

## Usage Examples

### Omnibox (Recommended)
Type `go` in the address bar, then Tab/Space, then your shortcut:

| Input | Result |
|-------|--------|
| `go` → Tab → `gmail` | Navigate to your Gmail inbox |
| `go` → Tab → `drive` | Open your Google Drive |
| `go` → Tab → `calendar` | Open your calendar |

### Direct URLs
Type directly in the address bar:

| Browser | Input | Result |
|---------|-------|--------|
| **Chrome/Edge** | `go/gmail` | Navigate to your Gmail inbox |
| **Safari** | `http://go/gmail` | Navigate to your Gmail inbox |
| **All** | `http://go/drive` | Open your Google Drive |

### Real-World Examples

Create these shortcuts once, use them forever:

```
go/gmail       → https://mail.google.com/mail/u/0/#inbox
go/drive       → https://drive.google.com/drive/my-drive
go/youtube     → https://youtube.com/feed/subscriptions
go/netflix     → https://netflix.com/browse
go/github      → https://github.com/dashboard
go/linkedin    → https://linkedin.com/feed
go/zoom        → https://zoom.us/j/123456789
go/calendar    → https://calendar.google.com
go/amazon      → https://amazon.com/orders
go/spotify     → https://open.spotify.com/
```

## Browser Compatibility

| Browser | Support | Method | Omnibox | Direct URLs |
|---------|---------|--------|---------|-------------|
| **Chrome** | ✅ Full | Direct install | ✅ `go` + Tab | ✅ `go/link` |
| **Edge** | ✅ Full | Direct install | ✅ `go` + Tab | ✅ `go/link` |
| **Safari** | ✅ Full | Xcode conversion | ❌ No support | ✅ `http://go/link` |
| **Firefox** | ⚠️ Partial | Manual adaptation | ❌ Different API | ✅ `go/link` |

## Installation

### Chrome/Edge
1. Download this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select extension folder
5. Pin the extension to your toolbar

### Safari (Automated)
```bash
npm run safari:full    # Creates Xcode project automatically
```

Then:
1. Open the generated Xcode project: `safari-build/GoLinks Safari/GoLinks Safari.xcodeproj`
2. In Xcode: Product → Build (⌘B)
3. Safari → Develop → Allow Unsigned Extensions
4. Safari → Preferences → Extensions → Enable GoLinks

**✅ Safari Usage:** Type `http://go/linkname` (full URL required, no omnibox support)
**📖 Detailed Guide:** See [SAFARI-GUIDE.md](SAFARI-GUIDE.md) for complete Safari setup

### Safari (Manual)
1. Download this repository
2. Safari → Develop → Web Extensions → Convert Extension
3. Select the extension folder
4. Build in Xcode and install

## Features

| Feature | Description |
|---------|-------------|
| **Instant Navigation** | Type shortcuts instead of full URLs |
| **Omnibox Integration** | Use `go` + Tab for seamless navigation |
| **Autocomplete** | Suggestions as you type |
| **Local Storage** | No servers, all data stays private |
| **Import/Export** | Backup and share your shortcuts |
| **Search** | Find shortcuts quickly |

## Privacy & Security

- **100% Local**: All data stored in your browser only
- **No Tracking**: Zero analytics or external requests  
- **Input Validation**: Prevents malicious redirects
- **Private**: Your shortcuts stay on your device

## URL Patterns

The extension recognizes these input methods:

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `go` + Tab + `shortcut` | `go` → Tab → `gmail` | **Recommended** - fastest |
| `go/shortcut` | `go/gmail` | Direct address bar typing |
| `http://go/shortcut` | `http://go/gmail` | Full URL format |
| `https://go/shortcut` | `https://go/gmail` | Secure URL format |

## Management

Click the extension icon to:

- **View All**: See your complete shortcut list
- **Search**: Filter shortcuts by name or description  
- **Edit**: Update URLs and descriptions
- **Delete**: Remove unused shortcuts
- **Export**: Download as JSON backup
- **Import**: Restore from backup file

## Testing Your Installation

### Quick Test
1. **Open**: [test.html](test.html) in your browser
2. **Follow the setup instructions** on the test page
3. **Try the test links** to verify everything works

### Manual Test
1. **Create a test link**: `test` → `https://google.com`
2. **Try navigation**:
   - **Chrome/Edge**: Type `go/test` 
   - **Safari**: Type `http://go/test`
3. **Should redirect** to Google

## Development

### Local Testing
```bash
npm install          # Install dependencies
npm run build        # Validate and test
npm run format       # Format code
npm run lint         # Check for issues
```

### Project Structure
```
golink/
├── manifest.json    # Extension configuration
├── background.js    # URL interception logic
├── create.html      # Shortcut creation page
├── popup.html       # Management interface
├── styles.css       # UI styling
└── tests/           # Unit and integration tests
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not working | Check enabled in `chrome://extensions/` |
| Shortcuts not redirecting | Verify exact pattern: `go/shortcut` |
| Can't create shortcuts | Ensure storage permissions granted |
| Invalid shortcut names | Use only letters, numbers, hyphens, underscores |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test: `npm run build`
4. Submit a pull request

## Changelog

### v1.0.0
- ✅ Omnibox integration with autocomplete
- ✅ Local storage with import/export  
- ✅ Chrome, Edge, and Safari compatibility
- ✅ Real-time validation and search
- ✅ Cross-browser API compatibility layer
- ✅ Comprehensive test suite (79 tests)
- ✅ Safari Web Extensions support