// popup.js - Handle the popup interface for managing GoLinks

document.addEventListener('DOMContentLoaded', function () {
  // Elements
  const addNewBtn = document.getElementById('addNewBtn');
  const createFirstBtn = document.getElementById('createFirstBtn');
  const searchInput = document.getElementById('searchInput');
  const linksList = document.getElementById('linksList');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const emptyState = document.getElementById('emptyState');
  const linkCount = document.getElementById('linkCount');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  // Modal elements
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const closeModal = document.getElementById('closeModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const editShortName = document.getElementById('editShortName');
  const editUrl = document.getElementById('editUrl');
  const editDescription = document.getElementById('editDescription');

  let allMappings = {};
  let filteredMappings = {};
  let currentEditingShortName = null;

  // Initialize
  loadMappings();

  // Event listeners
  addNewBtn.addEventListener('click', openCreatePage);
  createFirstBtn.addEventListener('click', openCreatePage);
  searchInput.addEventListener('input', handleSearch);
  exportBtn.addEventListener('click', exportMappings);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importMappings);

  // Modal event listeners
  closeModal.addEventListener('click', closeEditModal);
  cancelEdit.addEventListener('click', closeEditModal);
  editForm.addEventListener('submit', handleEditSubmit);

  // Close modal when clicking outside
  editModal.addEventListener('click', e => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  /**
   * Load all mappings from storage
   */
  async function loadMappings() {
    try {
      const response = await sendMessage({ action: 'getAllMappings' });

      if (response.error) {
        console.error('Error loading mappings:', response.error);
        showEmptyState();
        return;
      }

      allMappings = response || {};
      filteredMappings = { ...allMappings };
      renderMappings();
    } catch (error) {
      console.error('Error loading mappings:', error);
      showEmptyState();
    }
  }

  /**
   * Render the mappings list
   */
  function renderMappings() {
    loadingSpinner.classList.add('hidden');

    const mappingCount = Object.keys(filteredMappings).length;

    if (mappingCount === 0) {
      showEmptyState();
      return;
    }

    // Show links list
    emptyState.classList.add('hidden');
    linksList.classList.remove('hidden');

    // Update count
    linkCount.textContent = `${mappingCount} link${mappingCount !== 1 ? 's' : ''}`;

    // Clear existing content
    while (linksList.firstChild) {
      linksList.removeChild(linksList.firstChild);
    }

    // Sort mappings by short name
    const sortedEntries = Object.entries(filteredMappings).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    // Render each mapping
    sortedEntries.forEach(([shortName, mapping]) => {
      const linkItem = createLinkItem(shortName, mapping);
      linksList.appendChild(linkItem);
    });
  }

  /**
   * Create a link item element
   */
  function createLinkItem(shortName, mapping) {
    const item = document.createElement('div');
    item.className = 'link-item';

    // Create link info section
    const linkInfo = document.createElement('div');
    linkInfo.className = 'link-info';

    // Create short name element
    const linkShortName = document.createElement('div');
    linkShortName.className = 'link-short-name';
    const goPrefix = document.createElement('span');
    goPrefix.className = 'go-prefix';
    goPrefix.textContent = 'go/';
    linkShortName.appendChild(goPrefix);
    linkShortName.appendChild(document.createTextNode(shortName));

    // Create URL element
    const linkUrl = document.createElement('div');
    linkUrl.className = 'link-url';
    linkUrl.title = mapping.url;
    linkUrl.textContent = mapping.url;

    linkInfo.appendChild(linkShortName);
    linkInfo.appendChild(linkUrl);

    // Create description element if exists
    if (mapping.description) {
      const linkDescription = document.createElement('div');
      linkDescription.className = 'link-description';
      linkDescription.textContent = mapping.description;
      linkInfo.appendChild(linkDescription);
    }

    // Create actions section
    const linkActions = document.createElement('div');
    linkActions.className = 'link-actions';

    // Create action buttons
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-icon';
    copyBtn.title = `Copy go/${shortName}`;
    copyBtn.dataset.action = 'copy';
    copyBtn.dataset.shortName = shortName;
    copyBtn.textContent = '📋';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn-icon';
    openBtn.title = `Open ${mapping.url}`;
    openBtn.dataset.action = 'open';
    openBtn.dataset.url = mapping.url;
    openBtn.textContent = '🔗';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.shortName = shortName;
    editBtn.textContent = '✏️';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon btn-danger';
    deleteBtn.title = 'Delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.shortName = shortName;
    deleteBtn.textContent = '🗑️';

    linkActions.appendChild(copyBtn);
    linkActions.appendChild(openBtn);
    linkActions.appendChild(editBtn);
    linkActions.appendChild(deleteBtn);

    item.appendChild(linkInfo);
    item.appendChild(linkActions);

    // Add click handlers for buttons
    item.addEventListener('click', handleLinkItemClick);

    return item;
  }

  /**
   * Handle clicks on link item buttons
   */
  function handleLinkItemClick(e) {
    if (!e.target.dataset.action) return;

    e.preventDefault();
    e.stopPropagation();

    const action = e.target.dataset.action;
    const shortName = e.target.dataset.shortName;
    const url = e.target.dataset.url;

    switch (action) {
      case 'copy':
        copyToClipboard(`go/${shortName}`);
        break;
      case 'open':
        chrome.tabs.create({ url: url });
        window.close();
        break;
      case 'edit':
        openEditModal(shortName);
        break;
      case 'delete':
        deleteMapping(shortName);
        break;
    }
  }

  /**
   * Handle search input
   */
  function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
      filteredMappings = { ...allMappings };
    } else {
      filteredMappings = {};
      Object.entries(allMappings).forEach(([shortName, mapping]) => {
        if (
          shortName.toLowerCase().includes(query) ||
          mapping.url.toLowerCase().includes(query) ||
          (mapping.description &&
            mapping.description.toLowerCase().includes(query))
        ) {
          filteredMappings[shortName] = mapping;
        }
      });
    }

    renderMappings();
  }

  /**
   * Open the create page
   */
  function openCreatePage() {
    chrome.tabs.create({ url: chrome.runtime.getURL('create.html') });
    window.close();
  }

  /**
   * Show empty state
   */
  function showEmptyState() {
    loadingSpinner.classList.add('hidden');
    linksList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    linkCount.textContent = '0 links';
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a brief success message here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Delete a mapping
   */
  async function deleteMapping(shortName) {
    if (!confirm(`Are you sure you want to delete go/${shortName}?`)) {
      return;
    }

    try {
      const response = await sendMessage({
        action: 'deleteMapping',
        shortName: shortName,
      });

      if (response.error) {
        alert(`Error deleting mapping: ${response.error}`);
      } else {
        // Remove from local data and re-render
        delete allMappings[shortName];
        delete filteredMappings[shortName];
        renderMappings();
      }
    } catch (error) {
      alert(`Error deleting mapping: ${error.message}`);
    }
  }

  /**
   * Open edit modal
   */
  function openEditModal(shortName) {
    const mapping = allMappings[shortName];
    if (!mapping) return;

    currentEditingShortName = shortName;
    editShortName.value = shortName;
    editUrl.value = mapping.url;
    editDescription.value = mapping.description || '';

    editModal.classList.remove('hidden');
    editUrl.focus();
  }

  /**
   * Close edit modal
   */
  function closeEditModal() {
    editModal.classList.add('hidden');
    currentEditingShortName = null;
    editForm.reset();
  }

  /**
   * Handle edit form submission
   */
  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!currentEditingShortName) return;

    const url = editUrl.value.trim();
    const description = editDescription.value.trim();

    if (!url || !isValidUrl(url)) {
      alert('Please enter a valid URL');
      return;
    }

    try {
      const response = await sendMessage({
        action: 'saveMapping',
        shortName: currentEditingShortName,
        url: url,
        description: description,
      });

      if (response.error) {
        alert(`Error updating mapping: ${response.error}`);
      } else {
        // Update local data and re-render
        allMappings[currentEditingShortName] = response;
        filteredMappings[currentEditingShortName] = response;
        renderMappings();
        closeEditModal();
      }
    } catch (error) {
      alert(`Error updating mapping: ${error.message}`);
    }
  }

  /**
   * Export mappings to JSON file
   */
  async function exportMappings() {
    const data = {
      version: '1.0',
      exported: new Date().toISOString(),
      mappings: allMappings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `golinks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import mappings from JSON file
   */
  async function importMappings(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.mappings) {
        alert('Invalid file format. Expected a GoLinks export file.');
        return;
      }

      const importCount = Object.keys(data.mappings).length;
      if (
        !confirm(
          `Import ${importCount} mappings? This will overwrite any existing mappings with the same names.`
        )
      ) {
        return;
      }

      // Save all mappings
      for (const [shortName, mapping] of Object.entries(data.mappings)) {
        await sendMessage({
          action: 'saveMapping',
          shortName: shortName,
          url: mapping.url,
          description: mapping.description || '',
        });
      }

      // Reload mappings
      await loadMappings();
      alert(`Successfully imported ${importCount} mappings!`);
    } catch (error) {
      alert(`Error importing file: ${error.message}`);
    } finally {
      // Reset file input
      importFile.value = '';
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
});
