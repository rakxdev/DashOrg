/**
 * Data Schema Migrations
 * Handles version upgrades and data transformations
 */

import { CONFIG } from '../config.js';

class MigrationService {
  constructor() {
    this.currentVersion = CONFIG.app.version;
    this.migrations = [
      { version: '1.0.0', migrate: this.migrateTo1_0_0.bind(this) },
      { version: '2.0.0', migrate: this.migrateTo2_0_0.bind(this) }
    ];
  }

  /**
   * Check if migration is needed
   */
  needsMigration(data) {
    if (!data || !data.version) return true;
    return this.compareVersions(data.version, this.currentVersion) < 0;
  }

  /**
   * Run all necessary migrations
   */
  async migrate(data) {
    if (!data) return null;

    let migratedData = { ...data };
    const dataVersion = data.version || '0.0.0';

    // Run each migration in sequence if needed
    for (const migration of this.migrations) {
      if (this.compareVersions(dataVersion, migration.version) < 0) {
        console.log(`Migrating to version ${migration.version}...`);
        migratedData = await migration.migrate(migratedData);
        migratedData.version = migration.version;
      }
    }

    return migratedData;
  }

  /**
   * Migration to version 1.0.0
   * Initial structure
   */
  async migrateTo1_0_0(data) {
    return {
      version: '1.0.0',
      lastReset: new Date().toISOString().split('T')[0],
      settings: data.settings || {},
      categories: data.categories || [],
      sites: data.sites || [],
      analytics: {
        totalCheckIns: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageDaily: 0,
        sitesAdded: data.sites?.length || 0,
        sitesArchived: 0
      }
    };
  }

  /**
   * Migration to version 2.0.0
   * Add enhanced features
   */
  async migrateTo2_0_0(data) {
    const migrated = { ...data };

    // Add settings if missing
    if (!migrated.settings) {
      migrated.settings = {};
    }

    migrated.settings = {
      theme: migrated.settings.theme || 'auto',
      viewMode: migrated.settings.viewMode || 'grid',
      autoReset: migrated.settings.autoReset !== false,
      resetTime: migrated.settings.resetTime || '00:00',
      notifications: migrated.settings.notifications || {
        enabled: true,
        reminderTime: '09:00',
        staleDays: 7
      },
      security: migrated.settings.security || {
        masterPasswordEnabled: false,
        autoLockMinutes: 15,
        clipboardClearSeconds: 30,
        requireAuthOnStart: false
      },
      display: migrated.settings.display || {
        density: 'comfortable',
        cardsPerRow: 'auto',
        showFavicons: true,
        showLastCheckin: true
      }
    };

    // Update sites structure
    if (migrated.sites) {
      migrated.sites = migrated.sites.map(site => ({
        ...site,
        favicon: site.favicon || this.getFaviconFromUrl(site.url),
        priority: site.priority || 0,
        color: site.color || '#3b82f6',
        metadata: site.metadata || {
          loginFrequency: 'daily',
          importance: 'normal',
          lastIssue: null,
          averageCheckInTime: '09:00'
        },
        credentials: (site.credentials || []).map(cred => ({
          ...cred,
          customFields: cred.customFields || [],
          checkInHistory: cred.checkInHistory || [],
          lastPasswordChange: cred.lastPasswordChange || site.createdAt,
          passwordExpiry: cred.passwordExpiry || null,
          strength: cred.strength || 'unknown',
          breached: cred.breached || false
        }))
      }));
    }

    // Ensure analytics exists
    if (!migrated.analytics) {
      migrated.analytics = {
        totalCheckIns: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageDaily: 0,
        sitesAdded: migrated.sites?.length || 0,
        sitesArchived: 0,
        lastCheckIn: null
      };
    }

    return migrated;
  }

  /**
   * Compare version strings
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * Get favicon URL from site URL
   */
  getFaviconFromUrl(url) {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return null;
    }
  }

  /**
   * Backup data before migration
   */
  createBackup(data) {
    const backup = {
      data,
      timestamp: new Date().toISOString(),
      version: data.version || 'unknown'
    };

    try {
      const backups = JSON.parse(localStorage.getItem('accc-backups') || '[]');
      backups.unshift(backup);
      
      // Keep only last 5 backups
      if (backups.length > 5) {
        backups.length = 5;
      }

      localStorage.setItem('accc-backups', JSON.stringify(backups));
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  restoreBackup(index = 0) {
    try {
      const backups = JSON.parse(localStorage.getItem('accc-backups') || '[]');
      if (backups[index]) {
        return backups[index].data;
      }
      return null;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return null;
    }
  }

  /**
   * Get all backups
   */
  getBackups() {
    try {
      return JSON.parse(localStorage.getItem('accc-backups') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Validate data structure
   */
  validateData(data) {
    const errors = [];

    if (!data) {
      errors.push('Data is null or undefined');
      return { valid: false, errors };
    }

    if (!data.sites || !Array.isArray(data.sites)) {
      errors.push('Sites must be an array');
    }

    if (!data.categories || !Array.isArray(data.categories)) {
      errors.push('Categories must be an array');
    }

    if (data.sites) {
      data.sites.forEach((site, index) => {
        if (!site.id) errors.push(`Site ${index} missing ID`);
        if (!site.name) errors.push(`Site ${index} missing name`);
        if (!site.url) errors.push(`Site ${index} missing URL`);
        if (!site.credentials || !Array.isArray(site.credentials)) {
          errors.push(`Site ${index} credentials must be an array`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Repair corrupted data
   */
  repairData(data) {
    const repaired = { ...data };

    // Ensure required fields exist
    repaired.version = repaired.version || '1.0.0';
    repaired.sites = repaired.sites || [];
    repaired.categories = repaired.categories || [];
    repaired.settings = repaired.settings || {};
    repaired.analytics = repaired.analytics || {
      totalCheckIns: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageDaily: 0,
      sitesAdded: 0,
      sitesArchived: 0
    };

    // Fix sites
    repaired.sites = repaired.sites.filter(site => site && site.id && site.name).map(site => ({
      ...site,
      credentials: (site.credentials || []).filter(c => c && c.id && c.email)
    }));

    return repaired;
  }
}

// Export singleton instance
export const migrationService = new MigrationService();