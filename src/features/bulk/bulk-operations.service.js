/**
 * Bulk Operations Service
 * Handle multi-select and batch operations on credentials
 */

import { stateManager } from '../../core/state.js';
import { credentialsService } from '../credentials/credentials.service.js';
import { sitesService } from '../sites/sites.service.js';
import { toast } from '../../shared/components/toast.js';

class BulkOperationsService {
  constructor() {
    this.selectedItems = new Set();
    this.isSelectionMode = false;
    this.listeners = [];
  }

  /**
   * Initialize bulk operations
   */
  init() {
    this.attachEventListeners();
    console.log('✅ Bulk operations initialized');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Listen for state changes to update selection UI
    stateManager.on('state:changed', () => {
      if (this.isSelectionMode) {
        this.updateSelectionUI();
      }
    });
  }

  /**
   * Toggle selection mode
   */
  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    
    if (this.isSelectionMode) {
      this.enterSelectionMode();
    } else {
      this.exitSelectionMode();
    }
  }

  /**
   * Enter selection mode
   */
  enterSelectionMode() {
    this.isSelectionMode = true;
    this.selectedItems.clear();
    this.showBulkToolbar();
    this.addCheckboxesToCredentials();
    toast.info('Selection mode enabled. Click credentials to select.');
  }

  /**
   * Exit selection mode
   */
  exitSelectionMode() {
    this.isSelectionMode = false;
    this.selectedItems.clear();
    this.hideBulkToolbar();
    this.removeCheckboxesFromCredentials();
  }

  /**
   * Add checkboxes to all credential cards
   */
  addCheckboxesToCredentials() {
    const credentials = document.querySelectorAll('.credential-card');
    
    credentials.forEach(card => {
      if (card.querySelector('.bulk-select-checkbox')) return;
      
      const siteId = card.closest('[data-site-id]')?.dataset.siteId;
      const credentialId = card.querySelector('[data-credential-id]')?.dataset.credentialId;
      
      if (!siteId || !credentialId) return;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'bulk-select-checkbox';
      checkbox.dataset.siteId = siteId;
      checkbox.dataset.credentialId = credentialId;
      
      const itemKey = `${siteId}:${credentialId}`;
      checkbox.checked = this.selectedItems.has(itemKey);
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleItemSelection(siteId, credentialId, checkbox.checked);
      });
      
      const header = card.querySelector('.credential-card__header');
      if (header) {
        header.insertBefore(checkbox, header.firstChild);
      }
    });
    
    // Add visual indication of selection mode
    document.body.classList.add('bulk-selection-mode');
  }

  /**
   * Remove checkboxes from credentials
   */
  removeCheckboxesFromCredentials() {
    document.querySelectorAll('.bulk-select-checkbox').forEach(cb => cb.remove());
    document.body.classList.remove('bulk-selection-mode');
  }

  /**
   * Toggle item selection
   */
  toggleItemSelection(siteId, credentialId, selected) {
    const itemKey = `${siteId}:${credentialId}`;
    
    if (selected) {
      this.selectedItems.add(itemKey);
    } else {
      this.selectedItems.delete(itemKey);
    }
    
    this.updateBulkToolbar();
    this.updateSelectionUI();
  }

  /**
   * Select all visible credentials
   */
  selectAll() {
    const checkboxes = document.querySelectorAll('.bulk-select-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
      const itemKey = `${checkbox.dataset.siteId}:${checkbox.dataset.credentialId}`;
      this.selectedItems.add(itemKey);
    });
    
    this.updateBulkToolbar();
    this.updateSelectionUI();
    toast.success(`Selected ${this.selectedItems.size} items`);
  }

  /**
   * Deselect all credentials
   */
  selectNone() {
    const checkboxes = document.querySelectorAll('.bulk-select-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    this.selectedItems.clear();
    this.updateBulkToolbar();
    this.updateSelectionUI();
    toast.info('Selection cleared');
  }

  /**
   * Bulk check-in selected credentials
   */
  async bulkCheckIn() {
    if (this.selectedItems.size === 0) {
      toast.warning('No items selected');
      return;
    }
    
    let successCount = 0;
    
    this.selectedItems.forEach(itemKey => {
      const [siteId, credentialId] = itemKey.split(':');
      const success = credentialsService.checkInCredential(siteId, credentialId);
      if (success) successCount++;
    });
    
    toast.success(`Checked in ${successCount} credential${successCount !== 1 ? 's' : ''}`);
    this.exitSelectionMode();
  }

  /**
   * Bulk delete selected credentials
   */
  async bulkDelete() {
    if (this.selectedItems.size === 0) {
      toast.warning('No items selected');
      return;
    }
    
    const confirmed = confirm(
      `Delete ${this.selectedItems.size} credential${this.selectedItems.size !== 1 ? 's' : ''}? This cannot be undone.`
    );
    
    if (!confirmed) return;
    
    let successCount = 0;
    
    this.selectedItems.forEach(itemKey => {
      const [siteId, credentialId] = itemKey.split(':');
      const site = sitesService.getSite(siteId);
      
      if (site) {
        site.credentials = site.credentials.filter(c => c.id !== credentialId);
        stateManager.updateSite(siteId, { credentials: site.credentials });
        successCount++;
      }
    });
    
    toast.success(`Deleted ${successCount} credential${successCount !== 1 ? 's' : ''}`);
    this.exitSelectionMode();
  }

  /**
   * Bulk add tags to selected credentials
   */
  async bulkAddTags() {
    if (this.selectedItems.size === 0) {
      toast.warning('No items selected');
      return;
    }
    
    const tagsInput = prompt('Enter tags (comma-separated):');
    if (!tagsInput) return;
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    if (tags.length === 0) return;
    
    let successCount = 0;
    
    this.selectedItems.forEach(itemKey => {
      const [siteId] = itemKey.split(':');
      const site = sitesService.getSite(siteId);
      
      if (site) {
        const existingTags = site.tags || [];
        const newTags = [...new Set([...existingTags, ...tags])];
        stateManager.updateSite(siteId, { tags: newTags });
        successCount++;
      }
    });
    
    toast.success(`Added tags to ${successCount} site${successCount !== 1 ? 's' : ''}`);
    this.exitSelectionMode();
  }

  /**
   * Show bulk operations toolbar
   */
  showBulkToolbar() {
    const existingToolbar = document.getElementById('bulk-toolbar');
    if (existingToolbar) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'bulk-toolbar';
    toolbar.className = 'bulk-toolbar';
    toolbar.innerHTML = `
      <div class="bulk-toolbar__content">
        <div class="bulk-toolbar__info">
          <span class="bulk-toolbar__count">0 selected</span>
          <button class="btn btn--ghost btn--tiny" id="bulk-select-all">Select All</button>
          <button class="btn btn--ghost btn--tiny" id="bulk-select-none">Clear</button>
        </div>
        <div class="bulk-toolbar__actions">
          <button class="btn btn--primary btn--sm" id="bulk-check-in">
            ✓ Check In Selected
          </button>
          <button class="btn btn--ghost btn--sm" id="bulk-add-tags">
            🏷️ Add Tags
          </button>
          <button class="btn btn--danger btn--sm" id="bulk-delete">
            🗑️ Delete Selected
          </button>
          <button class="btn btn--ghost btn--sm" id="bulk-exit">
            ✕ Exit Selection
          </button>
        </div>
      </div>
    `;
    
    const toolbar_section = document.querySelector('.toolbar');
    if (toolbar_section) {
      toolbar_section.insertAdjacentElement('afterend', toolbar);
    }
    
    // Attach event listeners
    document.getElementById('bulk-select-all')?.addEventListener('click', () => this.selectAll());
    document.getElementById('bulk-select-none')?.addEventListener('click', () => this.selectNone());
    document.getElementById('bulk-check-in')?.addEventListener('click', () => this.bulkCheckIn());
    document.getElementById('bulk-add-tags')?.addEventListener('click', () => this.bulkAddTags());
    document.getElementById('bulk-delete')?.addEventListener('click', () => this.bulkDelete());
    document.getElementById('bulk-exit')?.addEventListener('click', () => this.exitSelectionMode());
  }

  /**
   * Hide bulk operations toolbar
   */
  hideBulkToolbar() {
    const toolbar = document.getElementById('bulk-toolbar');
    if (toolbar) {
      toolbar.remove();
    }
  }

  /**
   * Update bulk toolbar with selection count
   */
  updateBulkToolbar() {
    const countElement = document.querySelector('.bulk-toolbar__count');
    if (countElement) {
      countElement.textContent = `${this.selectedItems.size} selected`;
    }
    
    // Enable/disable action buttons based on selection
    const actionButtons = document.querySelectorAll('#bulk-check-in, #bulk-add-tags, #bulk-delete');
    actionButtons.forEach(btn => {
      btn.disabled = this.selectedItems.size === 0;
    });
  }

  /**
   * Update selection UI
   */
  updateSelectionUI() {
    if (!this.isSelectionMode) return;
    
    // Update checkboxes to match selection state
    document.querySelectorAll('.bulk-select-checkbox').forEach(checkbox => {
      const itemKey = `${checkbox.dataset.siteId}:${checkbox.dataset.credentialId}`;
      checkbox.checked = this.selectedItems.has(itemKey);
    });
  }

  /**
   * Get selected items
   */
  getSelectedItems() {
    return Array.from(this.selectedItems).map(key => {
      const [siteId, credentialId] = key.split(':');
      return { siteId, credentialId };
    });
  }

  /**
   * Is selection mode active
   */
  isActive() {
    return this.isSelectionMode;
  }

  /**
   * Get selection count
   */
  getSelectionCount() {
    return this.selectedItems.size;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedItems.clear();
    this.updateBulkToolbar();
    this.updateSelectionUI();
  }

  /**
   * Destroy service
   */
  destroy() {
    this.exitSelectionMode();
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

// Export singleton instance
export const bulkOperations = new BulkOperationsService();