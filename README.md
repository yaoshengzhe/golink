# GoLinks Browser Extension

Transform long URLs into simple shortcuts. Type `go/jira` instead of `https://company.atlassian.net/browse/PROJECT-123`.

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
| `go` → Tab → `docs` | Navigate to your docs site |
| `go` → Tab → `jira` | Jump to your Jira board |
| `go` → Tab → `calendar` | Open your calendar |

### Traditional URLs
Type directly in the address bar:

| Input | Result |
|-------|--------|
| `go/docs` | Navigate to your docs site |
| `go/jira` | Jump to your Jira board |
| `go/calendar` | Open your calendar |

### Real-World Examples

Create these shortcuts once, use them forever:

```
go/standup     → https://zoom.us/j/123456789
go/deploy      → https://jenkins.company.com/job/deploy
go/metrics     → https://grafana.company.com/dashboard
go/expenses    → https://expense.company.com/reports
go/payroll     → https://hr.company.com/payroll
```

## Browser Compatibility

| Browser | Support | Method | Notes |
|---------|---------|--------|-------|
| **Chrome** | ✅ Full | Direct install | Manifest V3, all features |
| **Edge** | ✅ Full | Direct install | Chrome Web Store compatible |
| **Safari** | ⚠️ Partial | Web Extension conversion | Requires Xcode conversion |
| **Firefox** | ⚠️ Partial | Manual adaptation | Needs Manifest V2/V3 tweaks |

## Installation

### Chrome/Edge
1. Download this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select extension folder
5. Pin the extension to your toolbar

### Safari
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
| `go` + Tab + `shortcut` | `go` → Tab → `docs` | **Recommended** - fastest |
| `go/shortcut` | `go/docs` | Direct address bar typing |
| `http://go/shortcut` | `http://go/docs` | Full URL format |
| `https://go/shortcut` | `https://go/docs` | Secure URL format |

## Management

Click the extension icon to:

- **View All**: See your complete shortcut list
- **Search**: Filter shortcuts by name or description  
- **Edit**: Update URLs and descriptions
- **Delete**: Remove unused shortcuts
- **Export**: Download as JSON backup
- **Import**: Restore from backup file

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
- Omnibox integration with autocomplete
- Local storage with import/export
- Chrome and Safari compatibility
- Real-time validation and search