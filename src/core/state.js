/**
 * State Management
 * Central state management with event-driven updates
 */

import { CONFIG, EVENTS } from '../config.js';
import { storageService } from './storage.js';

class StateManager {
  constructor() {
    this.state = null;
    this.listeners = new Map();
    this.filters = {
      search: '',
      status: 'all',
      category: null,
      tags: []
    };
    this.viewMode = CONFIG.view.defaultMode;
  }

  /**
   * Initialize state
   */
  async init() {
    await storageService.init();
    this.state = storageService.getState();
    
    if (!this.state) {
      this.state = await storageService.initializeDefaultState();
    }

    this.emit(EVENTS.STATE_CHANGED, this.state);
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Update state
   */
  setState(updates) {
    this.state = {
      ...this.state,
      ...updates
    };
    storageService.setState(this.state);
    this.emit(EVENTS.STATE_CHANGED, this.state);
  }

  /**
   * Get all sites
   */
  getSites() {
    return this.state?.sites || [];
  }

  /**
   * Get filtered sites
   */
  getFilteredSites() {
    let sites = this.getSites();

    // Apply search filter
    if (this.filters.search) {
      const query = this.filters.search.toLowerCase();
      sites = sites.filter(site => {
        const searchText = [
          site.name,
          site.url,
          ...(site.tags || []),
          ...site.credentials.map(c => `${c.email} ${c.label}`)
        ].join(' ').toLowerCase();
        
        return searchText.includes(query);
      });
    }

    // Apply status filter
    if (this.filters.status !== 'all') {
      sites = sites.filter(site => {
        const hasCheckedIn = site.credentials.some(c => c.checkedInOn && this.isToday(c.checkedInOn));
        return this.filters.status === 'done' ? hasCheckedIn : !hasCheckedIn;
      });
    }

    // Apply category filter
    if (this.filters.category) {
      sites = sites.filter(site => site.category === this.filters.category);
    }

    // Apply tag filter
    if (this.filters.tags.length > 0) {
      sites = sites.filter(site => 
        this.filters.tags.some(tag => site.tags?.includes(tag))
      );
    }

    return sites;
  }

  /**
   * Get site by ID
   */
  getSite(id) {
    return storageService.getSite(id);
  }

  /**
   * Add site
   */
  addSite(siteData) {
    const newSite = storageService.addSite(siteData);
    this.state = storageService.getState();
    this.emit(EVENTS.SITE_ADDED, newSite);
    this.emit(EVENTS.STATE_CHANGED, this.state);
    return newSite;
  }

  /**
   * Update site
   */
  updateSite(id, updates) {
    const success = storageService.updateSite(id, updates);
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.SITE_UPDATED, { id, updates });
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Delete site
   */
  deleteSite(id) {
    const success = storageService.deleteSite(id);
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.SITE_DELETED, id);
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Check in credential
   */
  checkInCredential(siteId, credentialId) {
    const success = storageService.checkInCredential(siteId, credentialId);
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.CREDENTIAL_CHECKED, { siteId, credentialId });
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Reset credential
   */
  resetCredential(siteId, credentialId) {
    const success = storageService.resetCredential(siteId, credentialId);
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Reset all credentials
   */
  resetAllCredentials() {
    const success = storageService.resetAllCredentials();
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Mark all as done
   */
  markAllDone() {
    const sites = this.getSites();
    sites.forEach(site => {
      site.credentials.forEach(credential => {
        if (!credential.checkedInOn || !this.isToday(credential.checkedInOn)) {
          this.checkInCredential(site.id, credential.id);
        }
      });
    });
  }

  /**
   * Get categories
   */
  getCategories() {
    return this.state?.categories || [];
  }

  /**
   * Add category
   */
  addCategory(categoryData) {
    const newCategory = storageService.addCategory(categoryData);
    this.state = storageService.getState();
    this.emit(EVENTS.STATE_CHANGED, this.state);
    return newCategory;
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return this.state?.analytics || {};
  }

  /**
   * Get progress stats
   */
  getProgressStats() {
    const sites = this.getSites();
    let totalCredentials = 0;
    let checkedCredentials = 0;

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        totalCredentials++;
        if (credential.checkedInOn && this.isToday(credential.checkedInOn)) {
          checkedCredentials++;
        }
      });
    });

    const percentage = totalCredentials > 0 
      ? Math.round((checkedCredentials / totalCredentials) * 100) 
      : 0;

    return {
      total: totalCredentials,
      checked: checkedCredentials,
      percentage
    };
  }

  /**
   * Set filters
   */
  setFilters(filters) {
    this.filters = {
      ...this.filters,
      ...filters
    };
    this.emit(EVENTS.FILTER_CHANGED, this.filters);
  }

  /**
   * Clear filters
   */
  clearFilters() {
    this.filters = {
      search: '',
      status: 'all',
      category: null,
      tags: []
    };
    this.emit(EVENTS.FILTER_CHANGED, this.filters);
  }

  /**
   * Get current filters
   */
  getFilters() {
    return this.filters;
  }

  /**
   * Set view mode
   */
  setViewMode(mode) {
    this.viewMode = mode;
    this.emit(EVENTS.VIEW_CHANGED, mode);
  }

  /**
   * Get view mode
   */
  getViewMode() {
    return this.viewMode;
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.state?.settings || {};
  }

  /**
   * Update settings
   */
  updateSettings(updates) {
    if (!this.state) return false;

    this.state.settings = {
      ...this.state.settings,
      ...updates
    };

    storageService.setState(this.state);
    this.emit(EVENTS.STATE_CHANGED, this.state);
    return true;
  }

  /**
   * Export data
   */
  async exportData(format, options = {}) {
    const data = await storageService.exportData(
      format,
      options.includeHistory,
      options.encrypt,
      options.password
    );
    
    if (data) {
      this.emit(EVENTS.EXPORT_COMPLETED, { format, data });
    }
    
    return data;
  }

  /**
   * Import data
   */
  async importData(dataString, password = null) {
    const success = await storageService.importData(dataString, password);
    
    if (success) {
      this.state = storageService.getState();
      this.emit(EVENTS.IMPORT_COMPLETED);
      this.emit(EVENTS.STATE_CHANGED, this.state);
    }
    
    return success;
  }

  /**
   * Clear all data
   */
  clearAllData() {
    storageService.clearAllData();
    this.state = null;
    this.init();
  }

  /**
   * Check if date is today
   */
  isToday(dateString) {
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(dateString).toISOString().split('T')[0];
    return today === checkDate;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Get all tags
   */
  getAllTags() {
    const sites = this.getSites();
    const tagsSet = new Set();
    
    sites.forEach(site => {
      if (site.tags) {
        site.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }

  /**
   * Search sites
   */
  searchSites(query) {
    this.setFilters({ search: query });
    this.emit(EVENTS.SEARCH_PERFORMED, query);
    return this.getFilteredSites();
  }
}

// Export singleton instance
export const stateManager = new StateManager();