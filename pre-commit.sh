#!/bin/bash

# Pre-commit hook for GoLinks extension
# Ensures code quality before commits

set -e

echo "🔍 Running pre-commit checks..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "📝 Formatting code..."
npm run format

echo "🧹 Running linter..."
npm run lint:fix

echo "✅ Validating extension..."
npm run validate

echo "🧪 Running tests..."
npm run test

echo "📋 Checking manifest.json..."
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log('✅ Manifest version:', manifest.version);
console.log('✅ Extension name:', manifest.name);
"

echo "🔒 Checking for sensitive data..."
if grep -r "password\|api[_-]*key\|secret\|token" --include="*.js" --include="*.json" --exclude="package*.json" .; then
    echo "❌ Potential sensitive data found in files!"
    echo "Please remove any hardcoded credentials before committing."
    exit 1
else
    echo "✅ No sensitive data detected."
fi

echo "📊 Generating file stats..."
echo "- JavaScript files: $(find . -name '*.js' -not -path './node_modules/*' | wc -l)"
echo "- HTML files: $(find . -name '*.html' -not -path './node_modules/*' | wc -l)"
echo "- CSS files: $(find . -name '*.css' -not -path './node_modules/*' | wc -l)"
echo "- Total lines of code: $(find . -name '*.js' -o -name '*.html' -o -name '*.css' -not -path './node_modules/*' | xargs wc -l | tail -1)"

echo ""
echo "🎉 All pre-commit checks passed!"
echo "Ready to commit your changes."

exit 0