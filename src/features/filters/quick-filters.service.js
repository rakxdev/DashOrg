/**
 * Quick Filters Service
 * Provides preset filter combinations for quick site filtering
 */

import { stateManager } from '../../core/state.js';
import { EVENTS } from '../../config.js';

class QuickFilters {
  constructor() {
    this.activeFilters = new Set();
    this.initialized = false;
  }

  /**
   * Initialize quick filters
   */
  init() {
    if (this.initialized) return;
    
    console.log('🎯 Initializing Quick Filters...');
    this.attachEventListeners();
    this.initialized = true;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Filter preset buttons
    document.querySelectorAll('[data-quick-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterType = e.currentTarget.dataset.quickFilter;
        this.toggleFilter(filterType, e.currentTarget);
      });
    });

    // Clear all filters button
    const clearBtn = document.querySelector('[data-action="clear-filters"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllFilters());
    }
  }

  /**
   * Toggle a filter preset
   */
  toggleFilter(filterType, button) {
    if (this.activeFilters.has(filterType)) {
      this.activeFilters.delete(filterType);
      button.classList.remove('active');
    } else {
      this.activeFilters.add(filterType);
      button.classList.add('active');
    }

    this.applyFilters();
    this.updateActiveCount();
  }

  /**
   * Apply active filters
   */
  applyFilters() {
    const sites = stateManager.getSites();
    let filteredSites = [...sites];

    // Apply each active filter
    this.activeFilters.forEach(filterType => {
      filteredSites = this.applyFilterType(filteredSites, filterType);
    });

    // Update state with filtered sites
    stateManager.setFilteredSites(filteredSites);
    
    // Dispatch event for UI update
    stateManager.emit(EVENTS.STATE_CHANGED);
  }

  /**
   * Apply specific filter type
   */
  applyFilterType(sites, filterType) {
    const today = new Date().toISOString().split('T')[0];

    switch (filterType) {
      case 'pending':
        // Sites with unchecked credentials today
        return sites.filter(site => {
          return site.credentials.some(cred => {
            const checkedDate = cred.checkedInOn ? new Date(cred.checkedInOn).toISOString().split('T')[0] : null;
            return checkedDate !== today;
          });
        });

      case 'completed':
        // Sites with all credentials checked today
        return sites.filter(site => {
          return site.credentials.length > 0 && site.credentials.every(cred => {
            const checkedDate = cred.checkedInOn ? new Date(cred.checkedInOn).toISOString().split('T')[0] : null;
            return checkedDate === today;
          });
        });

      case 'partial':
        // Sites with some but not all credentials checked
        return sites.filter(site => {
          const checkedCount = site.credentials.filter(cred => {
            const checkedDate = cred.checkedInOn ? new Date(cred.checkedInOn).toISOString().split('T')[0] : null;
            return checkedDate === today;
          }).length;
          return checkedCount > 0 && checkedCount < site.credentials.length;
        });

      case 'priority':
        // Sites with "priority" or "urgent" tags
        return sites.filter(site => {
          return site.tags && site.tags.some(tag => 
            tag.toLowerCase().includes('priority') || 
            tag.toLowerCase().includes('urgent') ||
            tag.toLowerCase().includes('important')
          );
        });

      case 'work':
        // Sites with "work" category or tags
        return sites.filter(site => {
          const hasWorkTag = site.tags && site.tags.some(tag => tag.toLowerCase().includes('work'));
          const hasWorkCategory = site.category && site.category.toLowerCase().includes('work');
          return hasWorkTag || hasWorkCategory;
        });

      case 'personal':
        // Sites with "personal" category or tags
        return sites.filter(site => {
          const hasPersonalTag = site.tags && site.tags.some(tag => tag.toLowerCase().includes('personal'));
          const hasPersonalCategory = site.category && site.category.toLowerCase().includes('personal');
          return hasPersonalTag || hasPersonalCategory;
        });

      case 'multiple':
        // Sites with multiple credentials
        return sites.filter(site => site.credentials.length > 1);

      default:
        return sites;
    }
  }

  /**
   * Clear all active filters
   */
  clearAllFilters() {
    this.activeFilters.clear();
    
    // Remove active class from all filter buttons
    document.querySelectorAll('[data-quick-filter]').forEach(btn => {
      btn.classList.remove('active');
    });

    // Reset to show all sites
    stateManager.setFilteredSites(stateManager.getSites());
    stateManager.emit(EVENTS.STATE_CHANGED);
    
    this.updateActiveCount();
  }

  /**
   * Update active filter count display
   */
  updateActiveCount() {
    const countElement = document.querySelector('.quick-filters__count');
    if (countElement) {
      const count = this.activeFilters.size;
      if (count > 0) {
        countElement.textContent = `${count} active filter${count !== 1 ? 's' : ''}`;
        countElement.style.display = 'inline-block';
      } else {
        countElement.style.display = 'none';
      }
    }
  }

  /**
   * Get active filters
   */
  getActiveFilters() {
    return Array.from(this.activeFilters);
  }

  /**
   * Check if filters are active
   */
  hasActiveFilters() {
    return this.activeFilters.size > 0;
  }
}

// Export singleton instance
export const quickFilters = new QuickFilters();