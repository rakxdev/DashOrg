/**
 * Keyboard Shortcuts Service
 * Handle global keyboard shortcuts and command palette
 */

import { stateManager } from '../../core/state.js';
import { toast } from '../../shared/components/toast.js';

class KeyboardShortcutsService {
  constructor() {
    this.shortcuts = new Map();
    this.isCommandPaletteOpen = false;
    this.isEnabled = true;
    this.listeners = [];
    
    // Define default shortcuts
    this.defineDefaultShortcuts();
  }

  /**
   * Initialize keyboard shortcuts
   */
  init() {
    this.attachGlobalListener();
    this.createCommandPalette();
    console.log('✅ Keyboard shortcuts initialized');
  }

  /**
   * Define default keyboard shortcuts
   */
  defineDefaultShortcuts() {
    // Command Palette
    this.register('ctrl+k,cmd+k', 'Open command palette', () => {
      this.toggleCommandPalette();
    });

    // Navigation
    this.register('ctrl+n,cmd+n', 'New site', () => {
      document.querySelector('[data-action="open-modal"]')?.click();
    });

    this.register('ctrl+f,cmd+f', 'Focus search', (e) => {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    });

    this.register('h', 'View history', () => {
      if (!this.isInputFocused()) {
        document.querySelector('[data-action="view-history"]')?.click();
      }
    });

    // Actions
    this.register('escape', 'Close modals', () => {
      this.closeAllModals();
    });

    this.register('ctrl+shift+m,cmd+shift+m', 'Mark all done', () => {
      const btn = document.querySelector('[data-action="mark-all-done"]');
      if (btn) btn.click();
    });

    this.register('ctrl+shift+r,cmd+shift+r', 'Reset today', () => {
      const btn = document.querySelector('[data-action="reset-day"]');
      if (btn) btn.click();
    });

    // Filters
    this.register('ctrl+shift+1,cmd+shift+1', 'Show all sites', () => {
      const filter = document.getElementById('status-filter');
      if (filter) {
        filter.value = 'all';
        filter.dispatchEvent(new Event('change'));
      }
    });

    this.register('ctrl+shift+2,cmd+shift+2', 'Show pending', () => {
      const filter = document.getElementById('status-filter');
      if (filter) {
        filter.value = 'pending';
        filter.dispatchEvent(new Event('change'));
      }
    });

    this.register('ctrl+shift+3,cmd+shift+3', 'Show completed', () => {
      const filter = document.getElementById('status-filter');
      if (filter) {
        filter.value = 'done';
        filter.dispatchEvent(new Event('change'));
      }
    });

    // Help
    this.register('?', 'Show keyboard shortcuts help', () => {
      if (!this.isInputFocused()) {
        this.showHelp();
      }
    });
  }

  /**
   * Register a keyboard shortcut
   */
  register(keys, description, handler) {
    const keyVariants = keys.split(',').map(k => k.trim());
    
    keyVariants.forEach(key => {
      this.shortcuts.set(key, {
        key,
        description,
        handler
      });
    });
  }

  /**
   * Attach global keyboard listener
   */
  attachGlobalListener() {
    const handler = (e) => {
      if (!this.isEnabled) return;

      // Build key combination string
      const key = this.getKeyString(e);
      
      // Check if this key combo is registered
      const shortcut = this.shortcuts.get(key);
      
      if (shortcut) {
        // Don't prevent default for certain keys in inputs
        if (!this.shouldIgnoreInInput(e)) {
          shortcut.handler(e);
        }
      }
    };

    document.addEventListener('keydown', handler);
    this.listeners.push(() => document.removeEventListener('keydown', handler));
  }

