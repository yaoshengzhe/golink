# GoLinks Extension Source Structure

This directory contains the source code for the GoLinks extension, organized by platform.

## Directory Structure

```
src/
├── shared/          # Code shared between all platforms
│   ├── create.js    # Create page functionality
│   ├── debug.js     # Debug page functionality
│   ├── styles.css   # Common styles
│   └── icons/       # Extension icons
├── chrome/          # Chrome-specific implementation
│   ├── manifest.json # Chrome manifest v3
│   ├── background.js # Chrome background script
│   ├── popup.html   # Chrome popup
│   ├── popup.js     # Chrome popup functionality
│   ├── create.html  # Chrome create page
│   └── debug.html   # Chrome debug page
└── safari/          # Safari-specific implementation
    ├── manifest.json     # Safari manifest v2
    ├── background.js     # Safari background script
    ├── popup.html       # Safari popup
    ├── create.html      # Safari create page
    └── messaging-helper.js # Safari messaging compatibility
```

## Key Differences

### Chrome Extension
- Uses Manifest V3
- Uses `chrome` API
- Supports omnibox functionality
- Uses service workers for background script

### Safari Extension
- Uses Manifest V2
- Uses `browser` API
- No omnibox support (must type full URL)
- Uses persistent background script
- Requires special messaging handling

## Building

- **Chrome**: `npm run build:chrome`
- **Safari**: `npm run build:safari`

Built extensions are placed in `dist/chrome` and `dist/safari` respectively.