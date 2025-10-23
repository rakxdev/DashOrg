/**
 * Storage Service
 * Handles localStorage, sessionStorage, and IndexedDB operations
 */

import { CONFIG } from '../config.js';
import { cryptoService } from './crypto.js';
import { safeLocalStorage } from '../shared/constants.js';

class StorageService {
  constructor() {
    this.storageKey = CONFIG.app.storageKey;
    this.credentialsKey = CONFIG.app.credentialsKey;
    this.historyKey = CONFIG.app.historyKey;
    this.encryptionEnabled = CONFIG.security.masterPasswordEnabled;
    this.masterPassword = null;
  }

  /**
   * Initialize storage
   */
  async init() {
    // Check if this is first run
    const existingData = this.getState();
    if (!existingData) {
      await this.initializeDefaultState();
    }
    
    // Check for daily reset
    await this.checkDailyReset();
  }

  /**
   * Initialize default state
   */
  async initializeDefaultState() {
    const defaultState = {
      version: CONFIG.app.version,
      lastReset: new Date().toISOString().split('T')[0],
      settings: {
        theme: CONFIG.theme.default,
        viewMode: CONFIG.view.defaultMode,
        autoReset: CONFIG.reset.autoReset,
        resetTime: CONFIG.reset.resetTime,
        notifications: CONFIG.notifications,
        security: CONFIG.security,
        display: CONFIG.view
      },
      categories: CONFIG.defaultCategories.map((cat, index) => ({
        id: this.generateId(),
        ...cat,
        order: index
      })),
      sites: [],
      analytics: {
        totalCheckIns: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageDaily: 0,
        sitesAdded: 0,
        sitesArchived: 0,
        lastCheckIn: null
      }
    };

    this.setState(defaultState);
    return defaultState;
  }

  /**
   * Get current state
   */
  getState() {
    try {
      const data = safeLocalStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading state:', error);
      return null;
    }
  }