  /**
   * Get key string from event
   */
  getKeyString(e) {
    const parts = [];
    
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('cmd');
    if (e.shiftKey && !e.key.match(/^[A-Z]$/)) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    // Normalize key name
    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Check if input is focused
   */
  isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    );
  }

  /**
   * Should ignore shortcut in input fields
   */
  shouldIgnoreInInput(e) {
    if (!this.isInputFocused()) return false;
    
    // Allow Ctrl/Cmd shortcuts in inputs (except Ctrl+K)
    const key = this.getKeyString(e);
    if (key === 'ctrl+k' || key === 'cmd+k') return false;
    
    // Allow escape in inputs
    if (e.key === 'Escape') return false;
    
    // Ignore single key shortcuts in inputs
    return !e.ctrlKey && !e.metaKey && !e.altKey;
  }

  /**
   * Create command palette
   */
  createCommandPalette() {
    const paletteHTML = `
      <div id="command-palette" class="command-palette" style="display: none;">
        <div class="command-palette__backdrop"></div>
        <div class="command-palette__dialog">
          <div class="command-palette__header">
            <input 
              type="text" 
              id="command-palette-input" 
              class="command-palette__input"
              placeholder="Type a command or search..."
              autocomplete="off"
            />
          </div>
          <div class="command-palette__results" id="command-palette-results">
            <!-- Results will be rendered here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', paletteHTML);
    this.setupCommandPaletteListeners();
  }

  /**
   * Setup command palette event listeners
   */
  setupCommandPaletteListeners() {
    const input = document.getElementById('command-palette-input');
    const backdrop = document.querySelector('.command-palette__backdrop');

    if (input) {
      input.addEventListener('input', (e) => {
        this.filterCommands(e.target.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.executeSelectedCommand();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigateCommands('down');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigateCommands('up');
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.closeCommandPalette();
      });
    }
  }

  /**
   * Toggle command palette
   */
  toggleCommandPalette() {
    if (this.isCommandPaletteOpen) {
      this.closeCommandPalette();
    } else {
      this.openCommandPalette();
    }
  }

  /**
   * Open command palette
   */
  openCommandPalette() {
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('command-palette-input');
    
    if (palette) {
      palette.style.display = 'block';
      this.isCommandPaletteOpen = true;
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        input?.focus();
        this.filterCommands('');
      }, 100);
    }
  }

  /**
   * Close command palette
   */
  closeCommandPalette() {
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('command-palette-input');
    
    if (palette) {
      palette.style.display = 'none';
      this.isCommandPaletteOpen = false;
      document.body.style.overflow = '';
      
      if (input) input.value = '';
    }
  }

  /**
   * Filter commands based on search
   */
  filterCommands(query) {
    const results = document.getElementById('command-palette-results');
    if (!results) return;

    const commands = Array.from(this.shortcuts.values());
    const filtered = query
      ? commands.filter(cmd => 
          cmd.description.toLowerCase().includes(query.toLowerCase()) ||
          cmd.key.includes(query.toLowerCase())
        )
      : commands;

    if (filtered.length === 0) {
      results.innerHTML = `
        <div class="command-palette__empty">
          No commands found for "${query}"
        </div>
      `;
      return;
    }

    results.innerHTML = filtered.map((cmd, index) => `
      <div class="command-palette__item ${index === 0 ? 'command-palette__item--selected' : ''}" 
           data-command-key="${cmd.key}">
        <span class="command-palette__item-label">${cmd.description}</span>
        <kbd class="command-palette__item-shortcut">${this.formatShortcut(cmd.key)}</kbd>
      </div>
    `).join('');

    // Attach click handlers
    results.querySelectorAll('.command-palette__item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.commandKey;
        const shortcut = this.shortcuts.get(key);
        if (shortcut) {
          this.closeCommandPalette();
          shortcut.handler(new Event('keydown'));
        }
      });
    });
  }

  /**
   * Navigate through commands
   */
  navigateCommands(direction) {
    const results = document.getElementById('command-palette-results');
    if (!results) return;

    const items = Array.from(results.querySelectorAll('.command-palette__item'));
    const currentIndex = items.findIndex(item => 
      item.classList.contains('command-palette__item--selected')
    );

    if (items.length === 0) return;

    let newIndex;
    if (direction === 'down') {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }

    items.forEach((item, index) => {
      item.classList.toggle('command-palette__item--selected', index === newIndex);
    });

    // Scroll into view
    items[newIndex]?.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Execute selected command
   */
  executeSelectedCommand() {
    const results = document.getElementById('command-palette-results');
    if (!results) return;

    const selected = results.querySelector('.command-palette__item--selected');
    if (selected) {
      selected.click();
    }
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(key) {
    return key
      .split('+')
      .map(k => {
        const map = {
          'ctrl': '⌃',
          'cmd': '⌘',
          'shift': '⇧',
          'alt': '⌥',
          'space': '␣'
        };
        return map[k] || k.toUpperCase();
      })
      .join('');
  }

  /**
   * Show keyboard shortcuts help modal
   */
  showHelp() {
    const shortcuts = Array.from(this.shortcuts.values());
    const grouped = this.groupShortcuts(shortcuts);

    const helpHTML = `
      <div class="shortcuts-help-modal modal modal--open">
        <div class="modal__overlay"></div>
        <div class="modal__dialog">
          <header class="modal__header">
            <h2>Keyboard Shortcuts</h2>
            <button class="btn-icon" data-action="close-help-modal" title="Close">×</button>
          </header>
          <div class="modal__body">
            ${Object.entries(grouped).map(([category, cmds]) => `
              <div class="shortcuts-help-section">
                <h3 class="shortcuts-help-section__title">${category}</h3>
                <div class="shortcuts-help-list">
                  ${cmds.map(cmd => `
                    <div class="shortcuts-help-item">
                      <span class="shortcuts-help-item__label">${cmd.description}</span>
                      <kbd class="shortcuts-help-item__key">${this.formatShortcut(cmd.key)}</kbd>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const existingHelp = document.querySelector('.shortcuts-help-modal');
    if (existingHelp) existingHelp.remove();

    document.body.insertAdjacentHTML('beforeend', helpHTML);
    document.body.style.overflow = 'hidden';

    // Setup close handlers
    document.querySelectorAll('[data-action="close-help-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeHelp());
    });

    document.querySelector('.shortcuts-help-modal .modal__overlay')?.addEventListener('click', () => {
      this.closeHelp();
    });
  }

  /**
   * Close help modal
   */
  closeHelp() {
    const modal = document.querySelector('.shortcuts-help-modal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  }

  /**
   * Group shortcuts by category
   */
  groupShortcuts(shortcuts) {
    const groups = {
      'Navigation': [],
      'Actions': [],
      'Filters': [],
      'Help': []
    };

    shortcuts.forEach(cmd => {
      if (cmd.description.includes('palette') || cmd.description.includes('search') || cmd.description.includes('New') || cmd.description.includes('history')) {
        groups['Navigation'].push(cmd);
      } else if (cmd.description.includes('Mark') || cmd.description.includes('Reset') || cmd.description.includes('Close')) {
        groups['Actions'].push(cmd);
      } else if (cmd.description.includes('Show') || cmd.description.includes('Filter')) {
        groups['Filters'].push(cmd);
      } else {
        groups['Help'].push(cmd);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    // Close command palette
    if (this.isCommandPaletteOpen) {
      this.closeCommandPalette();
      return;
    }

    // Close help modal
    const helpModal = document.querySelector('.shortcuts-help-modal');
    if (helpModal) {
      this.closeHelp();
      return;
    }

    // Close other modals
    document.querySelectorAll('.modal--open').forEach(modal => {
      modal.classList.remove('modal--open');
    });
    document.body.style.overflow = '';
  }

  /**
   * Enable shortcuts
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable shortcuts
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Destroy service
   */
  destroy() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    this.shortcuts.clear();
  }
}

// Export singleton instance
export const keyboardShortcuts = new KeyboardShortcutsService();