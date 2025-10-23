/**
 * Enhanced Search Service
 * Fuzzy search with highlighting and advanced filtering
 */

import { stateManager } from '../../core/state.js';
import { fuzzySearch } from '../../shared/constants.js';

class EnhancedSearchService {
  constructor() {
    this.searchHistory = [];
    this.maxHistoryItems = 10;
    this.searchSuggestions = new Set();
    this.isInitialized = false;
  }

  /**
   * Initialize enhanced search
   */
  init() {
    this.loadSearchHistory();
    this.buildSearchIndex();
    this.isInitialized = true;
    console.log('✅ Enhanced search initialized');
  }

  /**
   * Build search index from all sites
   */
  buildSearchIndex() {
    const sites = stateManager.getSites();
    
    sites.forEach(site => {
      // Add site name to suggestions
      this.searchSuggestions.add(site.name.toLowerCase());
      
      // Add tags to suggestions
      if (site.tags) {
        site.tags.forEach(tag => this.searchSuggestions.add(tag.toLowerCase()));
      }
      
      // Add credential labels and emails to suggestions
      site.credentials.forEach(cred => {
        if (cred.label) this.searchSuggestions.add(cred.label.toLowerCase());
        if (cred.email) this.searchSuggestions.add(cred.email.toLowerCase());
      });
    });
  }

  /**
   * Perform enhanced search
   */
  search(query) {
    if (!query || query.trim().length === 0) {
      return stateManager.getSites();
    }

    const normalizedQuery = query.toLowerCase().trim();
    this.addToSearchHistory(query);

    const sites = stateManager.getSites();
    const results = [];

    sites.forEach(site => {
      const score = this.calculateSiteScore(site, normalizedQuery);
      
      if (score > 0) {
        results.push({
          site,
          score,
          matches: this.findMatches(site, normalizedQuery)
        });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    
    return results.map(r => r.site);
  }

  /**
   * Calculate relevance score for a site
   */
  calculateSiteScore(site, query) {
    let score = 0;

    // Exact match in site name (highest priority)
    if (site.name.toLowerCase().includes(query)) {
      score += 100;
    }
    // Fuzzy match in site name
    else if (fuzzySearch(query, site.name)) {
      score += 50;
    }

    // Match in URL
    if (site.url.toLowerCase().includes(query)) {
      score += 40;
    }

    // Match in tags
    if (site.tags) {
      site.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          score += 30;
        } else if (fuzzySearch(query, tag)) {
          score += 15;
        }
      });
    }

    // Match in category
    if (site.category && site.category.toLowerCase().includes(query)) {
      score += 25;
    }

    // Match in credentials
    site.credentials.forEach(cred => {
      // Exact match in email
      if (cred.email.toLowerCase().includes(query)) {
        score += 35;
      }
      // Fuzzy match in email
      else if (fuzzySearch(query, cred.email)) {
        score += 20;
      }

      // Exact match in label
      if (cred.label.toLowerCase().includes(query)) {
        score += 30;
      }
      // Fuzzy match in label
      else if (fuzzySearch(query, cred.label)) {
        score += 15;
      }

      // Match in notes
      if (cred.notes && cred.notes.toLowerCase().includes(query)) {
        score += 10;
      }
    });

    return score;
  }

  /**
   * Find all matches in a site
   */
  findMatches(site, query) {
    const matches = [];

    // Site name match
    if (site.name.toLowerCase().includes(query)) {
      matches.push({ field: 'name', value: site.name, type: 'site' });
    }

    // URL match
    if (site.url.toLowerCase().includes(query)) {
      matches.push({ field: 'url', value: site.url, type: 'site' });
    }

    // Tag matches
    if (site.tags) {
      site.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          matches.push({ field: 'tag', value: tag, type: 'site' });
        }
      });
    }

    // Credential matches
    site.credentials.forEach(cred => {
      if (cred.email.toLowerCase().includes(query)) {
        matches.push({ 
          field: 'email', 
          value: cred.email, 
          type: 'credential',
          credentialId: cred.id 
        });
      }
      
      if (cred.label.toLowerCase().includes(query)) {
        matches.push({ 
          field: 'label', 
          value: cred.label, 
          type: 'credential',
          credentialId: cred.id 
        });
      }

      if (cred.notes && cred.notes.toLowerCase().includes(query)) {
        matches.push({ 
          field: 'notes', 
          value: cred.notes, 
          type: 'credential',
          credentialId: cred.id 
        });
      }
    });

    return matches;
  }

  /**
   * Highlight search matches in text
   */
  highlightMatches(text, query) {
    if (!query || !text) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get search suggestions
   */
  getSuggestions(query) {
    if (!query || query.length < 2) {
      return this.getRecentSearches();
    }

    const normalizedQuery = query.toLowerCase();
    const suggestions = [];

    // Filter suggestions that match the query
    this.searchSuggestions.forEach(suggestion => {
      if (suggestion.includes(normalizedQuery)) {
        suggestions.push(suggestion);
      }
    });

    // Sort by relevance (starts with query first)
    suggestions.sort((a, b) => {
      const aStarts = a.startsWith(normalizedQuery);
      const bStarts = b.startsWith(normalizedQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.length - b.length;
    });

    return suggestions.slice(0, 8);
  }

  /**
   * Add query to search history
   */
  addToSearchHistory(query) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) return;

    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(q => q !== normalizedQuery);
    
    // Add to beginning
    this.searchHistory.unshift(normalizedQuery);
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
    
    this.saveSearchHistory();
  }

  /**
   * Get recent searches
   */
  getRecentSearches() {
    return this.searchHistory.slice(0, 5);
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  /**
   * Save search history to localStorage
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('dashorg-search-history', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('dashorg-search-history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
      this.searchHistory = [];
    }
  }

  /**
   * Search across all fields
   */
  searchAllFields(query) {
    const results = this.search(query);
    
    return results.map(site => {
      const matches = this.findMatches(site, query.toLowerCase());
      return {
        ...site,
        searchMatches: matches
      };
    });
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      historyCount: this.searchHistory.length,
      suggestionsCount: this.searchSuggestions.size,
      recentSearches: this.getRecentSearches()
    };
  }

  /**
   * Rebuild search index
   */
  rebuildIndex() {
    this.searchSuggestions.clear();
    this.buildSearchIndex();
  }
}

// Export singleton instance
export const enhancedSearch = new EnhancedSearchService();