/**
 * Main Application Entry Point
 * Bootstrap and initialize the application
 */

import { CONFIG, EVENTS } from './config.js';
import { stateManager } from './core/state.js';
import { storageService } from './core/storage.js';
import { sitesService } from './features/sites/sites.service.js';
import { credentialsService } from './features/credentials/credentials.service.js';
import { analyticsService } from './features/analytics/analytics.service.js';
import { keyboardShortcuts } from './features/keyboard/keyboard-shortcuts.service.js';
import { enhancedSearch } from './features/search/enhanced-search.service.js';
import { quickFilters } from './features/filters/quick-filters.service.js';
import { toast } from './shared/components/toast.js';
import { formatDate, debounce } from './shared/constants.js';
import { ComponentLoader } from './utils/component-loader.js';

class App {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      console.log('🚀 Initializing DashOrg...');
      
      // Load modal components
      await ComponentLoader.loadComponent('src/components/add-site-modal.html', '#modal-container');
      await ComponentLoader.loadComponent('src/components/history-modal.html', '#modal-container');
      
      // Initialize state
      await stateManager.init();
      
      // Setup theme
      this.initTheme();
      
      // Render initial UI
      this.render();
      
      // Setup modal listeners
      this.setupModalListeners();
      
      // Attach event listeners
      this.attachEventListeners();
      
      // Subscribe to state changes
      this.subscribeToEvents();
      
      // Initialize keyboard shortcuts
      keyboardShortcuts.init();
      
      // Initialize enhanced search
      enhancedSearch.init();
      
      // Initialize quick filters
      quickFilters.init();
      
      // Update date display
      this.updateDate();
      
      this.initialized = true;
      console.log('✅ Application initialized successfully');
      
