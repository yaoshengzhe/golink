// Jest setup file for GoLinks extension tests

// Mock Chrome APIs globally
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    getURL: jest.fn(path => `chrome-extension://test-id/${path}`),
    lastError: null
  },
  tabs: {
    create: jest.fn(),
    update: jest.fn(),
    query: jest.fn()
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: jest.fn()
    }
  },
  action: {
    setPopup: jest.fn(),
    setTitle: jest.fn()
  }
};

// Mock browser APIs for cross-browser compatibility
global.browser = global.chrome;

// Mock DOM APIs
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Mock fetch API
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue('')
  }
});

// Mock window methods
Object.assign(window, {
  close: jest.fn(),
  confirm: jest.fn().mockReturnValue(true),
  alert: jest.fn(),
  history: {
    back: jest.fn(),
    forward: jest.fn(),
    length: 1
  }
});

// Setup fake timers for consistent testing
jest.useFakeTimers();

// Custom matchers
expect.extend({
  toBeValidUrl(received) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false
      };
    }
  },
  
  toBeValidShortName(received) {
    const isValid = /^[a-zA-Z0-9-_]+$/.test(received);
    return {
      message: () => isValid 
        ? `expected ${received} not to be a valid short name`
        : `expected ${received} to be a valid short name (letters, numbers, hyphens, underscores only)`,
      pass: isValid
    };
  }
});

// Console override for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Cleanup function
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Reset Chrome API mocks
  chrome.storage.local.get.mockClear();
  chrome.storage.local.set.mockClear();
  chrome.storage.local.remove.mockClear();
  chrome.storage.local.clear.mockClear();
  chrome.runtime.sendMessage.mockClear();
  chrome.tabs.create.mockClear();
  chrome.tabs.update.mockClear();
  chrome.runtime.lastError = null;
});

// Helper functions for tests
global.testHelpers = {
  createMockMapping: (shortName = 'test', url = 'https://example.com', description = 'Test mapping') => ({
    shortName,
    url,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }),
  
  mockChromeStorageGet: (data) => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (typeof keys === 'function') {
        callback = keys;
        keys = null;
      }
      
      if (keys === null) {
        callback(data);
      } else if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          if (data[key] !== undefined) {
            result[key] = data[key];
          }
        });
        callback(result);
      } else if (typeof keys === 'object') {
        const result = {};
        Object.keys(keys).forEach(key => {
          result[key] = data[key] !== undefined ? data[key] : keys[key];
        });
        callback(result);
      } else {
        const result = {};
        if (data[keys] !== undefined) {
          result[keys] = data[keys];
        }
        callback(result);
      }
    });
  },
  
  mockChromeStorageSet: () => {
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
  },
  
  mockChromeRuntimeSendMessage: (response) => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) callback(response);
    });
  },
  
  simulateStorageChange: (changes) => {
    // Simulate storage change events
    const listeners = chrome.storage.onChanged?._listeners || [];
    listeners.forEach(listener => {
      listener(changes, 'local');
    });
  }
};

// Add custom error types for extension testing
global.ExtensionError = class ExtensionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
  }
};

global.ValidationError = class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
};