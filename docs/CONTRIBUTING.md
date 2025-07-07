# Contributing to GoLinks

## Quick Start

1. Fork → Clone → `npm install` → `npm run build`
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Make changes → Test in Chrome (`chrome://extensions/`)
4. Submit PR

## Development Commands

```bash
npm install          # Setup
npm run build        # Validate + lint + test
npm run format       # Auto-format code
npm run test:unit    # Run tests
```

## Code Standards

- **Format**: Prettier (auto), 2 spaces, semicolons, single quotes
- **Commits**: `type(scope): description` (e.g., `feat(omnibox): add autocomplete`)
- **Branches**: `feature/name`, `fix/description`, `docs/topic`

## Testing

- **Unit tests**: `npm run test:unit`
- **All tests**: `npm run test:all`
- **Test files**: `tests/*.test.js`
- **Coverage**: Aim for >80% on new code

## Contribution Types

### Bug Reports
Include: browser/version, steps to reproduce, expected behavior, console errors

### Feature Requests  
Include: use case, proposed solution, implementation details

### Code Changes
- **Small**: Typos, docs, small fixes
- **Medium**: Features, performance, refactoring (open issue first)
- **Large**: Architecture changes (discuss first)

## Pull Request Process

### Before Submitting
1. `git pull origin main` → `npm run build` → Test in browser
2. Add tests for new features
3. Update docs if needed

### PR Checklist
- [ ] Tests pass and added for new features
- [ ] Extension loads and works correctly  
- [ ] Code follows style guidelines
- [ ] Documentation updated

## Project Structure

```
golink/
├── manifest.json         # Extension manifest
├── background.js         # Service worker script  
├── create.html/js        # Link creation page
├── popup.html/js         # Extension popup
├── styles.css           # Shared styling
└── tests/               # Test files
```

## Security

- **Vulnerabilities**: Email (don't open public issues)
- **Code**: Validate inputs, sanitize data, avoid `eval()`

## Resources

- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)

## Questions?

Open an issue with `question` label or check existing discussions.