      toast.success('Welcome to DashOrg!', 2000);
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      toast.error('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize theme
   */
  initTheme() {
    const settings = stateManager.getSettings();
    const theme = settings.theme || 'auto';
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  /**
   * Render UI
   */
  render() {
    this.renderProgress();
    this.renderSites();
    this.updateAnalytics();
  }

  /**
   * Render progress indicator
   */
  renderProgress() {
    const stats = stateManager.getProgressStats();
    const progressCount = document.getElementById('progress-count');
    const progressPercent = document.getElementById('progress-percent');
    const progressRing = document.querySelector('.progress-ring__value');

    if (progressCount) {
      progressCount.textContent = `${stats.checked} / ${stats.total} done`;
    }

    if (progressPercent) {
      progressPercent.textContent = `${stats.percentage}%`;
    }

    if (progressRing) {
      const radius = 54;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (stats.percentage / 100) * circumference;
      progressRing.style.strokeDasharray = `${circumference}`;
      progressRing.style.strokeDashoffset = offset;
    }
  }

  /**
   * Render sites grid
   */
  renderSites() {
    const grid = document.getElementById('sites-grid');
    if (!grid) return;

    const sites = stateManager.getFilteredSites();
    
    if (sites.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📦</span>
          <h3>No sites yet</h3>
          <p>Click "Add Site" to create your first credential entry</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = sites.map(site => this.renderSiteCard(site)).join('');
    
    // Attach site-specific event listeners
    this.attachSiteEventListeners();
  }

  /**
   * Render single site card
   */
  renderSiteCard(site) {
    const status = sitesService.getSiteStatus(site);
    const progress = sitesService.getSiteProgress(site);
    
    return `
      <article class="site-card" data-site-id="${site.id}">
        <header class="site-card__header">
          <div class="site-card__title">
            <span class="site-card__icon">${this.getSiteIcon(site)}</span>
            <div>
              <h3 class="site-card__name">${site.name}</h3>
              <a class="site-card__url" href="${site.url}" target="_blank" rel="noopener noreferrer">Visit</a>
            </div>
          </div>
          <div class="inline-stack">
            <span class="status-pill" data-status="${status}">${this.getStatusLabel(status)}</span>
            <button class="btn-icon" data-action="reset-site" title="Reset site for today">↻</button>
            <button class="btn-icon" data-action="delete-site" title="Delete site">🗑</button>
          </div>
        </header>
        
        ${site.tags && site.tags.length > 0 ? `
          <div class="site-card__tags">
            ${site.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="site-card__progress">
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-bar__label">${progress}% complete</span>
        </div>
        
        <ul class="credentials-list">
          ${site.credentials.map(cred => this.renderCredentialCard(site.id, cred)).join('')}
        </ul>
      </article>
    `;
  }

  /**
   * Render credential card
   */
  renderCredentialCard(siteId, credential) {
    const isChecked = credentialsService.isCheckedInToday(credential);
    const buttonText = isChecked ? 'Checked ✓' : 'Check In';
    const buttonClass = isChecked ? 'btn--success' : 'btn--primary';

    return `
      <li class="credential-card ${isChecked ? 'credential-card--checked' : ''}">
        <div class="credential-card__header">
          <span class="credential-card__label">${credential.label}</span>
          <div class="inline-stack">
            <button class="btn btn--tiny ${buttonClass}"
                    data-action="toggle-check"
                    data-site-id="${siteId}"
                    data-credential-id="${credential.id}">
              ${buttonText}
            </button>
            <button class="btn-icon btn-icon--sm"
                    data-action="edit-credential"
                    data-site-id="${siteId}"
                    data-credential-id="${credential.id}"
                    title="Edit credential">
              ✏️
            </button>
          </div>
        </div>
        <div class="credential-card__body">
          <div class="credential-field">
            <span class="credential-field__label">Email</span>
            <span class="credential-field__value">${credential.email}</span>
            <button class="btn--plain" 
                    data-action="copy-email"
                    data-site-id="${siteId}"
                    data-credential-id="${credential.id}">Copy</button>
          </div>
          <div class="credential-field">
            <span class="credential-field__label">Password</span>
            <span class="credential-field__value credential-password--masked">••••••••</span>
            <div class="inline-stack">
              <button class="btn--plain" 
                      data-action="toggle-password"
                      data-site-id="${siteId}"
                      data-credential-id="${credential.id}">Show</button>
              <button class="btn--plain" 
                      data-action="copy-password"
                      data-site-id="${siteId}"
                      data-credential-id="${credential.id}">Copy</button>
            </div>
          </div>
          ${credential.notes ? `
            <div class="credential-notes">
              <strong>Notes:</strong> ${credential.notes}
            </div>
          ` : ''}
        </div>
        <div class="credential-card__footer">
          <span class="credential-last-check">
            ${isChecked ? `Checked in ${formatDate(credential.checkedInOn)}` : 'Not checked in today'}
          </span>
        </div>
      </li>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Add site button
    const addSiteBtn = document.querySelector('[data-action="open-modal"]');
    if (addSiteBtn) {
      addSiteBtn.addEventListener('click', () => this.openAddSiteModal());
    }

    // History button
    const historyBtn = document.querySelector('[data-action="view-history"]');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => this.viewHistory());
    }

    // Search input with enhanced search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value;
        const results = enhancedSearch.search(query);
        
        // Update state with search results
        stateManager.setFilters({ search: query });
        this.renderSites();
        
        // Show result count
        this.updateSearchResultsCount(results.length, query);
      }, 300));
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        stateManager.setFilters({ status: e.target.value });
        this.renderSites();
      });
    }

    // Reset day button
    const resetDayBtn = document.querySelector('[data-action="reset-day"]');
    if (resetDayBtn) {
      resetDayBtn.addEventListener('click', () => this.resetDay());
    }

    // Mark all done button
    const markAllBtn = document.querySelector('[data-action="mark-all-done"]');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.markAllDone();
      });
    }
  }

  /**
   * View check-in history
   */
  viewHistory() {
    const modal = document.getElementById('history-modal');
    if (!modal) {
      console.error('History modal not found!');
      return;
    }

    // Set up date filter
    const dateFilter = document.getElementById('history-date-filter');
    const quickSelect = document.getElementById('history-quick-select');
    
    if (dateFilter) {
      dateFilter.valueAsDate = new Date();
    }

    // Setup quick select handler
    if (quickSelect) {
      quickSelect.addEventListener('change', (e) => {
        this.updateHistoryView(e.target.value);
      });
    }

    // Setup date filter handler
    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        this.updateHistoryView('custom', e.target.value);
      });
    }

    // Setup close buttons
    document.querySelectorAll('[data-action="close-history-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeHistoryModal());
    });

    // Show modal and render history
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    this.updateHistoryView('today');
  }

  /**
   * Update history view based on filter
   */
  updateHistoryView(filter, customDate = null) {
    const content = document.getElementById('history-content');
    if (!content) return;

    const sites = stateManager.getSites();
    let filterDate = new Date();

    // Calculate filter date
    if (filter === 'yesterday') {
      filterDate.setDate(filterDate.getDate() - 1);
    } else if (filter === 'custom' && customDate) {
      filterDate = new Date(customDate);
    }

    const filterDateStr = filterDate.toISOString().split('T')[0];

    // Build history HTML
    let hasHistory = false;
    let historyHTML = '';

    sites.forEach(site => {
      const checkedCreds = [];
      const uncheckedCreds = [];

      site.credentials.forEach(cred => {
        const credDate = cred.checkedInOn ? new Date(cred.checkedInOn).toISOString().split('T')[0] : null;
        
        if (filter === 'week' || filter === 'month') {
          const daysAgo = filter === 'week' ? 7 : 30;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
          const cutoffStr = cutoffDate.toISOString().split('T')[0];
          
          if (credDate && credDate >= cutoffStr) {
            checkedCreds.push(cred);
            hasHistory = true;
          }
        } else {
          if (credDate === filterDateStr) {
            checkedCreds.push(cred);
            hasHistory = true;
          } else {
            uncheckedCreds.push(cred);
          }
        }
      });

      if (checkedCreds.length > 0 || (filter !== 'week' && filter !== 'month' && uncheckedCreds.length > 0)) {
        const isComplete = checkedCreds.length === site.credentials.length && site.credentials.length > 0;
        const cardClass = isComplete ? 'history-site-card--complete' : 'history-site-card--incomplete';
        const statusClass = isComplete ? 'history-site-card__status--complete' : 'history-site-card__status--incomplete';
        const statusText = isComplete ? '✓ All Complete' : `${checkedCreds.length}/${site.credentials.length} Checked`;

        historyHTML += `
          <div class="history-site-card ${cardClass}">
            <div class="history-site-card__header">
              <div class="history-site-card__title">
                <span>${isComplete ? '✅' : '⚠️'}</span>
                ${site.name}
              </div>
              <span class="history-site-card__status ${statusClass}">${statusText}</span>
            </div>
            <ul class="history-credential-list">
              ${checkedCreds.map(cred => `
                <li class="history-credential-item history-credential-item--checked">
                  <span class="history-credential-label">✓ ${cred.label}</span>
                  <span class="history-credential-time">${new Date(cred.checkedInOn).toLocaleTimeString()}</span>
                </li>
              `).join('')}
              ${(filter !== 'week' && filter !== 'month') ? uncheckedCreds.map(cred => `
                <li class="history-credential-item history-credential-item--unchecked">
                  <span class="history-credential-label">✗ ${cred.label}</span>
                  <span class="history-credential-time">Not checked in</span>
                </li>
              `).join('') : ''}
            </ul>
          </div>
        `;
      }
    });

    if (!hasHistory) {
      historyHTML = `
        <div class="history-empty-state">
          <span class="history-empty-state__icon">📭</span>
          <h3>No Check-Ins Found</h3>
          <p>No credentials were checked in for the selected period.</p>
        </div>
      `;
    }

    content.innerHTML = historyHTML;
  }

  /**
   * Close history modal
   */
  closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;

    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  /**
   * Attach site-specific event listeners
   */
  attachSiteEventListeners() {
    // Toggle check-in
    document.querySelectorAll('[data-action="toggle-check"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.dataset.siteId;
        const credentialId = e.target.dataset.credentialId;
        this.toggleCheckIn(siteId, credentialId);
      });
    });

    // Copy email
    document.querySelectorAll('[data-action="copy-email"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.dataset.siteId;
        const credentialId = e.target.dataset.credentialId;
        this.copyEmail(siteId, credentialId);
      });
    });

    // Copy password
    document.querySelectorAll('[data-action="copy-password"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.dataset.siteId;
        const credentialId = e.target.dataset.credentialId;
        this.copyPassword(siteId, credentialId);
      });
    });

    // Toggle password visibility
    document.querySelectorAll('[data-action="toggle-password"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.dataset.siteId;
        const credentialId = e.target.dataset.credentialId;
        this.togglePassword(e.target, siteId, credentialId);
      });
    });

    // Reset site
    document.querySelectorAll('[data-action="reset-site"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.closest('[data-site-id]').dataset.siteId;
        this.resetSite(siteId);
      });
    });

    // Delete site
    document.querySelectorAll('[data-action="delete-site"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.closest('[data-site-id]').dataset.siteId;
        this.deleteSite(siteId);
      });
    });

    // Edit credential
    document.querySelectorAll('[data-action="edit-credential"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const siteId = e.target.dataset.siteId;
        const credentialId = e.target.dataset.credentialId;
        this.editCredential(siteId, credentialId);
      });
    });
  }

  /**
   * Edit credential
   */
  editCredential(siteId, credentialId) {
    const site = sitesService.getSite(siteId);
    if (!site) return;

    const credential = site.credentials.find(c => c.id === credentialId);
    if (!credential) return;

    const newEmail = prompt('Edit Email/Username:', credential.email);
    if (newEmail === null) return;

    const newPassword = prompt('Edit Password:', credential.password);
    if (newPassword === null) return;

    const newLabel = prompt('Edit Label:', credential.label);
    if (newLabel === null) return;

    const newNotes = prompt('Edit Notes (optional):', credential.notes || '');
    if (newNotes === null) return;

    credential.email = newEmail.trim() || credential.email;
    credential.password = newPassword.trim() || credential.password;
    credential.label = newLabel.trim() || credential.label;
    credential.notes = newNotes.trim();

    stateManager.updateSite(siteId, { credentials: site.credentials });
    this.render();
    toast.success('Credential updated successfully!');
  }

  /**
   * Subscribe to state events
   */
  subscribeToEvents() {
    stateManager.on(EVENTS.STATE_CHANGED, () => {
      this.render();
    });

    stateManager.on(EVENTS.CREDENTIAL_CHECKED, () => {
      toast.success('Checked in!', 1500);
    });
  }

  /**
   * Toggle check-in
   */
  async toggleCheckIn(siteId, credentialId) {
    const success = credentialsService.toggleCheckIn(siteId, credentialId);
    if (success) {
      this.render();
    }
  }

  /**
   * Copy email
   */
  async copyEmail(siteId, credentialId) {
    const success = await credentialsService.copyEmail(siteId, credentialId);
    if (success) {
      toast.success('Email copied to clipboard!', 2000);
    } else {
      toast.error('Failed to copy email');
    }
  }

  /**
   * Copy password
   */
  async copyPassword(siteId, credentialId) {
    const success = await credentialsService.copyPassword(siteId, credentialId);
    if (success) {
      toast.success('Password copied! Will clear in 30 seconds.', 2000);
    } else {
      toast.error('Failed to copy password');
    }
  }

  /**
   * Toggle password visibility
   */
  togglePassword(btn, siteId, credentialId) {
    const credential = credentialsService.getCredential(siteId, credentialId);
    if (!credential) return;

    const passwordField = btn.closest('.credential-field').querySelector('.credential-field__value');
    const isHidden = passwordField.classList.contains('credential-password--masked');

    if (isHidden) {
      passwordField.textContent = credential.password;
      passwordField.classList.remove('credential-password--masked');
      btn.textContent = 'Hide';
    } else {
      passwordField.textContent = '••••••••';
      passwordField.classList.add('credential-password--masked');
      btn.textContent = 'Show';
    }
  }

  /**
   * Reset site
   */
  resetSite(siteId) {
    const site = sitesService.getSite(siteId);
    if (!site) return;

    site.credentials.forEach(cred => {
      credentialsService.resetCheckIn(siteId, cred.id);
    });

    this.render();
    toast.info('Site reset for today');
  }

  /**
   * Delete site
   */
  deleteSite(siteId) {
    const site = sitesService.getSite(siteId);
    if (!site) return;

    if (confirm(`Delete "${site.name}" and all its credentials?`)) {
      sitesService.deleteSite(siteId);
      this.render();
      toast.success('Site deleted');
    }
  }

  /**
   * Reset day
   */
  resetDay() {
    if (confirm('Reset all credentials for today?')) {
      stateManager.resetAllCredentials();
      toast.info('All credentials reset for today');
    }
  }

  /**
   * Mark all done
   */
  markAllDone() {
    stateManager.markAllDone();
    toast.success('All credentials marked as done!');
  }

  /**
   * Open add site modal
   */
  openAddSiteModal() {
    const modal = document.getElementById('add-site-modal');
    if (!modal) {
      console.error('Modal not found!');
      return;
    }

    // Reset form
    const form = document.getElementById('add-site-form');
    if (form) form.reset();

    // Populate site selector with existing sites
    this.populateSiteSelector();

    // Clear any previous credentials and add first field
    const credentialsContainer = document.getElementById('credentials-container');
    if (credentialsContainer) {
      credentialsContainer.innerHTML = '';
      // Add first credential field immediately
      this.addCredentialField();
    }

    // Setup site selector change handler
    this.setupSiteSelector();

    // Show modal
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    
    // Focus first input after a short delay
    setTimeout(() => {
      const siteSelector = document.getElementById('site-selector');
      if (siteSelector) {
        siteSelector.focus();
      }
    }, 200);
  }

  /**
   * Close add site modal
   */
  closeAddSiteModal() {
    const modal = document.getElementById('add-site-modal');
    if (!modal) return;

    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    
    // Clear form
    const form = document.getElementById('add-site-form');
    if (form) form.reset();
  }

  /**
   * Handle add site form submission
   */
  handleAddSiteSubmit(e) {
    e.preventDefault();

    const form = e.target || document.getElementById('add-site-form');
    const formData = new FormData(form);

    // Check if adding to existing site or creating new
    const siteSelector = document.getElementById('site-selector');
    const selectedSiteId = siteSelector ? siteSelector.value : 'new';

    // Collect credentials
    const credentialForms = document.querySelectorAll('.credential-form-item');
    const credentials = [];

    credentialForms.forEach((credForm, index) => {
      const label = credForm.querySelector('[name="credential-label"]').value;
      const email = credForm.querySelector('[name="credential-email"]').value;
      const password = credForm.querySelector('[name="credential-password"]').value;
      const notes = credForm.querySelector('[name="credential-notes"]').value;

      if (label && email && password) {
        credentials.push({
          id: this.generateId(),
          label,
          email,
          password,
          notes
        });
      }
    });

    if (credentials.length === 0) {
      toast.error('Please add at least one credential');
      return;
    }

    if (selectedSiteId !== 'new') {
      // Add credentials to existing site
      const site = sitesService.getSite(selectedSiteId);
      if (site) {
        credentials.forEach(cred => {
          site.credentials.push(cred);
        });
        stateManager.updateSite(selectedSiteId, { credentials: site.credentials });
        this.closeAddSiteModal();
        this.render();
        toast.success(`Credentials added to ${site.name}!`);
      }
    } else {
      // Create new site
      const siteName = formData.get('site-name');
      const siteUrl = formData.get('site-url');
      const siteTags = formData.get('site-tags');
      const siteCategory = formData.get('site-category');

      // Validate
      if (!siteName || !siteUrl) {
        toast.error('Please fill in site name and URL for new site');
        return;
      }

      const newSite = {
        name: siteName,
        url: siteUrl,
        tags: siteTags ? siteTags.split(',').map(t => t.trim()).filter(t => t) : [],
        category: siteCategory || null,
        credentials
      };

      sitesService.createSite(newSite);
      this.closeAddSiteModal();
      toast.success(`${siteName} added successfully!`);
    }
  }

  /**
   * Populate site selector with existing sites
   */
  populateSiteSelector() {
    const selector = document.getElementById('site-selector');
    if (!selector) return;

    const sites = stateManager.getSites();
    
    // Clear existing options except "Create New"
    selector.innerHTML = '<option value="new">➕ Create New Site</option>';
    
    // Add existing sites
    sites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.id;
      option.textContent = `${site.name} (${site.credentials.length} credential${site.credentials.length !== 1 ? 's' : ''})`;
      selector.appendChild(option);
    });
  }

  /**
   * Setup site selector change handler
   */
  setupSiteSelector() {
    const selector = document.getElementById('site-selector');
    const siteInfoSection = document.getElementById('site-info-section');
    
    if (!selector || !siteInfoSection) return;

    // Remove old listener if exists
    const newSelector = selector.cloneNode(true);
    selector.parentNode.replaceChild(newSelector, selector);

    newSelector.addEventListener('change', (e) => {
      const isNewSite = e.target.value === 'new';
      
      // Show/hide site info section
      siteInfoSection.style.display = isNewSite ? 'block' : 'none';
      
      // Update required fields
      const siteNameInput = document.getElementById('site-name-input');
      const siteUrlInput = document.getElementById('site-url-input');
      
      if (siteNameInput && siteUrlInput) {
        siteNameInput.required = isNewSite;
        siteUrlInput.required = isNewSite;
      }
    });

    // Trigger initial state
    siteInfoSection.style.display = 'block';
  }

  /**
   * Get existing labels for suggestions
   */
  getExistingLabels() {
    const sites = stateManager.getSites();
    const labels = new Set();
    
    sites.forEach(site => {
      site.credentials.forEach(cred => {
        if (cred.label) {
          labels.add(cred.label);
        }
      });
    });
    
    return Array.from(labels);
  }

  /**
   * Add credential field to form
   */
  addCredentialField() {
    const container = document.getElementById('credentials-container');
    if (!container) return;

    const index = container.children.length;
    const existingLabels = this.getExistingLabels();
    
    const labelsOptions = existingLabels.length > 0
      ? existingLabels.map(label => `<option value="${label}">${label}</option>`).join('')
      : '';

    const credentialHtml = `
      <div class="credential-form-item" data-credential-index="${index}">
        <div class="credential-form-item__header">
          <h4>Credential ${index + 1}</h4>
          ${index > 0 ? '<button type="button" class="btn-icon" data-action="remove-credential" title="Remove">×</button>' : ''}
        </div>
        <div class="form-row">
          <div class="field">
            <label class="field__label">Select Label or Type New <span class="required">*</span></label>
            <select name="credential-label-select" data-label-select="${index}">
              <option value="">-- Select existing or type below --</option>
              ${labelsOptions}
              <option value="__new__">➕ Create New Label</option>
            </select>
          </div>
        </div>
        <div class="form-row" id="custom-label-${index}" style="display: none;">
          <div class="field">
            <label class="field__label">New Label Name <span class="required">*</span></label>
            <input type="text" data-label-input="${index}" placeholder="e.g., Personal, Work, Primary" autocomplete="off" />
          </div>
        </div>
        <input type="hidden" name="credential-label" data-label-hidden="${index}" required />
        <div class="form-row">
          <div class="field">
            <label class="field__label">Email / Username <span class="required">*</span></label>
            <input type="text" name="credential-email" placeholder="your@email.com" required />
          </div>
        </div>
        <div class="form-row">
          <div class="field field--password">
            <label class="field__label">Password <span class="required">*</span></label>
            <div class="password-input-group">
              <input type="password" name="credential-password" placeholder="Enter password" required />
              <button type="button" class="btn-icon" data-action="toggle-password-visibility" title="Show password">👁️</button>
              <button type="button" class="btn btn--tiny btn--ghost" data-action="generate-password" title="Generate password">Generate</button>
            </div>
            <div class="password-strength-meter">
              <div class="password-strength-meter__bar"></div>
              <span class="password-strength-meter__label"></span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label class="field__label">Notes (Optional)</label>
            <textarea name="credential-notes" rows="2" placeholder="2FA codes, security questions, etc."></textarea>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', credentialHtml);

    // Attach event listeners for this credential
    this.attachCredentialFieldListeners(container.lastElementChild);
  }

  /**
   * Attach listeners to credential field
   */
  attachCredentialFieldListeners(credentialElement) {
    // Get index from element
    const index = credentialElement.dataset.credentialIndex;
    
    // Label select handler
    const labelSelect = credentialElement.querySelector(`[data-label-select="${index}"]`);
    const labelInput = credentialElement.querySelector(`[data-label-input="${index}"]`);
    const labelHidden = credentialElement.querySelector(`[data-label-hidden="${index}"]`);
    const customLabelRow = document.getElementById(`custom-label-${index}`);
    
    if (labelSelect && labelHidden) {
      labelSelect.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
          // Show custom input
          if (customLabelRow) customLabelRow.style.display = 'block';
          if (labelInput) {
            labelInput.required = true;
            labelInput.focus();
          }
          labelHidden.value = '';
        } else if (e.target.value) {
          // Use existing label
          if (customLabelRow) customLabelRow.style.display = 'none';
          if (labelInput) {
            labelInput.required = false;
            labelInput.value = '';
          }
          labelHidden.value = e.target.value;
        } else {
          // Nothing selected
          if (customLabelRow) customLabelRow.style.display = 'none';
          if (labelInput) labelInput.required = false;
          labelHidden.value = '';
        }
      });
    }
    
    // Custom label input handler
    if (labelInput && labelHidden) {
      labelInput.addEventListener('input', (e) => {
        labelHidden.value = e.target.value;
      });
    }
    
    // Remove button
    const removeBtn = credentialElement.querySelector('[data-action="remove-credential"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        credentialElement.remove();
        this.updateCredentialNumbers();
      });
    }

    // Password visibility toggle
    const toggleBtn = credentialElement.querySelector('[data-action="toggle-password-visibility"]');
    const passwordInput = credentialElement.querySelector('input[type="password"], input[type="text"][name="credential-password"]');
    
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    // Password strength meter
    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => {
        this.updatePasswordStrength(credentialElement, e.target.value);
      });
    }

    // Generate password button
    const generateBtn = credentialElement.querySelector('[data-action="generate-password"]');
    if (generateBtn && passwordInput) {
      generateBtn.addEventListener('click', () => {
        const newPassword = this.generateSecurePassword();
        passwordInput.value = newPassword;
        passwordInput.type = 'text';
        this.updatePasswordStrength(credentialElement, newPassword);
        toast.success('Strong password generated!', 2000);
      });
    }
  }

  /**
   * Update password strength meter
   */
  updatePasswordStrength(credentialElement, password) {
    const strength = calculatePasswordStrength(password);
    const meter = credentialElement.querySelector('.password-strength-meter__bar');
    const label = credentialElement.querySelector('.password-strength-meter__label');

    if (meter && label) {
      meter.style.width = `${(strength.score / 7) * 100}%`;
      meter.style.backgroundColor = strength.color;
      label.textContent = strength.label;
      label.style.color = strength.color;
    }
  }

  /**
   * Generate secure password
   */
  generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }
    return password;
  }

  /**
   * Update credential numbers
   */
  updateCredentialNumbers() {
    const credentials = document.querySelectorAll('.credential-form-item');
    credentials.forEach((cred, index) => {
      const header = cred.querySelector('h4');
      if (header) {
        header.textContent = `Credential ${index + 1}`;
      }
      cred.dataset.credentialIndex = index;
    });
  }

  /**
   * Setup modal event listeners
   */
  setupModalListeners() {
    // Close modal buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAddSiteModal());
    });

    // Modal overlay click
    const overlay = document.querySelector('.modal__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeAddSiteModal());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAddSiteModal();
      }
    });

    // Submit form button (outside form)
    const submitBtn = document.querySelector('[data-action="submit-form"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const form = document.getElementById('add-site-form');
        if (form) {
          // Manually trigger form submission
          const event = new Event('submit', { cancelable: true });
          form.dispatchEvent(event);
          if (form.checkValidity()) {
            this.handleAddSiteSubmit(event);
          } else {
            form.reportValidity();
          }
        }
      });
    }

    // Add site form submission (for Enter key)
    const form = document.getElementById('add-site-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAddSiteSubmit(e));
    }

    // Add credential button
    const addCredBtn = document.querySelector('[data-action="add-credential-field"]');
    if (addCredBtn) {
      addCredBtn.addEventListener('click', () => this.addCredentialField());
    }
  }

  /**
   * Update date display
   */
  updateDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
      dateElement.textContent = formatDate(new Date());
    }
  }

  /**
   * Update search results count
   */
  updateSearchResultsCount(count, query) {
    let countElement = document.querySelector('.search-results-count');
    
    if (query && query.length > 0) {
      if (!countElement) {
        const searchField = document.getElementById('search-input')?.closest('.field');
        if (searchField) {
          countElement = document.createElement('div');
          countElement.className = 'search-results-count';
          searchField.appendChild(countElement);
        }
      }
      
      if (countElement) {
        countElement.innerHTML = `Found <strong>${count}</strong> site${count !== 1 ? 's' : ''} matching "${query}"`;
      }
    } else {
      if (countElement) {
        countElement.remove();
      }
    }
  }

  /**
   * Update analytics display
   */
  updateAnalytics() {
    const analytics = analyticsService.getPerformanceMetrics();
    // Update analytics UI if elements exist
    console.log('Analytics:', analytics);
  }

  /**
   * Get site icon
   */
  getSiteIcon(site) {
    if (site.favicon) {
      return `<img src="${site.favicon}" alt="" width="24" height="24" onerror="this.style.display='none'">`;
    }
    return '🌐';
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'Pending',
      done: 'Done',
      partial: 'In Progress',
      empty: 'Empty'
    };
    return labels[status] || status;
  }

  /**
   * Generate ID
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}