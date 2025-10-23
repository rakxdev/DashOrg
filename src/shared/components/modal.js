/**
 * Modal Component
 * Reusable modal dialog
 */

export class Modal {
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      closeOnOverlay: true,
      closeOnEscape: true,
      ...options
    };
    this.element = null;
    this.isOpen = false;
    this.onCloseCallback = null;
  }

  /**
   * Create modal element
   */
  create(title, content, footer = '') {
    const modal = document.createElement('div');
    modal.id = this.id;
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal__overlay" data-close-modal></div>
      <div class="modal__content" role="dialog" aria-modal="true" aria-labelledby="${this.id}-title">
        <header class="modal__header">
          <h2 id="${this.id}-title">${title}</h2>
          <button class="btn-icon" data-close-modal aria-label="Close">×</button>
        </header>
        <div class="modal__body">
          ${content}
        </div>
        ${footer ? `<footer class="modal__footer">${footer}</footer>` : ''}
      </div>
    `;

    document.body.appendChild(modal);
    this.element = modal;
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.element) return;

    // Close buttons
    this.element.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Escape key
    if (this.options.closeOnEscape) {
      this.escapeHandler = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }
  }

  /**
   * Open modal
   */
  open() {
    if (!this.element) return;

    this.isOpen = true;
    this.element.setAttribute('aria-hidden', 'false');
    this.element.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const firstInput = this.element.querySelector('input, textarea, select, button');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Close modal
   */
  close() {
    if (!this.element) return;

    this.isOpen = false;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('modal--open');
    document.body.style.overflow = '';

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * Set on close callback
   */
  onClose(callback) {
    this.onCloseCallback = callback;
  }

  /**
   * Update content
   */
  updateContent(content) {
    if (!this.element) return;
    const body = this.element.querySelector('.modal__body');
    if (body) body.innerHTML = content;
  }

  /**
   * Update title
   */
  updateTitle(title) {
    if (!this.element) return;
    const titleElement = this.element.querySelector('.modal__header h2');
    if (titleElement) titleElement.textContent = title;
  }

  /**
   * Destroy modal
   */
  destroy() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    if (this.element) {
      this.element.remove();
    }
    this.element = null;
    this.isOpen = false;
  }
}