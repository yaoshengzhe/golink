// Mock Safari Extension APIs
const mockSafariAPI = {
    runtime: {
        sendMessage: jest.fn(),
        lastError: null,
        onMessage: {
            addListener: jest.fn()
        }
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn()
        }
    }
};

const mockChromeAPI = {
    runtime: {
        sendMessage: jest.fn(),
        lastError: null,
        onMessage: {
            addListener: jest.fn()
        }
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn()
        }
    }
};

// Set up DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
    url: 'moz-extension://test-extension/create.html'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

describe('Safari Extension Messaging Tests', () => {
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset global objects
        delete global.window.chrome;
        delete global.window.browser;
        delete global.window.safari;
        
        // Reset API mocks
        mockSafariAPI.runtime.lastError = null;
        mockChromeAPI.runtime.lastError = null;
    });

    describe('Cross-browser API Detection', () => {
        test('should detect Safari browser API', () => {
            global.window.browser = mockSafariAPI;
            
            const extensionAPI = global.window.browser || global.window.chrome;
            expect(extensionAPI).toBe(mockSafariAPI);
            expect(extensionAPI.runtime).toBeDefined();
        });

        test('should detect Chrome extension API', () => {
            global.window.chrome = mockChromeAPI;
            
            const extensionAPI = global.window.browser || global.window.chrome;
            expect(extensionAPI).toBe(mockChromeAPI);
            expect(extensionAPI.runtime).toBeDefined();
        });

        test('should handle missing extension APIs gracefully', () => {
            const extensionAPI = global.window.browser || global.window.chrome;
            expect(extensionAPI).toBeUndefined();
        });
    });

    describe('Message Sending Function', () => {
        const sendMessageCode = `
            function sendMessage(message) {
                return new Promise((resolve, reject) => {
                    const extensionAPI = window.browser || window.chrome;
                    
                    if (!extensionAPI || !extensionAPI.runtime) {
                        reject(new Error('Extension API not available. Make sure the extension is properly loaded.'));
                        return;
                    }
                    
                    console.log('Sending message:', message);
                    console.log('Using API:', extensionAPI === window.browser ? 'browser' : 'chrome');
                    
                    // For Safari 18.x: Extension pages should NOT use extensionId when messaging to background
                    // Only webpage-to-extension communication requires extensionId
                    try {
                        extensionAPI.runtime.sendMessage(message, (response) => {
                            const lastError = extensionAPI.runtime.lastError;
                            if (lastError) {
                                console.error('Runtime error:', lastError);
                                reject(new Error(lastError.message));
                            } else {
                                console.log('Received response:', response);
                                resolve(response);
                            }
                        });
                    } catch (error) {
                        console.error('sendMessage error:', error);
                        reject(new Error('Failed to send message: ' + error.message));
                    }
                });
            }
        `;

        beforeEach(() => {
            // Define sendMessage function globally
            global.sendMessage = function(message) {
                return new Promise((resolve, reject) => {
                    const extensionAPI = global.window.browser || global.window.chrome;
                    
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
        });

        test('should successfully send message with Safari API', async () => {
            global.window.browser = mockSafariAPI;
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback({ success: true, data: 'test response' });
            });

            const testMessage = { action: 'test' };
            const response = await sendMessage(testMessage);

            expect(mockSafariAPI.runtime.sendMessage).toHaveBeenCalledWith(
                testMessage,
                expect.any(Function)
            );
            expect(response).toEqual({ success: true, data: 'test response' });
        });

        test('should successfully send message with Chrome API', async () => {
            global.window.chrome = mockChromeAPI;
            mockChromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback({ success: true, data: 'test response' });
            });

            const testMessage = { action: 'test' };
            const response = await sendMessage(testMessage);

            expect(mockChromeAPI.runtime.sendMessage).toHaveBeenCalledWith(
                testMessage,
                expect.any(Function)
            );
            expect(response).toEqual({ success: true, data: 'test response' });
        });

        test('should handle Safari runtime errors', async () => {
            global.window.browser = mockSafariAPI;
            mockSafariAPI.runtime.lastError = { message: 'Safari runtime error' };
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback(null);
            });

            const testMessage = { action: 'test' };
            
            await expect(sendMessage(testMessage)).rejects.toThrow('Safari runtime error');
        });

        test('should handle missing extension API', async () => {
            const testMessage = { action: 'test' };
            
            await expect(sendMessage(testMessage)).rejects.toThrow(
                'Extension API not available. Make sure the extension is properly loaded.'
            );
        });

        test('should handle sendMessage exceptions', async () => {
            global.window.browser = mockSafariAPI;
            mockSafariAPI.runtime.sendMessage.mockImplementation(() => {
                throw new Error('sendMessage exception');
            });

            const testMessage = { action: 'test' };
            
            await expect(sendMessage(testMessage)).rejects.toThrow(
                'Failed to send message: sendMessage exception'
            );
        });

        test('should not use extensionId parameter for Safari 18.x compatibility', async () => {
            global.window.browser = mockSafariAPI;
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                callback({ success: true });
            });

            const testMessage = { action: 'test' };
            await sendMessage(testMessage);

            // Verify that sendMessage was called with only message and callback
            // (no extensionId parameter)
            expect(mockSafariAPI.runtime.sendMessage).toHaveBeenCalledWith(
                testMessage,
                expect.any(Function)
            );
            expect(mockSafariAPI.runtime.sendMessage).toHaveBeenCalledTimes(1);
        });
    });

    describe('Safari-specific Message Actions', () => {
        beforeEach(() => {
            global.window.browser = mockSafariAPI;
            eval(`
                function sendMessage(message) {
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
                }
            `);
        });

        test('should handle saveMapping action', async () => {
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                if (message.action === 'saveMapping') {
                    callback({ success: true });
                } else {
                    callback({ error: 'Unknown action' });
                }
            });

            const response = await sendMessage({
                action: 'saveMapping',
                shortName: 'test',
                url: 'https://example.com',
                description: 'Test link'
            });

            expect(response).toEqual({ success: true });
        });

        test('should handle getAllMappings action', async () => {
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                if (message.action === 'getAllMappings') {
                    callback({ 
                        gmail: { url: 'https://gmail.com', description: 'Gmail' },
                        test: { url: 'https://test.com', description: 'Test' }
                    });
                } else {
                    callback({ error: 'Unknown action' });
                }
            });

            const response = await sendMessage({ action: 'getAllMappings' });

            expect(response).toEqual({
                gmail: { url: 'https://gmail.com', description: 'Gmail' },
                test: { url: 'https://test.com', description: 'Test' }
            });
        });

        test('should handle deleteMapping action', async () => {
            mockSafariAPI.runtime.sendMessage.mockImplementation((message, callback) => {
                if (message.action === 'deleteMapping') {
                    callback({ success: true });
                } else {
                    callback({ error: 'Unknown action' });
                }
            });

            const response = await sendMessage({
                action: 'deleteMapping',
                shortName: 'test'
            });

            expect(response).toEqual({ success: true });
        });
    });
});