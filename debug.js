// debug.js - Debug interface for GoLinks extension

document.addEventListener('DOMContentLoaded', function () {
  const refreshBtn = document.getElementById('refreshBtn');
  const testSaveBtn = document.getElementById('testSaveBtn');
  const testGetBtn = document.getElementById('testGetBtn');
  const clearStorageBtn = document.getElementById('clearStorageBtn');

  // Initialize
  refreshData();

  // Event listeners
  refreshBtn.addEventListener('click', refreshData);
  testSaveBtn.addEventListener('click', testSave);
  testGetBtn.addEventListener('click', testGet);
  clearStorageBtn.addEventListener('click', clearStorage);

  async function refreshData() {
    console.log('=== DEBUG: Starting data refresh ===');
    
    // Update status
    updateStatus();
    
    // Update storage info
    await updateStorageInfo();
    
    // Update links table
    await updateLinksTable();
    
    // Update raw data
    await updateRawData();
    
    console.log('=== DEBUG: Data refresh complete ===');
  }

  function updateStatus() {
    const statusDiv = document.getElementById('statusInfo');
    const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
    
    let status = '<div class="success-info">';
    status += `<strong>Extension API:</strong> ${typeof browser !== 'undefined' ? 'Safari (browser)' : 'Chrome (chrome)'}<br>`;
    status += `<strong>Page URL:</strong> ${window.location.href}<br>`;
    status += `<strong>User Agent:</strong> ${navigator.userAgent}<br>`;
    status += `<strong>Extension ID:</strong> ${extensionAPI.runtime ? extensionAPI.runtime.id || 'Available' : 'Not Available'}`;
    status += '</div>';
    
    statusDiv.innerHTML = status;
  }

  async function updateStorageInfo() {
    const storageDiv = document.getElementById('storageInfo');
    
    try {
      console.log('DEBUG: Testing storage access...');
      
      // Test storage access
      const testResult = await sendMessage({ action: 'getAllMappings' });
      console.log('DEBUG: Storage test result:', testResult);
      
      if (testResult.error) {
        storageDiv.innerHTML = `<div class="error-info"><strong>Storage Error:</strong> ${testResult.error}</div>`;
      } else {
        const count = Object.keys(testResult).length;
        storageDiv.innerHTML = `<div class="success-info"><strong>Storage Status:</strong> OK<br><strong>Total GoLinks:</strong> ${count}</div>`;
      }
    } catch (error) {
      console.error('DEBUG: Storage test failed:', error);
      storageDiv.innerHTML = `<div class="error-info"><strong>Storage Test Failed:</strong> ${error.message}</div>`;
    }
  }

  async function updateLinksTable() {
    const linksDiv = document.getElementById('linksInfo');
    const tableDiv = document.getElementById('linksTable');
    
    try {
      console.log('DEBUG: Fetching all golinks...');
      
      const response = await sendMessage({ action: 'getAllMappings' });
      console.log('DEBUG: Fetched golinks:', response);
      
      if (response.error) {
        linksDiv.innerHTML = `<div class="error-info">Error loading links: ${response.error}</div>`;
        tableDiv.innerHTML = '';
        return;
      }

      const golinks = response || {};
      const count = Object.keys(golinks).length;
      
      if (count === 0) {
        linksDiv.innerHTML = '<div class="storage-info">No golinks found in storage</div>';
        tableDiv.innerHTML = '<div class="empty-state">📭 No saved golinks found</div>';
        return;
      }

      linksDiv.innerHTML = `<div class="success-info">Found ${count} saved golink${count !== 1 ? 's' : ''}</div>`;
      
      // Create table
      let tableHTML = `
        <table class="links-table">
          <thead>
            <tr>
              <th>Short Name</th>
              <th>Target URL</th>
              <th>Description</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      // Sort entries by short name
      const sortedEntries = Object.entries(golinks).sort(([a], [b]) => a.localeCompare(b));
      
      sortedEntries.forEach(([shortName, mapping]) => {
        const createdDate = mapping.createdAt ? new Date(mapping.createdAt).toLocaleString() : 'Unknown';
        const description = mapping.description || '—';
        
        tableHTML += `
          <tr>
            <td><span class="go-link">go/${shortName}</span></td>
            <td><a href="${mapping.url}" target="_blank" class="url-link">${mapping.url}</a></td>
            <td>${description}</td>
            <td>${createdDate}</td>
          </tr>
        `;
      });
      
      tableHTML += '</tbody></table>';
      tableDiv.innerHTML = tableHTML;
      
    } catch (error) {
      console.error('DEBUG: Failed to fetch links:', error);
      linksDiv.innerHTML = `<div class="error-info">Exception: ${error.message}</div>`;
      tableDiv.innerHTML = '';
    }
  }

  async function updateRawData() {
    const rawDataDiv = document.getElementById('rawDataInfo');
    const rawDataPre = document.getElementById('rawData');
    
    try {
      console.log('DEBUG: Fetching raw storage data...');
      
      const response = await sendMessage({ action: 'getAllMappings' });
      console.log('DEBUG: Raw storage response:', response);
      
      if (response.error) {
        rawDataDiv.innerHTML = `<div class="error-info">Error accessing raw data: ${response.error}</div>`;
        rawDataPre.textContent = '';
        return;
      }

      rawDataDiv.innerHTML = '<div class="success-info">Raw storage data retrieved successfully</div>';
      rawDataPre.textContent = JSON.stringify(response, null, 2);
      
    } catch (error) {
      console.error('DEBUG: Failed to fetch raw data:', error);
      rawDataDiv.innerHTML = `<div class="error-info">Exception: ${error.message}</div>`;
      rawDataPre.textContent = `Error: ${error.message}`;
    }
  }

  async function testSave() {
    console.log('DEBUG: Testing save operation...');
    
    const testShortName = 'debug-test-' + Date.now();
    const testUrl = 'https://example.com/debug-test';
    const testDescription = 'Debug test link created at ' + new Date().toLocaleString();
    
    try {
      const response = await sendMessage({
        action: 'saveMapping',
        shortName: testShortName,
        url: testUrl,
        description: testDescription
      });
      
      console.log('DEBUG: Test save response:', response);
      
      if (response.error) {
        alert(`Test save failed: ${response.error}`);
      } else {
        alert(`Test save successful! Created go/${testShortName}`);
        refreshData(); // Refresh to show new data
      }
    } catch (error) {
      console.error('DEBUG: Test save exception:', error);
      alert(`Test save exception: ${error.message}`);
    }
  }

  async function testGet() {
    console.log('DEBUG: Testing get operation...');
    
    try {
      const response = await sendMessage({ action: 'getAllMappings' });
      console.log('DEBUG: Test get response:', response);
      
      if (response.error) {
        alert(`Test get failed: ${response.error}`);
      } else {
        const count = Object.keys(response).length;
        alert(`Test get successful! Found ${count} golinks`);
      }
    } catch (error) {
      console.error('DEBUG: Test get exception:', error);
      alert(`Test get exception: ${error.message}`);
    }
  }

  async function clearStorage() {
    if (!confirm('Are you sure you want to clear ALL golinks? This cannot be undone!')) {
      return;
    }
    
    console.log('DEBUG: Clearing storage...');
    
    try {
      // Clear by setting empty golinks object
      const response = await sendMessage({
        action: 'saveMapping',
        shortName: '__clear__',
        url: 'about:blank',
        description: 'Clear operation'
      });
      
      // Then delete the clear entry
      await sendMessage({
        action: 'deleteMapping',
        shortName: '__clear__'
      });
      
      alert('Storage cleared successfully');
      refreshData();
    } catch (error) {
      console.error('DEBUG: Clear storage exception:', error);
      alert(`Clear storage failed: ${error.message}`);
    }
  }

  /**
   * Send message to background script
   */
  function sendMessage(message) {
    // Cross-browser API compatibility
    const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;
    
    console.log('DEBUG: Sending message:', message);
    
    return new Promise((resolve, reject) => {
      extensionAPI.runtime.sendMessage(message, response => {
        console.log('DEBUG: Message response:', response);
        
        if (extensionAPI.runtime.lastError) {
          console.error('DEBUG: Message error:', extensionAPI.runtime.lastError);
          reject(new Error(extensionAPI.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
});