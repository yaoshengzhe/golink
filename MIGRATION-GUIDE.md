# Repository Structure Migration Guide

The GoLinks extension repository has been reorganized for better maintainability and clearer separation between Chrome and Safari implementations.

## New Structure

```
golink/
├── src/                 # Source code
│   ├── shared/         # Shared code between platforms
│   ├── chrome/         # Chrome-specific files
│   └── safari/         # Safari-specific files
├── dist/               # Built extensions
│   ├── chrome/         # Chrome extension ready to load
│   └── safari/         # Safari extension ready to convert
├── scripts/            # Build and utility scripts
├── tests/              # Test files
└── docs/               # Documentation
```

## What Changed

### Old Structure → New Structure

- **Root level files** → `src/chrome/` (Chrome is default)
- **safari-fixes/** → `src/safari/` (consolidated Safari files)
- **scripts/safari-*.html** → `src/safari/` (Safari HTML files)
- **safari-dist/** → `dist/safari/` (build output)
- **Build outputs** → `dist/chrome/` and `dist/safari/`

### Build Commands

**Old:**
- Chrome: Files were in root, no specific build
- Safari: `npm run safari:prepare` → `npm run safari:build`

**New:**
- Chrome: `npm run build:chrome`
- Safari: `npm run build:safari` → `npm run safari:convert`

### Key Improvements

1. **Clear Separation**: Chrome and Safari files are now clearly separated
2. **Shared Code**: Common code is in `src/shared/` to avoid duplication
3. **Consistent Naming**: No more "-fixed" suffixes or multiple versions
4. **Cleaner Root**: Root directory only contains config and docs
5. **Better Build Process**: Explicit build commands for each platform

## Files to Remove (Old Structure)

After verifying the new structure works, you can remove:

```bash
# Old Safari files
rm -rf safari-fixes/
rm -rf safari-dist/
rm -rf safari-build/
rm scripts/safari-*.html
rm scripts/prepare-safari.js
rm safari-test-verification.html
rm test-safari-extension.html
rm verify-safari-build.js

# Old root level extension files (now in src/chrome/)
rm background.js
rm popup.js
rm popup.html
rm create.js
rm create.html
rm debug.js
rm debug.html
rm styles.css
rm manifest.json

# Note: Keep icons/ in root until you update icon generation scripts
```

## Testing

1. **Test Chrome Extension:**
   ```bash
   npm run build:chrome
   # Load dist/chrome/ in Chrome
   ```

2. **Test Safari Extension:**
   ```bash
   npm run safari:full
   # Build in Xcode and test
   ```

## For Developers

- Chrome development: Work in `src/chrome/` and `src/shared/`
- Safari development: Work in `src/safari/` and `src/shared/`
- Shared functionality: Put in `src/shared/`
- Platform-specific code: Keep in respective directories

This new structure makes it easier to:
- Maintain platform-specific code
- Share common functionality
- Understand which files belong to which platform
- Build and test each platform independently