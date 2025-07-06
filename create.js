// create.js - Handle the create GoLink form

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('createForm');
  const shortNameInput = document.getElementById('shortName');
  const urlInput = document.getElementById('url');
  const descriptionInput = document.getElementById('description');
  const messageDiv = document.getElementById('message'); // eslint-disable-line no-unused-vars
  const cancelBtn = document.getElementById('cancelBtn');
  const existingMappingDiv = document.getElementById('existingMapping');
  const updateBtn = document.getElementById('updateBtn');
  const goToExistingBtn = document.getElementById('goToExistingBtn');

  // Check URL parameters for pre-filled short name
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledShortName = urlParams.get('shortName');

  if (prefilledShortName) {
    shortNameInput.value = prefilledShortName;
    // Check if mapping already exists
    checkExistingMapping(prefilledShortName);
  }

  // Form submission handler
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const shortName = shortNameInput.value.trim();
    const url = urlInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!shortName || !url) {
      showMessage('Please fill in both short name and URL', 'error');
      return;
    }

    if (!isValidUrl(url)) {
      showMessage(
        'Please enter a valid URL (must start with http:// or https://)',
        'error'
      );
      return;
    }

    if (!isValidShortName(shortName)) {
      showMessage(
        'Short name can only contain letters, numbers, hyphens, and underscores',
        'error'
      );
      return;
    }

    try {
      // Save the mapping
      const response = await sendMessage({
        action: 'saveMapping',
        shortName: shortName,
        url: url,
        description: description,
      });

      if (response.error) {
        showMessage(`Error: ${response.error}`, 'error');
      } else {
        showMessage(
          `GoLink created successfully! You can now use go/${shortName}`,
          'success'
        );

        // Redirect to the newly created URL after a short delay
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
      }
    } catch (error) {
      showMessage(`Error creating GoLink: ${error.message}`, 'error');
    }
  });

  // Cancel button handler
  cancelBtn.addEventListener('click', function () {
    // Try to go back, or close tab if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });

  // Update button handler for existing mappings
  updateBtn.addEventListener('click', function () {
    existingMappingDiv.classList.add('hidden');
    form.classList.remove('hidden');
    // Focus on URL field since short name is already filled
    urlInput.focus();
  });

  // Go to existing URL button handler
  goToExistingBtn.addEventListener('click', function () {
    const existingUrl = document.getElementById('existingUrl').textContent;
    if (existingUrl) {
      window.location.href = existingUrl;
    }
  });

  // Real-time validation for short name
  shortNameInput.addEventListener('input', function () {
    const shortName = this.value.trim();
    if (shortName && !isValidShortName(shortName)) {
      this.setCustomValidity(
        'Only letters, numbers, hyphens, and underscores allowed'
      );
    } else {
      this.setCustomValidity('');
    }
  });

  // Real-time validation for URL
  urlInput.addEventListener('input', function () {
    const url = this.value.trim();
    if (url && !isValidUrl(url)) {
      this.setCustomValidity(
        'Please enter a valid URL starting with http:// or https://'
      );
    } else {
      this.setCustomValidity('');
    }
  });

  // Check for existing mapping when short name changes
  shortNameInput.addEventListener('blur', function () {
    const shortName = this.value.trim();
    if (shortName && shortName !== prefilledShortName) {
      checkExistingMapping(shortName);
    }
  });
});

/**
 * Check if a mapping already exists for the given short name
 */
async function checkExistingMapping(shortName) {
  try {
    const response = await sendMessage({
      action: 'getMapping',
      shortName: shortName,
    });

    if (response && response.url) {
      // Show existing mapping section
      document.getElementById('existingShortName').textContent = shortName;
      document.getElementById('existingUrl').textContent = response.url;
      document.getElementById('existingDescription').textContent =
        response.description || 'No description';

      document.getElementById('existingMapping').classList.remove('hidden');
      document.getElementById('createForm').classList.add('hidden');
    } else {
      // Hide existing mapping section if no mapping found
      document.getElementById('existingMapping').classList.add('hidden');
      document.getElementById('createForm').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error checking existing mapping:', error);
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate short name format
 */
function isValidShortName(shortName) {
  return /^[a-zA-Z0-9-_]+$/.test(shortName);
}

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.classList.remove('hidden');

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.classList.add('hidden');
    }, 5000);
  }
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
