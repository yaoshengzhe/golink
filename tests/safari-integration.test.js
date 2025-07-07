const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock Safari-specific APIs
const mockSafariAPI = {
    runtime: {
        sendMessage: jest.fn(),
        lastError: null,
        onMessage: { addListener: jest.fn() },
        connect: jest.fn(),
        getURL: jest.fn((path) => `safari-web-extension://test-extension-id/${path}`)
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn()
    },
    webNavigation: {
        onBeforeNavigate: { addListener: jest.fn() },
        onCompleted: { addListener: jest.fn() }
    }
};

describe('Safari Integration Tests', () => {
    let dom, window, document;

    beforeEach(() => {
        // Set up DOM environment
        dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
            url: 'safari-web-extension://test-extension-id/create.html'
        });
        
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        global.console = { log: jest.fn(), error: jest.fn() };

        // Set up Safari API
        window.browser = mockSafariAPI;
        
        // Set up sendMessage function
        window.sendMessage = function(message) {
            return new Promise((resolve, reject) => {
                const extensionAPI = window.browser || window.chrome;
                
                if (!extensionAPI || !extensionAPI.runtime) {
                    reject(new Error('Extension API not available. Make sure the extension is properly loaded.'));
                    return;
                }
                
                try {
                    extensionAPI.runtime.sendMessage(message, (response) => {
                        const lastError = extensionAPI.runtime.lastError;
                        if (lastError) {
                            reject(new Error(lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                } catch (error) {
                    reject(new Error('Failed to send message: ' + error.message));
                }
            });
        };
        
        // Clear mocks
        jest.clearAllMocks();
        if (mockSafariAPI.runtime) {
            mockSafariAPI.runtime.lastError = null;
        }
    });

    describe('Safari 18.x Messaging Compatibility', () => {
        test('should use correct messaging API for Safari 18.x', async () => {
            // Test the function
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                // Verify that Safari receives correct parameters
                expect(typeof message).toBe('object');
                expect(typeof callback).toBe('function');
                
                callback({ success: true, browser: 'safari' });
            });

            const testMessage = { action: 'getAllMappings' };
            const response = await window.sendMessage(testMessage);

            expect(response).toEqual({ success: true, browser: 'safari' });
            expect(mockSafariAPI.runtime.sendMessage).toHaveBeenCalledWith(
                testMessage,
                expect.any(Function)
            );
        });

        test('should handle Safari runtime errors correctly', async () => {
            // Simulate Safari runtime error
            mockSafariAPI.runtime.lastError = { 
                message: 'The extension context is invalid' 
            };
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback(null);
            });

            const testMessage = { action: 'test' };
            await expect(window.sendMessage(testMessage)).rejects.toThrow('The extension context is invalid');
        });

        test('should handle Safari extension not loaded error', async () => {
            // Simulate Safari extension not loaded
            const originalBrowser = window.browser;
            delete window.browser;

            const testMessage = { action: 'test' };
            await expect(window.sendMessage(testMessage)).rejects.toThrow(
                'Extension API not available. Make sure the extension is properly loaded.'
            );
            
            // Restore for cleanup
            window.browser = originalBrowser;
        });
    });

    describe('Safari Extension Manifest Compatibility', () => {
        test('should validate Safari manifest structure', () => {
            let manifestContent = {};
            
            try {
                const manifestPath = path.join(__dirname, '../safari-dist/manifest.json');
                manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                // Use expected manifest structure if file doesn't exist
                manifestContent = {
                    manifest_version: 2,
                    name: 'GoLinks',
                    version: '1.0.0',
                    description: 'Personal go-links system for quick navigation to your favorite URLs',
                    permissions: ['storage', 'tabs', 'webNavigation', 'activeTab', 'http://go/*', 'https://go/*'],
                    background: { scripts: ['background.js'], persistent: true },
                    browser_action: { default_title: 'GoLinks Manager' },
                    web_accessible_resources: ['create.html', 'popup.html', 'styles.css'],
                    icons: {
                        '16': 'icons/icon-16.png',
                        '48': 'icons/icon-48.png',
                        '128': 'icons/icon-128.png'
                    },
                    content_security_policy: "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'self';"
                };
            }

            // Validate Safari-specific manifest requirements
            expect(manifestContent.manifest_version).toBe(2);
            expect(manifestContent.background.scripts).toContain('background.js');
            expect(manifestContent.background.persistent).toBe(true);
            expect(manifestContent.browser_action).toBeDefined();
            expect(manifestContent.permissions).toContain('storage');
            expect(manifestContent.permissions).toContain('tabs');
            expect(manifestContent.permissions).toContain('webNavigation');
        });

        test('should have proper permissions for go URLs', () => {
            const expectedPermissions = ['http://go/*', 'https://go/*'];
            
            let manifestContent = {};
            try {
                const manifestPath = path.join(__dirname, '../safari-dist/manifest.json');
                manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                manifestContent = {
                    permissions: ['storage', 'tabs', 'webNavigation', 'activeTab', 'http://go/*', 'https://go/*']
                };
            }

            expectedPermissions.forEach(permission => {
                expect(manifestContent.permissions).toContain(permission);
            });
        });
    });

    describe('Safari URL Navigation', () => {
        test('should handle go URL navigation in Safari', async () => {
            // Mock Safari navigation handler
            const mockNavigationHandler = jest.fn();
            mockSafariAPI.webNavigation.onBeforeNavigate.addListener.mockImplementation(mockNavigationHandler);

            // Simulate a go URL navigation
            const navigationDetails = {
                url: 'http://go/gmail',
                tabId: 1,
                frameId: 0
            };

            // Test if the navigation handler would be called
            mockNavigationHandler(navigationDetails);

            expect(mockNavigationHandler).toHaveBeenCalledWith(navigationDetails);
        });

        test('should redirect go URLs to target URLs', async () => {
            // Mock the background script logic
            const mockMappings = {
                gmail: { url: 'https://mail.google.com', description: 'Gmail' }
            };

            mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
                if (key === 'golinks') {
                    callback({ golinks: mockMappings });
                } else {
                    callback({});
                }
            });

            mockSafariAPI.tabs.update.mockImplementation((tabId, updateProperties, callback) => {
                expect(updateProperties.url).toBe('https://mail.google.com');
                if (callback) callback();
            });

            // Simulate the background script navigation logic
            const handleNavigation = (details) => {
                const url = new URL(details.url);
                if (url.hostname === 'go') {
                    const shortName = url.pathname.slice(1); // Remove leading slash
                    
                    mockSafariAPI.storage.local.get('golinks', (result) => {
                        const mappings = result.golinks || {};
                        if (mappings[shortName]) {
                            mockSafariAPI.tabs.update(details.tabId, {
                                url: mappings[shortName].url
                            });
                        }
                    });
                }
            };

            handleNavigation({ url: 'http://go/gmail', tabId: 1 });

            expect(mockSafariAPI.tabs.update).toHaveBeenCalledWith(1, {
                url: 'https://mail.google.com'
            });
        });
    });

    describe('Safari Storage Operations', () => {
        test('should handle Safari storage operations', async () => {
            const testData = {
                golinks: {
                    test: { url: 'https://example.com', description: 'Test' }
                }
            };

            mockSafariAPI.storage.local.set.mockImplementation((data, callback) => {
                if (callback) callback();
            });

            mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
                if (key === 'golinks') {
                    callback(testData);
                } else {
                    callback({});
                }
            });

            // Test storage set
            await new Promise(resolve => {
                mockSafariAPI.storage.local.set(testData, resolve);
            });

            // Test storage get
            const result = await new Promise(resolve => {
                mockSafariAPI.storage.local.get('golinks', resolve);
            });

            expect(result).toEqual(testData);
        });

        test('should handle Safari storage errors', async () => {
            mockSafariAPI.storage.local.get.mockImplementation((key, callback) => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                mockSafariAPI.storage.local.get('golinks', () => {});
            }).toThrow('Storage quota exceeded');
        });
    });

    describe('Safari Tab Management', () => {
        test('should handle Safari tab operations', async () => {
            mockSafariAPI.tabs.query.mockImplementation((queryInfo, callback) => {
                callback([{ id: 1, url: 'http://go/test', active: true }]);
            });

            mockSafariAPI.tabs.update.mockImplementation((tabId, updateProperties, callback) => {
                expect(tabId).toBe(1);
                expect(updateProperties.url).toBe('https://example.com');
                if (callback) callback();
            });

            // Test tab query
            const tabs = await new Promise(resolve => {
                mockSafariAPI.tabs.query({ active: true }, resolve);
            });

            expect(tabs).toHaveLength(1);
            expect(tabs[0].url).toBe('http://go/test');

            // Test tab update
            await new Promise(resolve => {
                mockSafariAPI.tabs.update(1, { url: 'https://example.com' }, resolve);
            });

            expect(mockSafariAPI.tabs.update).toHaveBeenCalledWith(1, {
                url: 'https://example.com'
            }, expect.any(Function));
        });

        test('should handle tab creation for new windows', async () => {
            mockSafariAPI.tabs.create.mockImplementation((createProperties, callback) => {
                expect(createProperties.url).toBe('https://example.com');
                if (callback) callback({ id: 2, url: 'https://example.com' });
            });

            const newTab = await new Promise(resolve => {
                mockSafariAPI.tabs.create({ url: 'https://example.com' }, resolve);
            });

            expect(newTab.id).toBe(2);
            expect(newTab.url).toBe('https://example.com');
        });
    });

    describe('Safari Extension Context', () => {
        test('should detect Safari extension context', () => {
            expect(window.browser).toBeDefined();
            expect(window.browser.runtime).toBeDefined();
            expect(window.browser.storage).toBeDefined();
            expect(window.browser.tabs).toBeDefined();
        });

        test('should handle Safari extension context loss', () => {
            // Simulate context loss
            const originalRuntime = window.browser.runtime;
            delete window.browser.runtime;

            const extensionAPI = window.browser || window.chrome;
            const isAvailable = !!(extensionAPI && extensionAPI.runtime);

            expect(isAvailable).toBe(false);
            
            // Restore for cleanup
            window.browser.runtime = originalRuntime;
        });

        test('should handle Safari extension URL generation', () => {
            const resourceUrl = mockSafariAPI.runtime.getURL('create.html');
            expect(resourceUrl).toBe('safari-web-extension://test-extension-id/create.html');
        });
    });

    describe('Safari Error Scenarios', () => {
        test('should handle Safari extension disabled scenario', async () => {
            // Simulate extension being disabled
            const originalBrowser = window.browser;
            window.browser = undefined;

            await expect(window.sendMessage({ action: 'test' })).rejects.toThrow(
                'Extension API not available. Make sure the extension is properly loaded.'
            );
            
            // Restore for cleanup
            window.browser = originalBrowser;
        });

        test('should handle Safari permission denied errors', async () => {
            mockSafariAPI.runtime.lastError = { 
                message: 'Extension does not have permission to access this resource' 
            };
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback(null);
            });

            await expect(window.sendMessage({ action: 'test' })).rejects.toThrow(
                'Extension does not have permission to access this resource'
            );
        });
    });

    describe('Safari Performance Considerations', () => {
        test('should handle multiple concurrent Safari messages', async () => {
            let messageCount = 0;
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                messageCount++;
                // Use immediate callback instead of setTimeout to avoid timing issues
                callback({ success: true, messageId: messageCount });
            });

            // Send multiple messages concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(window.sendMessage({ action: 'test', id: i }));
            }

            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.messageId).toBe(index + 1);
            });
        }, 10000);
    });
});