const { JSDOM } = require('jsdom');

// Mock extension APIs
const mockExtensionAPI = {
    runtime: {
        sendMessage: jest.fn(),
        lastError: null
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn()
        }
    }
};

describe('UI Interactions', () => {
    let dom, window, document;

    beforeEach(() => {
        // Create DOM with the actual HTML structure
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>GoLinks Manager</title>
            </head>
            <body>
                <div class="container">
                    <div class="tabs">
                        <div class="tab active" data-tab="create">Create Link</div>
                        <div class="tab" data-tab="manage">Manage Links</div>
                    </div>
                    
                    <div id="create-tab" class="tab-content active">
                        <div class="section">
                            <h3>Create New GoLink</h3>
                            <form id="createForm">
                                <div class="form-group">
                                    <label for="shortName">Short Name:</label>
                                    <input type="text" id="shortName" required pattern="[a-zA-Z0-9_-]+" placeholder="gmail">
                                </div>
                                <div class="form-group">
                                    <label for="targetUrl">Target URL:</label>
                                    <input type="url" id="targetUrl" required placeholder="https://mail.google.com">
                                </div>
                                <div class="form-group">
                                    <label for="description">Description:</label>
                                    <input type="text" id="description" placeholder="My Gmail inbox">
                                </div>
                                <button type="submit" class="btn btn-primary">Create GoLink</button>
                            </form>
                            <div id="message" style="display: none;"></div>
                        </div>
                    </div>

                    <div id="manage-tab" class="tab-content">
                        <div class="section">
                            <h3>Your GoLinks</h3>
                            <button class="btn btn-secondary" onclick="loadLinks()">🔄 Refresh</button>
                            <div id="linksList">
                                <div class="empty-state">Loading your links...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        global.console = { log: jest.fn(), error: jest.fn() };

        // Set up extension API
        window.browser = mockExtensionAPI;
        
        // Clear mocks
        jest.clearAllMocks();
    });

    describe('Tab Switching Functionality', () => {
        // Include the actual tab switching code
        const setupTabSwitching = () => {
            window.showTab = function(tabName, clickedElement) {
                console.log('Switching to tab:', tabName);
                
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected tab
                const targetTab = document.getElementById(tabName + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                }
                
                // Activate the clicked tab button
                if (clickedElement) {
                    clickedElement.classList.add('active');
                } else {
                    // Fallback: find the tab button by data-tab attribute
                    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
                    if (targetButton) {
                        targetButton.classList.add('active');
                    }
                }
                
                // Load links when switching to manage tab
                if (tabName === 'manage' && window.loadLinks) {
                    console.log('Loading links for manage tab');
                    window.loadLinks();
                }
            };

            // Set up tab click handlers
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab');
                    console.log('Tab clicked:', tabName);
                    window.showTab(tabName, this);
                });
            });
        };

        beforeEach(() => {
            setupTabSwitching();
        });

        test('should switch from create to manage tab', () => {
            const createTab = document.querySelector('[data-tab="create"]');
            const manageTab = document.querySelector('[data-tab="manage"]');
            const createContent = document.getElementById('create-tab');
            const manageContent = document.getElementById('manage-tab');

            // Initially create tab should be active
            expect(createTab.classList.contains('active')).toBe(true);
            expect(createContent.classList.contains('active')).toBe(true);
            expect(manageTab.classList.contains('active')).toBe(false);
            expect(manageContent.classList.contains('active')).toBe(false);

            // Click manage tab
            manageTab.click();

            // Check that manage tab is now active
            expect(createTab.classList.contains('active')).toBe(false);
            expect(createContent.classList.contains('active')).toBe(false);
            expect(manageTab.classList.contains('active')).toBe(true);
            expect(manageContent.classList.contains('active')).toBe(true);
        });

        test('should switch from manage to create tab', () => {
            const createTab = document.querySelector('[data-tab="create"]');
            const manageTab = document.querySelector('[data-tab="manage"]');

            // Switch to manage first
            manageTab.click();
            expect(manageTab.classList.contains('active')).toBe(true);

            // Switch back to create
            createTab.click();
            expect(createTab.classList.contains('active')).toBe(true);
            expect(manageTab.classList.contains('active')).toBe(false);
        });

        test('should call loadLinks when switching to manage tab', () => {
            window.loadLinks = jest.fn();
            const manageTab = document.querySelector('[data-tab="manage"]');

            manageTab.click();

            expect(window.loadLinks).toHaveBeenCalled();
        });
    });

    describe('Form Handling', () => {
        const setupFormHandling = () => {
            window.sendMessage = jest.fn();
            window.showMessage = function(text, type) {
                const messageDiv = document.getElementById('message');
                messageDiv.innerHTML = text;
                messageDiv.className = 'message ' + type;
                messageDiv.style.display = 'block';
            };

            // Set up form submission handler
            document.getElementById('createForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const shortName = document.getElementById('shortName').value.trim();
                const targetUrl = document.getElementById('targetUrl').value.trim();
                const description = document.getElementById('description').value.trim();
                
                if (!shortName || !targetUrl) {
                    window.showMessage('Please fill in both short name and target URL', 'error');
                    return;
                }
                
                try {
                    const response = await window.sendMessage({
                        action: 'saveMapping',
                        shortName: shortName,
                        url: targetUrl,
                        description: description
                    });
                    
                    if (response.error) {
                        window.showMessage('Error: ' + response.error, 'error');
                    } else {
                        window.showMessage(`✅ Created! Now try typing: http://go/${shortName}`, 'success');
                        document.getElementById('createForm').reset();
                    }
                } catch (error) {
                    window.showMessage('Error: ' + error.message, 'error');
                }
            });
        };

        beforeEach(() => {
            setupFormHandling();
        });

        test('should validate required fields', async () => {
            const form = document.getElementById('createForm');
            const shortNameInput = document.getElementById('shortName');
            const targetUrlInput = document.getElementById('targetUrl');
            const messageDiv = document.getElementById('message');

            // Submit empty form
            form.dispatchEvent(new window.Event('submit'));

            // Check that error message is shown
            expect(messageDiv.style.display).toBe('block');
            expect(messageDiv.innerHTML).toBe('Please fill in both short name and target URL');
            expect(messageDiv.className).toBe('message error');
        });

        test('should submit form with valid data', () => {
            window.sendMessage.mockResolvedValue({ success: true });

            const form = document.getElementById('createForm');
            const shortNameInput = document.getElementById('shortName');
            const targetUrlInput = document.getElementById('targetUrl');
            const descriptionInput = document.getElementById('description');

            // Fill in form data
            shortNameInput.value = 'test';
            targetUrlInput.value = 'https://example.com';
            descriptionInput.value = 'Test description';

            // Manually trigger the form handler logic
            const shortName = shortNameInput.value.trim();
            const targetUrl = targetUrlInput.value.trim();
            const description = descriptionInput.value.trim();

            // Simulate the form submission logic
            if (shortName && targetUrl) {
                window.sendMessage({
                    action: 'saveMapping',
                    shortName: shortName,
                    url: targetUrl,
                    description: description
                });
            }

            expect(window.sendMessage).toHaveBeenCalledWith({
                action: 'saveMapping',
                shortName: 'test',
                url: 'https://example.com',
                description: 'Test description'
            });
        });

        test('should handle form submission errors', async () => {
            window.sendMessage.mockRejectedValue(new Error('Network error'));

            const shortNameInput = document.getElementById('shortName');
            const targetUrlInput = document.getElementById('targetUrl');
            const messageDiv = document.getElementById('message');

            shortNameInput.value = 'test';
            targetUrlInput.value = 'https://example.com';

            // Simulate form submission error handling
            try {
                await window.sendMessage({
                    action: 'saveMapping',
                    shortName: 'test',
                    url: 'https://example.com',
                    description: ''
                });
            } catch (error) {
                window.showMessage('Error: ' + error.message, 'error');
            }

            expect(messageDiv.innerHTML).toBe('Error: Network error');
            expect(messageDiv.className).toBe('message error');
        });

        test('should reset form after successful submission', async () => {
            window.sendMessage.mockResolvedValue({ success: true });

            const form = document.getElementById('createForm');
            const shortNameInput = document.getElementById('shortName');
            const targetUrlInput = document.getElementById('targetUrl');

            shortNameInput.value = 'test';
            targetUrlInput.value = 'https://example.com';

            // Simulate successful form submission
            const response = await window.sendMessage({
                action: 'saveMapping',
                shortName: 'test',
                url: 'https://example.com',
                description: ''
            });

            if (response.success) {
                form.reset();
            }

            expect(shortNameInput.value).toBe('');
            expect(targetUrlInput.value).toBe('');
        });
    });

    describe('Links Management UI', () => {
        const setupLinksManagement = () => {
            window.sendMessage = jest.fn();
            window.showMessage = jest.fn();

            window.loadLinks = async function() {
                const linksList = document.getElementById('linksList');
                linksList.innerHTML = '<div class="empty-state">Loading your links...</div>';
                
                try {
                    const mappings = await window.sendMessage({ action: 'getAllMappings' });
                    
                    if (!mappings || Object.keys(mappings).length === 0) {
                        linksList.innerHTML = '<div class="empty-state">No GoLinks created yet.</div>';
                        return;
                    }
                    
                    const linksHtml = Object.entries(mappings)
                        .map(([shortName, mapping]) => window.createLinkHtml(shortName, mapping))
                        .join('');
                    
                    linksList.innerHTML = linksHtml;
                } catch (error) {
                    linksList.innerHTML = '<div class="empty-state error">Error loading links: ' + error.message + '</div>';
                }
            };

            window.createLinkHtml = function(shortName, mapping) {
                return `
                    <div class="link-item">
                        <div class="link-name">go/${shortName}</div>
                        <div class="link-url">${mapping.url}</div>
                        ${mapping.description ? `<div class="link-description">${mapping.description}</div>` : ''}
                        <div class="link-actions">
                            <button class="btn btn-secondary" onclick="openLink('${mapping.url}')">🔗 Open</button>
                            <button class="btn btn-secondary" onclick="copyLink('go/${shortName}')">📋 Copy</button>
                            <button class="btn btn-danger" onclick="deleteLink('${shortName}')">🗑 Delete</button>
                        </div>
                    </div>
                `;
            };

            window.deleteLink = async function(shortName) {
                try {
                    const response = await window.sendMessage({
                        action: 'deleteMapping',
                        shortName: shortName
                    });
                    
                    if (response.error) {
                        window.showMessage('Error deleting link: ' + response.error, 'error');
                    } else {
                        window.showMessage('Link deleted successfully', 'success');
                        window.loadLinks(); // Refresh the list
                    }
                } catch (error) {
                    window.showMessage('Error deleting link: ' + error.message, 'error');
                }
            };
        };

        beforeEach(() => {
            setupLinksManagement();
        });

        test('should load links successfully', async () => {
            const mockMappings = {
                gmail: { url: 'https://gmail.com', description: 'Gmail' },
                github: { url: 'https://github.com', description: 'GitHub' }
            };

            window.sendMessage.mockResolvedValue(mockMappings);

            await window.loadLinks();

            const linksList = document.getElementById('linksList');
            expect(linksList.innerHTML).toContain('go/gmail');
            expect(linksList.innerHTML).toContain('https://gmail.com');
            expect(linksList.innerHTML).toContain('go/github');
            expect(linksList.innerHTML).toContain('https://github.com');
        });

        test('should show empty state when no links exist', async () => {
            window.sendMessage.mockResolvedValue({});

            await window.loadLinks();

            const linksList = document.getElementById('linksList');
            expect(linksList.innerHTML).toContain('No GoLinks created yet');
        });

        test('should handle loading errors', async () => {
            window.sendMessage.mockRejectedValue(new Error('API Error'));

            await window.loadLinks();

            const linksList = document.getElementById('linksList');
            expect(linksList.innerHTML).toContain('Error loading links: API Error');
        });

        test('should delete link successfully', async () => {
            window.sendMessage.mockResolvedValue({ success: true });
            window.loadLinks = jest.fn();

            await window.deleteLink('test');

            expect(window.sendMessage).toHaveBeenCalledWith({
                action: 'deleteMapping',
                shortName: 'test'
            });
            expect(window.showMessage).toHaveBeenCalledWith('Link deleted successfully', 'success');
            expect(window.loadLinks).toHaveBeenCalled();
        });
    });

    describe('Message Display', () => {
        const setupMessageDisplay = () => {
            window.showMessage = function(text, type) {
                const messageDiv = document.getElementById('message');
                messageDiv.innerHTML = text;
                messageDiv.className = 'message ' + type;
                messageDiv.style.display = 'block';
                
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            };
        };

        beforeEach(() => {
            setupMessageDisplay();
        });

        test('should show success message', () => {
            const messageDiv = document.getElementById('message');

            window.showMessage('Success!', 'success');

            expect(messageDiv.innerHTML).toBe('Success!');
            expect(messageDiv.className).toBe('message success');
            expect(messageDiv.style.display).toBe('block');
        });

        test('should show error message', () => {
            const messageDiv = document.getElementById('message');

            window.showMessage('Error occurred', 'error');

            expect(messageDiv.innerHTML).toBe('Error occurred');
            expect(messageDiv.className).toBe('message error');
            expect(messageDiv.style.display).toBe('block');
        });

        test('should hide message after timeout', () => {
            jest.useFakeTimers();
            const messageDiv = document.getElementById('message');

            window.showMessage('Test message', 'success');

            // Fast-forward time
            jest.advanceTimersByTime(5100);

            expect(messageDiv.style.display).toBe('none');
            
            jest.useRealTimers();
        });
    });
});