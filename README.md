# GoLinks Browser Extension

A browser extension that creates a personal go-links system for quick navigation to your favorite URLs. Type `go/xyz` in your address bar and redirect to any URL you've saved.

## Features

- **Quick Navigation**: Type `go/xyz` to instantly navigate to saved URLs
- **Local Storage**: All mappings stored locally using browser storage (no backend required)
- **Easy Management**: Create, edit, and delete mappings through a user-friendly interface
- **Search**: Quickly find your saved links
- **Export/Import**: Backup and restore your mappings
- **Cross-Browser**: Compatible with Chrome and Safari (via Safari Web Extensions)

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The GoLinks extension should now appear in your extensions list

### Safari

1. Download or clone this repository
2. Open Safari and go to Safari > Preferences > Advanced
3. Check "Show Develop menu in menu bar"
4. Go to Develop > Web Extensions > Convert to Safari Web Extension
5. Select the extension directory and follow the conversion process
6. Build and run the generated Xcode project

## Usage

### Creating Your First GoLink

**Method 1: Omnibox (Recommended)**
1. Type `go` in your address bar, then press Tab or Space
2. Type your short name (e.g., `docs`)
3. Press Enter to navigate or create the mapping
4. If no mapping exists, you'll be redirected to the create page
5. Enter the full URL (e.g., `https://company.internal.docs.com`)
6. Add an optional description and click "Create GoLink"

**Method 2: Traditional URL**
1. Type `go/docs` (or any short name) in your address bar
2. Since no mapping exists, you'll be redirected to the create page
3. Enter the full URL and description
4. Click "Create GoLink"

### Managing GoLinks

Click the GoLinks extension icon in your browser toolbar to:

- **View all mappings**: See all your saved go-links
- **Search**: Find specific mappings quickly
- **Edit**: Modify existing URLs or descriptions
- **Delete**: Remove mappings you no longer need
- **Export**: Download your mappings as a JSON file
- **Import**: Restore mappings from a backup file

### Supported URL Patterns

The extension recognizes these patterns:
- **Omnibox**: Type `go` + Tab/Space + `xyz` (recommended)
- `go/xyz`
- `http://go/xyz`
- `https://go/xyz`

## Examples

**Omnibox Usage:**
```
go → docs → https://company.docs.com
go → jira → https://company.atlassian.net
go → gmail → https://mail.google.com
```

**Traditional URL Usage:**
```
go/docs → https://company.docs.com
go/jira → https://company.atlassian.net
go/gmail → https://mail.google.com
```

## File Structure

```
golink/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Background script for URL interception
├── create.html           # Create/edit mapping page
├── create.js             # Create page functionality
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # All styling
└── README.md            # This file
```

## Technical Details

### Storage

- Uses `chrome.storage.local` for persistent storage
- Each mapping stored with key format: `golink_{shortName}`
- Includes metadata: creation date, last updated, description

### Permissions

- `storage`: For saving and retrieving mappings
- `tabs`: For creating new tabs and navigation
- `webNavigation`: For intercepting go/ URL patterns
- `host_permissions`: For `http://go/*` and `https://go/*`

### Security

- Input validation and sanitization
- URL validation to prevent malicious redirects
- No external network requests required
- All data stored locally

## Development

### Local Development

1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test the functionality

### Adding Features

The extension is designed to be extensible:

- Add new URL patterns in `background.js`
- Extend the popup interface in `popup.html/js`
- Add new storage options or sync functionality
- Implement additional export formats

## Troubleshooting

### Extension Not Working

1. Check that the extension is enabled in `chrome://extensions/`
2. Verify permissions are granted
3. Check the browser console for errors

### GoLinks Not Redirecting

1. Ensure you're typing the exact pattern: `go/xyz`
2. Check if the mapping exists in the popup
3. Verify the target URL is valid and accessible

### Can't Create Mappings

1. Check that storage permissions are granted
2. Ensure the short name contains only letters, numbers, hyphens, and underscores
3. Verify the target URL starts with `http://` or `https://`

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- No tracking or analytics
- Mappings are private to your browser profile

## Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Safari**: Supported via Safari Web Extensions
- **Firefox**: Should work with minimal modifications (Manifest V2/V3)
- **Edge**: Compatible with Chrome extension format

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Changelog

### v1.0.0
- Initial release
- Basic go-link functionality
- Create, edit, delete mappings
- Search and management interface
- Export/import functionality
- Chrome and Safari compatibility