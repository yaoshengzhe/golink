#!/bin/bash

# Safari Extension Build Script
# Automates the conversion and building process for Safari

set -e

echo "🦎 GoLinks Safari Extension Builder"
echo "=================================="

# Check if xcrun is available
if ! command -v xcrun &> /dev/null; then
    echo "❌ Xcode Command Line Tools not found. Please install with:"
    echo "   xcode-select --install"
    exit 1
fi

# Create build directory
BUILD_DIR="safari-build"
EXTENSION_DIR="$(pwd)"
APP_NAME="GoLinks Safari"

echo "📁 Creating build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "🔧 Converting Chrome extension to Safari..."
SAFARI_SOURCE="$EXTENSION_DIR/safari-dist"

if [ ! -d "$SAFARI_SOURCE" ]; then
    echo "❌ Safari source directory not found: $SAFARI_SOURCE"
    echo "Please run: npm run safari:prepare first"
    exit 1
fi

xcrun safari-web-extension-converter \
    "$SAFARI_SOURCE" \
    --app-name "$APP_NAME" \
    --bundle-identifier "com.golinks.safari.extension" \
    --project-location "$BUILD_DIR" \
    --no-open \
    --no-prompt \
    --force

echo "✅ Safari extension project created successfully!"
echo ""
echo "📁 Project location: $BUILD_DIR/$APP_NAME"
echo ""
echo "🔧 Manual build steps:"
echo "1. Open: $BUILD_DIR/$APP_NAME/$APP_NAME.xcodeproj"
echo "2. In Xcode: Product → Build (⌘B)"
echo "3. In Xcode: Product → Archive (optional, for distribution)"
echo ""
echo "🦎 Safari setup:"
echo "1. Safari → Develop → Allow Unsigned Extensions"
echo "2. Safari → Preferences → Extensions → Enable GoLinks"
echo "3. Test with: go/gmail (no omnibox support in Safari)"
echo ""
echo "💡 The extension will work for direct URLs like go/gmail but not omnibox."