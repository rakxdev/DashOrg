/**
 * Sites Service
 * Business logic for site management
 */

import { stateManager } from '../../core/state.js';
import { generateUUID, getFaviconURL } from '../../shared/constants.js';

class SitesService {
  /**
   * Create new site
   */
  createSite(siteData) {
    const site = {
      id: generateUUID(),
      name: siteData.name,
      url: siteData.url,
      favicon: getFaviconURL(siteData.url),
      category: siteData.category || null,
      tags: siteData.tags || [],
      priority: siteData.priority || 0,
      color: siteData.color || this.getRandomColor(),
      notes: siteData.notes || '',
      credentials: siteData.credentials || [],
      metadata: {
        loginFrequency: 'daily',
        importance: 'normal',
        lastIssue: null,
        averageCheckInTime: '09:00'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return stateManager.addSite(site);
  }

  /**
   * Update existing site
   */
  updateSite(id, updates) {
    return stateManager.updateSite(id, updates);
  }

  /**
   * Delete site
   */
  deleteSite(id) {
    return stateManager.deleteSite(id);
  }

  /**
   * Get site by ID
   */
  getSite(id) {
    return stateManager.getSite(id);
  }

  /**
   * Get all sites
   */
  getAllSites() {
    return stateManager.getSites();
  }

  /**
   * Get filtered sites
   */
  getFilteredSites() {
    return stateManager.getFilteredSites();
  }

  /**
   * Search sites
   */
  searchSites(query) {
    return stateManager.searchSites(query);
  }

  /**
   * Get sites by category
   */
  getSitesByCategory(categoryId) {
    const sites = this.getAllSites();
    return sites.filter(site => site.category === categoryId);
  }

  /**
   * Get sites by tag
   */
  getSitesByTag(tag) {
    const sites = this.getAllSites();
    return sites.filter(site => site.tags && site.tags.includes(tag));
  }

  /**
   * Get sites by priority
   */
  getSitesByPriority(priority) {
    const sites = this.getAllSites();
    return sites.filter(site => site.priority === priority);
  }

  /**
   * Get pending sites (not checked in today)
   */
  getPendingSites() {
    const sites = this.getAllSites();
    return sites.filter(site => {
      return !this.isSiteCompleteToday(site);
    });
  }

  /**
   * Get completed sites (all credentials checked in today)
   */
  getCompletedSites() {
    const sites = this.getAllSites();
    return sites.filter(site => {
      return this.isSiteCompleteToday(site);
    });
  }

  /**
   * Check if site is complete today
   */
  isSiteCompleteToday(site) {
    if (!site.credentials || site.credentials.length === 0) {
      return false;
    }

    return site.credentials.every(cred => 
      cred.checkedInOn && this.isToday(cred.checkedInOn)
    );
  }

  /**
   * Get site completion status
   */
  getSiteStatus(site) {
    if (!site.credentials || site.credentials.length === 0) {
      return 'empty';
    }

    const checkedCount = site.credentials.filter(cred => 
      cred.checkedInOn && this.isToday(cred.checkedInOn)
    ).length;

    if (checkedCount === 0) return 'pending';
    if (checkedCount === site.credentials.length) return 'done';
    return 'partial';
  }

  /**
   * Get site progress percentage
   */
  getSiteProgress(site) {
    if (!site.credentials || site.credentials.length === 0) {
      return 0;
    }

    const checkedCount = site.credentials.filter(cred => 
      cred.checkedInOn && this.isToday(cred.checkedInOn)
    ).length;

    return Math.round((checkedCount / site.credentials.length) * 100);
  }

  /**
   * Duplicate site
   */
  duplicateSite(id) {
    const original = this.getSite(id);
    if (!original) return null;

    const duplicate = {
      ...original,
      id: generateUUID(),
      name: `${original.name} (Copy)`,
      credentials: original.credentials.map(cred => ({
        ...cred,
        id: generateUUID(),
        checkedInOn: null,
        checkInHistory: []
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return stateManager.addSite(duplicate);
  }

  /**
   * Archive site (soft delete)
   */
  archiveSite(id) {
    return this.updateSite(id, {
      archived: true,
      archivedAt: new Date().toISOString()
    });
  }

  /**
   * Restore archived site
   */
  restoreSite(id) {
    return this.updateSite(id, {
      archived: false,
      archivedAt: null
    });
  }

  /**
   * Sort sites
   */
  sortSites(sites, sortBy = 'name', order = 'asc') {
    const sorted = [...sites].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'priority':
          aVal = a.priority || 0;
          bVal = b.priority || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'progress':
          aVal = this.getSiteProgress(a);
          bVal = this.getSiteProgress(b);
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return sorted;
  }

  /**
   * Group sites by category
   */
  groupByCategory(sites) {
    const grouped = {};
    sites.forEach(site => {
      const category = site.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(site);
    });
    return grouped;
  }

  /**
   * Get random color for site
   */
  getRandomColor() {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#06b6d4', '#6366f1', '#ef4444'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
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
   * Get stale sites (not checked in X days)
   */
  getStaleSites(days = 7) {
    const sites = this.getAllSites();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return sites.filter(site => {
      if (!site.credentials || site.credentials.length === 0) return false;

      const lastCheckIn = site.credentials.reduce((latest, cred) => {
        if (!cred.checkedInOn) return latest;
        const credDate = new Date(cred.checkedInOn);
        return credDate > latest ? credDate : latest;
      }, new Date(0));

      return lastCheckIn < cutoffDate;
    });
  }

  /**
   * Get site statistics
   */
  getSiteStatistics(id) {
    const site = this.getSite(id);
    if (!site) return null;

    const credentials = site.credentials || [];
    const checkIns = credentials.filter(c => c.checkedInOn && this.isToday(c.checkedInOn));

    return {
      totalCredentials: credentials.length,
      checkedToday: checkIns.length,
      progress: this.getSiteProgress(site),
      status: this.getSiteStatus(site),
      lastUpdate: site.updatedAt,
      createdDaysAgo: this.getDaysAgo(site.createdAt)
    };
  }

  /**
   * Get days ago from date
   */
  getDaysAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const sitesService = new SitesService();