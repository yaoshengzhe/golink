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

# Attempt to build the project using xcodebuild
PROJECT_PATH="$BUILD_DIR/$APP_NAME/$APP_NAME.xcodeproj"
if [ -f "$PROJECT_PATH/project.pbxproj" ]; then
    echo "🔨 Building extension with xcodebuild..."
    
    # Change to the project directory
    cd "$BUILD_DIR/$APP_NAME"
    
    # Build the project (use macOS scheme for Safari extension)
    if xcodebuild -project "$APP_NAME.xcodeproj" -scheme "$APP_NAME (macOS)" -configuration Release build; then
        echo "✅ Extension built successfully!"
        echo ""
        echo "📦 Built extension location:"
        BUILT_EXTENSION=$(find . -name "*.appex" -type d | head -1)
        if [ -n "$BUILT_EXTENSION" ]; then
            echo "   $(pwd)/$BUILT_EXTENSION"
        fi
    else
        echo "⚠️  Automated build failed. You can build manually:"
        echo "1. Open: $PROJECT_PATH"
        echo "2. In Xcode: Product → Build (⌘B)"
    fi
    
    # Return to original directory
    cd "$EXTENSION_DIR"
else
    echo "⚠️  Project file not found, skipping automated build"
    echo "Manual build steps:"
    echo "1. Open: $PROJECT_PATH"
    echo "2. In Xcode: Product → Build (⌘B)"
fi

echo ""
echo "🦎 Safari setup:"
echo "1. Safari → Develop → Allow Unsigned Extensions"
echo "2. Safari → Preferences → Extensions → Enable GoLinks"
echo "3. Test with: go/gmail (no omnibox support in Safari)"
echo ""
echo "💡 The extension will work for direct URLs like go/gmail but not omnibox."