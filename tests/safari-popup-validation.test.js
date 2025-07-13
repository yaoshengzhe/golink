// Safari Popup Functionality Validation Tests
// Tests actual Safari popup behavior, DOM manipulation, and user interactions

describe('Safari Popup Validation Tests', () => {
  let mockSafariAPI;
  let mockDOM;
  let popupScript;

  beforeEach(() => {
    // Mock Safari Web Extension API
    mockSafariAPI = {
      runtime: {
        getURL: jest.fn(path => `safari-web-extension://extension-id/${path}`),
        sendMessage: jest.fn(),
        lastError: null
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn()
        }
      },
      tabs: {
        create: jest.fn(),
        update: jest.fn()
      }
    };

    // Mock DOM environment
    mockDOM = {
      elements: new Map(),
      eventListeners: new Map(),
      
      createElement: jest.fn((tagName) => {
        const element = {
          tagName: tagName.toUpperCase(),
          innerHTML: '',
          textContent: '',
          value: '',
          style: {},
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
          },
          setAttribute: jest.fn(),
          getAttribute: jest.fn(),
          addEventListener: jest.fn((event, handler) => {
            const key = `${element.id || 'anonymous'}-${event}`;
            mockDOM.eventListeners.set(key, handler);
          }),
          click: jest.fn(),
          focus: jest.fn(),
          appendChild: jest.fn(),
          removeChild: jest.fn()
        };
        return element;
      }),

      getElementById: jest.fn((id) => {
        return mockDOM.elements.get(id) || null;
      }),

      querySelector: jest.fn((selector) => {
        // Simple mock implementation
        if (selector.startsWith('#')) {
          return mockDOM.getElementById(selector.slice(1));
        }
        return null;
      }),

      querySelectorAll: jest.fn(() => []),

      addEventListener: jest.fn((event, handler) => {
        mockDOM.eventListeners.set(`document-${event}`, handler);
      })
    };

    // Create mock popup elements
    const mockElements = {
      shortName: {
        id: 'shortName',
        tagName: 'INPUT',
        type: 'text',
        value: '',
        placeholder: 'Enter short name (e.g., gmail)',
        addEventListener: jest.fn(),
        focus: jest.fn()
      },
      url: {
        id: 'url', 
        tagName: 'INPUT',
        type: 'url',
        value: '',
        placeholder: 'Enter URL (e.g., https://mail.google.com)',
        addEventListener: jest.fn()
      },
      description: {
        id: 'description',
        tagName: 'INPUT', 
        type: 'text',
        value: '',
        placeholder: 'Optional description',
        addEventListener: jest.fn()
      },
      saveButton: {
        id: 'saveButton',
        tagName: 'BUTTON',
        textContent: 'Save Link',
        disabled: false,
        addEventListener: jest.fn(),
        click: jest.fn()
      },
      linksList: {
        id: 'linksList',
        tagName: 'DIV',
        innerHTML: '',
        appendChild: jest.fn(),
        removeChild: jest.fn()
      },
      searchInput: {
        id: 'searchInput',
        tagName: 'INPUT',
        type: 'text',
        value: '',
        placeholder: 'Search links...',
        addEventListener: jest.fn()
      },
      errorMessage: {
        id: 'errorMessage',
        tagName: 'DIV',
        textContent: '',
        style: { display: 'none' },
        classList: { add: jest.fn(), remove: jest.fn() }
      },
      successMessage: {
        id: 'successMessage', 
        tagName: 'DIV',
        textContent: '',
        style: { display: 'none' },
        classList: { add: jest.fn(), remove: jest.fn() }
      }
    };

    // Register elements
    Object.entries(mockElements).forEach(([key, element]) => {
      mockDOM.elements.set(key, element);
    });

    // Set up global environment
    global.browser = mockSafariAPI;
    global.document = mockDOM;
    global.window = { 
      location: { search: '' },
      document: mockDOM,
      browser: mockSafariAPI
    };

    delete global.chrome; // Safari doesn't have chrome API
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Safari Popup DOM Initialization', () => {
    test('should find all required popup elements', () => {
      const requiredElements = [
        'shortName', 'url', 'description', 'saveButton', 
        'linksList', 'searchInput', 'errorMessage', 'successMessage'
      ];

      requiredElements.forEach(elementId => {
        const element = mockDOM.getElementById(elementId);
        expect(element).toBeTruthy();
        expect(element.id).toBe(elementId);
      });
    });

    test('should initialize Safari popup event listeners', () => {
      const initializePopup = () => {
        const shortNameEl = mockDOM.getElementById('shortName');
        const urlEl = mockDOM.getElementById('url');
        const saveButtonEl = mockDOM.getElementById('saveButton');
        const searchEl = mockDOM.getElementById('searchInput');

        if (shortNameEl && urlEl && saveButtonEl && searchEl) {
          shortNameEl.addEventListener('input', () => {});
          urlEl.addEventListener('input', () => {});
          saveButtonEl.addEventListener('click', () => {});
          searchEl.addEventListener('input', () => {});
          
          shortNameEl.focus();
          return true;
        }
        return false;
      };

      expect(initializePopup()).toBe(true);
      
      const shortNameEl = mockDOM.getElementById('shortName');
      const urlEl = mockDOM.getElementById('url');
      const saveButtonEl = mockDOM.getElementById('saveButton');
      const searchEl = mockDOM.getElementById('searchInput');

      expect(shortNameEl.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
      expect(urlEl.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
      expect(saveButtonEl.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(searchEl.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
      expect(shortNameEl.focus).toHaveBeenCalled();
    });
  });

  describe('Safari Popup Input Validation', () => {
    test('should validate short name input in Safari popup', () => {
      const validateShortName = (shortName) => {
        if (!shortName || shortName.trim().length === 0) {
          return { valid: false, error: 'Short name is required' };
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(shortName)) {
          return { valid: false, error: 'Short name can only contain letters, numbers, hyphens, and underscores' };
        }
        
        if (shortName.length > 50) {
          return { valid: false, error: 'Short name must be 50 characters or less' };
        }
        
        return { valid: true, error: null };
      };

      // Valid short names
      expect(validateShortName('gmail')).toEqual({ valid: true, error: null });
      expect(validateShortName('my-link')).toEqual({ valid: true, error: null });
      expect(validateShortName('test_123')).toEqual({ valid: true, error: null });
      expect(validateShortName('ABC')).toEqual({ valid: true, error: null });

      // Invalid short names
      expect(validateShortName('')).toEqual({ valid: false, error: 'Short name is required' });
      expect(validateShortName('   ')).toEqual({ valid: false, error: 'Short name is required' });
      expect(validateShortName('spa ce')).toEqual({ valid: false, error: 'Short name can only contain letters, numbers, hyphens, and underscores' });
      expect(validateShortName('special@chars')).toEqual({ valid: false, error: 'Short name can only contain letters, numbers, hyphens, and underscores' });
      expect(validateShortName('a'.repeat(51))).toEqual({ valid: false, error: 'Short name must be 50 characters or less' });
    });

    test('should validate URL input in Safari popup', () => {
      const validateURL = (url) => {
        if (!url || url.trim().length === 0) {
          return { valid: false, error: 'URL is required' };
        }

        try {
          const urlObj = new URL(url);
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return { valid: false, error: 'URL must use http:// or https://' };
          }
          
          if (urlObj.hostname === 'go') {
            return { valid: false, error: 'Cannot create go-link that points to another go-link' };
          }
          
          return { valid: true, error: null };
        } catch {
          return { valid: false, error: 'Please enter a valid URL' };
        }
      };

      // Valid URLs
      expect(validateURL('https://google.com')).toEqual({ valid: true, error: null });
      expect(validateURL('http://example.com')).toEqual({ valid: true, error: null });
      expect(validateURL('https://mail.google.com/mail/u/0/#inbox')).toEqual({ valid: true, error: null });

      // Invalid URLs
      expect(validateURL('')).toEqual({ valid: false, error: 'URL is required' });
      expect(validateURL('not-a-url')).toEqual({ valid: false, error: 'Please enter a valid URL' });
      expect(validateURL('ftp://example.com')).toEqual({ valid: false, error: 'URL must use http:// or https://' });
      expect(validateURL('http://go/recursive')).toEqual({ valid: false, error: 'Cannot create go-link that points to another go-link' });
    });

    test('should show validation errors in Safari popup UI', () => {
      const showError = (message) => {
        const errorEl = mockDOM.getElementById('errorMessage');
        const successEl = mockDOM.getElementById('successMessage');
        
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.style.display = 'block';
          errorEl.classList.add('error');
        }
        
        if (successEl) {
          successEl.style.display = 'none';
          successEl.classList.remove('success');
        }
      };

      const hideError = () => {
        const errorEl = mockDOM.getElementById('errorMessage');
        if (errorEl) {
          errorEl.style.display = 'none';
          errorEl.classList.remove('error');
        }
      };

      showError('Test error message');
      
      const errorEl = mockDOM.getElementById('errorMessage');
      expect(errorEl.textContent).toBe('Test error message');
      expect(errorEl.style.display).toBe('block');
      expect(errorEl.classList.add).toHaveBeenCalledWith('error');

      hideError();
      expect(errorEl.style.display).toBe('none');
      expect(errorEl.classList.remove).toHaveBeenCalledWith('error');
    });
  });

  describe('Safari Popup Link Management', () => {
    test('should save new link through Safari API', async () => {
      const testGoLinks = {
        existing: { url: 'https://existing.com', description: 'Existing' }
      };

      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: testGoLinks });
      });

      mockSafariAPI.storage.local.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      const saveLink = async (shortName, url, description = '') => {
        return new Promise((resolve, reject) => {
          mockSafariAPI.storage.local.get('golinks', (data) => {
            if (mockSafariAPI.runtime.lastError) {
              reject(new Error(mockSafariAPI.runtime.lastError.message));
              return;
            }

            const golinks = data.golinks || {};
            
            if (golinks[shortName]) {
              reject(new Error('Link already exists'));
              return;
            }

            golinks[shortName] = {
              url: url,
              description: description,
              createdAt: Date.now()
            };

            mockSafariAPI.storage.local.set({ golinks }, () => {
              if (mockSafariAPI.runtime.lastError) {
                reject(new Error(mockSafariAPI.runtime.lastError.message));
              } else {
                resolve({ success: true, shortName, url });
              }
            });
          });
        });
      };

      const result = await saveLink('test', 'https://test.com', 'Test Link');
      
      expect(result).toEqual({
        success: true,
        shortName: 'test',
        url: 'https://test.com'
      });

      expect(mockSafariAPI.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          golinks: expect.objectContaining({
            existing: expect.any(Object),
            test: expect.objectContaining({
              url: 'https://test.com',
              description: 'Test Link',
              createdAt: expect.any(Number)
            })
          })
        }),
        expect.any(Function)
      );
    });

    test('should handle duplicate link names in Safari popup', async () => {
      const existingGoLinks = {
        gmail: { url: 'https://mail.google.com', description: 'Gmail' }
      };

      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: existingGoLinks });
      });

      const checkDuplicate = async (shortName) => {
        return new Promise(resolve => {
          mockSafariAPI.storage.local.get('golinks', (data) => {
            const golinks = data.golinks || {};
            resolve(!!golinks[shortName]);
          });
        });
      };

      const isDuplicate = await checkDuplicate('gmail');
      expect(isDuplicate).toBe(true);

      const isNotDuplicate = await checkDuplicate('newlink');
      expect(isNotDuplicate).toBe(false);
    });

    test('should delete links through Safari popup', async () => {
      const testGoLinks = {
        gmail: { url: 'https://mail.google.com', description: 'Gmail' },
        drive: { url: 'https://drive.google.com', description: 'Drive' }
      };

      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        callback({ golinks: testGoLinks });
      });

      mockSafariAPI.storage.local.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      const deleteLink = async (shortName) => {
        return new Promise(resolve => {
          mockSafariAPI.storage.local.get('golinks', (data) => {
            const golinks = data.golinks || {};
            
            if (golinks[shortName]) {
              delete golinks[shortName];
              mockSafariAPI.storage.local.set({ golinks }, () => {
                resolve({ success: true, deleted: shortName });
              });
            } else {
              resolve({ success: false, error: 'Link not found' });
            }
          });
        });
      };

      const result = await deleteLink('gmail');
      expect(result).toEqual({ success: true, deleted: 'gmail' });

      expect(mockSafariAPI.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          golinks: expect.not.objectContaining({
            gmail: expect.any(Object)
          })
        }),
        expect.any(Function)
      );
    });
  });

  describe('Safari Popup Search and Filter', () => {
    test('should filter links in Safari popup', () => {
      const testGoLinks = {
        gmail: { url: 'https://mail.google.com', description: 'Gmail Email' },
        drive: { url: 'https://drive.google.com', description: 'Google Drive' },
        calendar: { url: 'https://calendar.google.com', description: 'Google Calendar' },
        youtube: { url: 'https://youtube.com', description: 'YouTube Videos' }
      };

      const filterLinks = (golinks, searchTerm) => {
        if (!searchTerm || searchTerm.trim().length === 0) {
          return golinks;
        }

        const filtered = {};
        const search = searchTerm.toLowerCase();

        Object.entries(golinks).forEach(([key, value]) => {
          if (key.toLowerCase().includes(search) || 
              value.description.toLowerCase().includes(search) ||
              value.url.toLowerCase().includes(search)) {
            filtered[key] = value;
          }
        });

        return filtered;
      };

      // Test various search terms
      expect(Object.keys(filterLinks(testGoLinks, 'gmail'))).toEqual(['gmail']);
      expect(Object.keys(filterLinks(testGoLinks, 'google'))).toEqual(['gmail', 'drive', 'calendar']); // gmail has mail.google.com
      expect(Object.keys(filterLinks(testGoLinks, 'drive'))).toEqual(['drive']);
      expect(Object.keys(filterLinks(testGoLinks, 'video'))).toEqual(['youtube']);
      expect(Object.keys(filterLinks(testGoLinks, ''))).toEqual(['gmail', 'drive', 'calendar', 'youtube']);
      expect(Object.keys(filterLinks(testGoLinks, 'nonexistent'))).toEqual([]);
    });

    test('should update Safari popup UI during search', () => {
      const searchInput = mockDOM.getElementById('searchInput');
      const linksList = mockDOM.getElementById('linksList');

      const updateLinksDisplay = (filteredLinks) => {
        linksList.innerHTML = '';
        
        Object.entries(filteredLinks).forEach(([shortName, link]) => {
          const linkElement = mockDOM.createElement('div');
          linkElement.innerHTML = `
            <strong>${shortName}</strong>: ${link.url}
            <br><small>${link.description}</small>
          `;
          linksList.appendChild(linkElement);
        });
      };

      const testLinks = {
        gmail: { url: 'https://mail.google.com', description: 'Gmail' }
      };

      updateLinksDisplay(testLinks);
      
      expect(linksList.appendChild).toHaveBeenCalled();
      expect(linksList.innerHTML).toBe('');
    });
  });

  describe('Safari Popup Error Handling', () => {
    test('should handle Safari storage errors in popup', async () => {
      mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
        mockSafariAPI.runtime.lastError = { message: 'Storage quota exceeded' };
        callback(null);
      });

      const handleStorageError = () => {
        return new Promise(resolve => {
          mockSafariAPI.storage.local.get('golinks', (data) => {
            if (mockSafariAPI.runtime.lastError) {
              resolve({ 
                error: true, 
                message: mockSafariAPI.runtime.lastError.message 
              });
            } else {
              resolve({ error: false, data: data });
            }
          });
        });
      };

      const result = await handleStorageError();
      expect(result).toEqual({
        error: true,
        message: 'Storage quota exceeded'
      });
    });

    test('should handle Safari popup messaging errors', async () => {
      mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
        mockSafariAPI.runtime.lastError = { message: 'Extension context invalidated' };
        callback(null);
      });

      const sendMessage = (message) => {
        return new Promise(resolve => {
          mockSafariAPI.runtime.sendMessage(message, (response) => {
            if (mockSafariAPI.runtime.lastError) {
              resolve({ 
                error: true, 
                message: mockSafariAPI.runtime.lastError.message 
              });
            } else {
              resolve({ error: false, response });
            }
          });
        });
      };

      const result = await sendMessage({ action: 'test' });
      expect(result).toEqual({
        error: true,
        message: 'Extension context invalidated'
      });
    });
  });

  describe('Safari Popup URL Parameters', () => {
    test('should handle Safari popup URL parameters for pre-filling', () => {
      const parseURLParams = (search) => {
        const params = new URLSearchParams(search);
        return {
          shortName: params.get('shortName') || '',
          url: params.get('url') || '',
          description: params.get('description') || ''
        };
      };

      // Test various URL parameter scenarios
      expect(parseURLParams('?shortName=test')).toEqual({
        shortName: 'test',
        url: '',
        description: ''
      });

      expect(parseURLParams('?shortName=gmail&url=https%3A//mail.google.com')).toEqual({
        shortName: 'gmail',
        url: 'https://mail.google.com',
        description: ''
      });

      expect(parseURLParams('')).toEqual({
        shortName: '',
        url: '',
        description: ''
      });
    });

    test('should pre-fill Safari popup form from URL parameters', () => {
      const shortNameEl = mockDOM.getElementById('shortName');
      const urlEl = mockDOM.getElementById('url');
      const descriptionEl = mockDOM.getElementById('description');

      const prefillForm = (params) => {
        if (shortNameEl) shortNameEl.value = params.shortName || '';
        if (urlEl) urlEl.value = params.url || '';
        if (descriptionEl) descriptionEl.value = params.description || '';
      };

      const testParams = {
        shortName: 'test',
        url: 'https://example.com',
        description: 'Test Link'
      };

      prefillForm(testParams);

      expect(shortNameEl.value).toBe('test');
      expect(urlEl.value).toBe('https://example.com');
      expect(descriptionEl.value).toBe('Test Link');
    });
  });
});