  /**
   * Set state
   */
  setState(state) {
    try {
      safeLocalStorage.setItem(this.storageKey, JSON.stringify(state));
      this.dispatchStorageEvent('stateChanged', state);
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  /**
   * Update state partially
   */
  updateState(updates) {
    const currentState = this.getState();
    if (!currentState) return false;

    const newState = {
      ...currentState,
      ...updates
    };

    return this.setState(newState);
  }

  /**
   * Get all sites
   */
  getSites() {
    const state = this.getState();
    return state?.sites || [];
  }

  /**
   * Get site by ID
   */
  getSite(id) {
    const sites = this.getSites();
    return sites.find(site => site.id === id);
  }

  /**
   * Add new site
   */
  addSite(siteData) {
    const state = this.getState();
    if (!state) return null;

    const newSite = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...siteData
    };

    state.sites.push(newSite);
    state.analytics.sitesAdded++;
    
    this.setState(state);
    this.dispatchStorageEvent('siteAdded', newSite);
    
    return newSite;
  }

  /**
   * Update site
   */
  updateSite(id, updates) {
    const state = this.getState();
    if (!state) return false;

    const siteIndex = state.sites.findIndex(site => site.id === id);
    if (siteIndex === -1) return false;

    state.sites[siteIndex] = {
      ...state.sites[siteIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.setState(state);
    this.dispatchStorageEvent('siteUpdated', state.sites[siteIndex]);
    
    return true;
  }

  /**
   * Delete site
   */
  deleteSite(id) {
    const state = this.getState();
    if (!state) return false;

    const siteIndex = state.sites.findIndex(site => site.id === id);
    if (siteIndex === -1) return false;

    const deletedSite = state.sites[siteIndex];
    state.sites.splice(siteIndex, 1);
    state.analytics.sitesArchived++;

    this.setState(state);
    this.dispatchStorageEvent('siteDeleted', deletedSite);
    
    return true;
  }

  /**
   * Check in credential
   */
  checkInCredential(siteId, credentialId) {
    const state = this.getState();
    if (!state) return false;

    const site = state.sites.find(s => s.id === siteId);
    if (!site) return false;

    const credential = site.credentials.find(c => c.id === credentialId);
    if (!credential) return false;

    const now = new Date().toISOString();
    credential.checkedInOn = now;

    // Add to history if enabled
    if (CONFIG.features.checkInHistory) {
      if (!credential.checkInHistory) credential.checkInHistory = [];
      credential.checkInHistory.unshift({
        timestamp: now,
        device: this.getDeviceInfo()
      });

      // Keep only recent history
      if (credential.checkInHistory.length > CONFIG.limits.maxHistoryEntries) {
        credential.checkInHistory = credential.checkInHistory.slice(0, CONFIG.limits.maxHistoryEntries);
      }
    }

    // Update analytics
    state.analytics.totalCheckIns++;
    state.analytics.lastCheckIn = now;
    
    this.updateStreak(state);
    this.setState(state);
    this.dispatchStorageEvent('credentialChecked', { siteId, credentialId });

    return true;
  }

  /**
   * Reset credential for the day
   */
  resetCredential(siteId, credentialId) {
    const state = this.getState();
    if (!state) return false;

    const site = state.sites.find(s => s.id === siteId);
    if (!site) return false;

    const credential = site.credentials.find(c => c.id === credentialId);
    if (!credential) return false;

    credential.checkedInOn = null;

    this.setState(state);
    return true;
  }

  /**
   * Reset all credentials for the day
   */
  resetAllCredentials() {
    const state = this.getState();
    if (!state) return false;

    state.sites.forEach(site => {
      site.credentials.forEach(credential => {
        credential.checkedInOn = null;
      });
    });

    state.lastReset = new Date().toISOString().split('T')[0];
    this.setState(state);
    this.dispatchStorageEvent('allCredentialsReset');

    return true;
  }

  /**
   * Check if daily reset is needed
   */
  async checkDailyReset() {
    const state = this.getState();
    if (!state || !state.settings.autoReset) return;

    const today = new Date().toISOString().split('T')[0];
    if (state.lastReset !== today) {
      this.resetAllCredentials();
    }
  }

  /**
   * Update streak analytics
   */
  updateStreak(state) {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = state.analytics.lastCheckIn;

    if (!lastCheckIn) {
      state.analytics.currentStreak = 1;
      return;
    }

    const lastDate = new Date(lastCheckIn).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === yesterday) {
      state.analytics.currentStreak++;
    } else if (lastDate !== today) {
      state.analytics.currentStreak = 1;
    }

    if (state.analytics.currentStreak > state.analytics.longestStreak) {
      state.analytics.longestStreak = state.analytics.currentStreak;
    }
  }

  /**
   * Get categories
   */
  getCategories() {
    const state = this.getState();
    return state?.categories || [];
  }

  /**
   * Add category
   */
  addCategory(categoryData) {
    const state = this.getState();
    if (!state) return null;

    const newCategory = {
      id: this.generateId(),
      order: state.categories.length,
      ...categoryData
    };

    state.categories.push(newCategory);
    this.setState(state);

    return newCategory;
  }

  /**
   * Export data
   */
  async exportData(format = 'json', includeHistory = true, encrypt = false, password = null) {
    const state = this.getState();
    if (!state) return null;

    let data = {
      ...state,
      exportedAt: new Date().toISOString(),
      version: CONFIG.app.version
    };

    if (!includeHistory) {
      data.sites = data.sites.map(site => ({
        ...site,
        credentials: site.credentials.map(cred => ({
          ...cred,
          checkInHistory: []
        }))
      }));
    }

    if (encrypt && password) {
      data = await cryptoService.encrypt(data, password);
      return JSON.stringify(data, null, 2);
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return null;
  }

  /**
   * Import data
   */
  async importData(dataString, password = null) {
    try {
      let data = JSON.parse(dataString);

      // Check if encrypted
      if (data.algorithm && password) {
        data = await cryptoService.decrypt(data, password);
      }

      // Validate data structure
      if (!data.sites || !Array.isArray(data.sites)) {
        throw new Error('Invalid data format');
      }

      // Merge or replace
      const state = this.getState();
      const merged = {
        ...state,
        sites: [...state.sites, ...data.sites],
        categories: data.categories || state.categories
      };

      this.setState(merged);
      this.dispatchStorageEvent('dataImported', data);

      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  /**
   * Convert to CSV format
   */
  convertToCSV(data) {
    const rows = [['Site Name', 'URL', 'Category', 'Email', 'Label', 'Tags']];

    data.sites.forEach(site => {
      site.credentials.forEach(cred => {
        rows.push([
          site.name,
          site.url,
          site.category || '',
          cred.email,
          cred.label,
          (site.tags || []).join(';')
        ]);
      });
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Clear all data
   */
  clearAllData() {
    safeLocalStorage.removeItem(this.storageKey);
    safeLocalStorage.removeItem(this.credentialsKey);
    sessionStorage.clear();
    this.dispatchStorageEvent('dataCleared');
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    return `${navigator.userAgent.split(' ').pop()} on ${navigator.platform}`;
  }

  /**
   * Dispatch custom storage events
   */
  dispatchStorageEvent(type, detail = null) {
    window.dispatchEvent(new CustomEvent(`storage:${type}`, { detail }));
  }

  /**
   * Get storage size
   */
  getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  }
}

// Export singleton instance
export const storageService = new StorageService();