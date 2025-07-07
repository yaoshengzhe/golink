require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

// Fix for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods to avoid spam in tests
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock browser APIs that might be used in tests
global.navigator = {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
};

// Set up default timeouts
jest.setTimeout(10000);

// Mock URL constructor for older Node versions
if (!global.URL) {
  global.URL = require('url').URL;
}

// Mock fetch if needed
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
