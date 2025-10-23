/**
 * Toast Notification Component
 * Display temporary notification messages
 */

export class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  /**
   * Show toast notification
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    
    const icon = this.getIcon(type);
    toast.innerHTML = `
      <span class="toast__icon">${icon}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Close">×</button>
    `;

    this.container.appendChild(toast);

    // Close button
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    // Animate in
    setTimeout(() => toast.classList.add('toast--visible'), 10);

    return toast;
  }

  /**
   * Show success toast
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error toast
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning toast
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info toast
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  /**
   * Remove toast
   */
  remove(toast) {
    toast.classList.remove('toast--visible');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach(toast => this.remove(toast));
  }

  /**
   * Get icon for type
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }
}

// Export singleton instance
export const toast = new Toast();