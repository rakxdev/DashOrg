
# Component Documentation

> Detailed documentation for all UI components and modules

## Table of Contents

- [Overview](#overview)
- [UI Components](#ui-components)
  - [Site Card](#site-card)
  - [Credential Card](#credential-card)
  - [Progress Ring](#progress-ring)
  - [Toast Notifications](#toast-notifications)
  - [Modal Dialogs](#modal-dialogs)
- [HTML Components](#html-components)
  - [Add Site Modal](#add-site-modal)
  - [History Modal](#history-modal)
- [Service Components](#service-components)
- [Usage Examples](#usage-examples)

---

## Overview

The application uses a component-based architecture with:

- **Reusable UI components** rendered dynamically
- **HTML template components** loaded asynchronously
- **Service components** for business logic
- **Shared utilities** for common functionality

---

## UI Components

### Site Card

**Purpose:** Display site information with credentials and progress

**Location:** Rendered by [`main.js`](../src/main.js:142)

#### Structure

```html
<article class="site-card" data-site-id="site-123">
  <header class="site-card__header">
    <div class="site-card__title">
      <span class="site-card__icon">🌐</span>
      <div>
        <h3 class="site-card__name">Gmail</h3>
        <a class="site-card__url" href="https://gmail.com">Visit</a>
      </div>
    </div>
    <div class="inline-stack">
      <span class="status-pill" data-status="done">Done</span>
      <button class="btn-icon" data-action="reset-site">↻</button>
      <button class="btn-icon" data-action="delete-site">🗑</button>
    </div>
  </header>
  
  <div class="site-card__tags">
    <span class="tag">work</span>
    <span class="tag">important</span>
  </div>
  
  <div class="site-card__progress">
    <div class="progress-bar">
      <div class="progress-bar__fill" style="width: 75%"></div>
    </div>
    <span class="progress-bar__label">75% complete</span>
  </div>
  
  <ul class="credentials-list">
    <!-- Credential cards here -->
  </ul>
</article>
```

#### Props

```javascript
{
  id: String,              // Unique site ID
  name: String,            // Site name
  url: String,             // Site URL
  icon: String,            // Emoji or image
  tags: Array<String>,     // Site tags
  credentials: Array,      // Credential objects
  status: String           // 'pending', 'done', 'partial', 'empty'
}
```

#### States

- **Empty** - No credentials
- **Pending** - No credentials checked in today
- **Partial** - Some credentials checked in
- **Done** - All credentials checked in

#### Actions

- **Reset Site** - Reset all credentials for today
- **Delete Site** - Remove site and all credentials
- **Visit** - Open site URL in new tab

#### Styling

```css
.site-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.site-card--complete {
  border-left: 4px solid var(--color-success);
}
```

---

### Credential Card

**Purpose:** Display individual credential with check-in status

**Location:** Rendered by [`main.js`](../src/main.js:186)

#### Structure

```html
<li class="credential-card credential-card--checked">
  <div class="credential-card__header">
    <span class="credential-card__label">Personal</span>
    <div class="inline-stack">
      <button class="btn btn--tiny btn--success" 
              data-action="toggle-check">
        Checked ✓
      </button>
      <button class="btn-icon btn-icon--sm" 
              data-action="edit-credential">
        ✏️
      </button>
    </div>
  </div>
  
  <div class="credential-card__body">
    <div class="credential-field">
      <span class="credential-field__label">Email</span>
      <span class="credential-field__value">user@example.com</span>
      <button class="btn--plain" data-action="copy-email">Copy</button>
    </div>
    
    <div class="credential-field">
      <span class="credential-field__label">Password</span>
      <span class="credential-field__value credential-password--masked">
        ••••••••
      </span>
      <div class="inline-stack">
        <button class="btn--plain" data-action="toggle-password">Show</button>
        <button class="btn--plain" data-action="copy-password">Copy</button>
      </div>
    </div>
    
    <div class="credential-notes">
      <strong>Notes:</strong> Security question: mother's maiden name
    </div>
  </div>
  
  <div class="credential-card__footer">
    <span class="credential-last-check">
      Checked in today at 10:30 AM
    </span>
  </div>
</li>
```

#### Props

```javascript
{
  id: String,              // Unique credential ID
  siteId: String,          // Parent site ID
  label: String,           // Credential label
  email: String,           // Email/username
  password: String,        // Password (hidden by default)
  notes: String,           // Optional notes
  checkedInOn: String,     // ISO timestamp or null
  isChecked: Boolean       // Checked in today?
}
```

#### States

- **Unchecked** - Not checked in today (white background)
- **Checked** - Checked in today (green left border)

#### Actions

- **Check In / Uncheck** - Toggle check-in status
- **Edit** - Edit credential details
- **Copy Email** - Copy email to clipboard
- **Copy Password** - Copy password to clipboard
- **Show/Hide Password** - Toggle password visibility

#### Styling

```css
.credential-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.credential-card--checked {
  border-left: 3px solid var(--color-success);
  background: var(--color-success-light);
}
```

---

### Progress Ring

**Purpose:** Circular progress indicator showing daily completion

**Location:** Rendered by [`main.js`](../src/main.js:90)

#### Structure

```html
<div class="progress-ring">
  <svg viewBox="0 0 120 120">
    <circle class="progress-ring__bg" 
            cx="60" cy="60" r="54" />
    <circle class="progress-ring__value" 
            cx="60" cy="60" r="54"
            style="stroke-dasharray: 339.292; 
                   stroke-dashoffset: 101.788;" />
  </svg>
  <div class="progress-ring__content">
    <span class="progress-ring__percent">70%</span>
    <span class="progress-ring__label">Complete</span>
  </div>
</div>
```

#### Props

```javascript
{
  percentage: Number,      // 0-100
  total: Number,           // Total credentials
  checked: Number          // Checked credentials
}
```

#### Calculation

```javascript
const radius = 54;
const circumference = 2 * Math.PI * radius; // 339.292
const offset = circumference - (percentage / 100) * circumference;

progressRing.style.strokeDasharray = circumference;
progressRing.style.strokeDashoffset = offset;
```

#### Styling

```css
.progress-ring__value {
  stroke: var(--color-primary);
  stroke-width: 8;
  stroke-linecap: round;
  fill: none;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.5s ease;
}
```

---

### Toast Notifications

**Purpose:** Display temporary notification messages

**Location:** [`src/shared/components/toast.js`](../src/shared/components/toast.js)

#### Usage

```javascript
import { toast } from './shared/components/toast.js';

// Success message
toast.success('Site added successfully!', 3000);

// Error message
toast.error('Failed to save changes', 5000);

// Warning message
toast.warning('Password is weak', 4000);

// Info message
toast.info('New feature available', 3000);
```

#### Structure

```html
<div class="toast-container">
  <div class="toast toast--success toast--visible">
    <span class="toast__icon">✓</span>
    <span class="toast__message">Site added successfully!</span>
    <button class="toast__close">×</button>
  </div>
</div>
```

#### Types

- **Success** - Green, checkmark icon
- **Error** - Red, X icon
- **Warning** - Orange, warning icon
- **Info** - Blue, info icon

#### API

```javascript
class Toast {
  // Show toast
  show(message, type, duration)
  
  // Type-specific methods
  success(message, duration)
  error(message, duration)
  warning(message, duration)
  info(message, duration)
  
  // Remove toast
  remove(toast)
  
  // Clear all toasts
  clearAll()
}
```

#### Styling

```css
.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease;
}

.toast--success {
  background: var(--color-success);
  color: white;
}
```

---

### Modal Dialogs

**Purpose:** Display modal dialogs for forms and content

**Location:** [`src/shared/components/modal.js`](../src/shared/components/modal.js)

#### Usage

```javascript
import { Modal } from './shared/components/modal.js';

// Create modal
const modal = new Modal('my-modal', {
  closeOnOverlay: true,
  closeOnEscape: true
});

// Create modal structure
modal.create(
  'Modal Title',
  '<p>Modal content here</p>',
  '<button>Save</button>'
);

// Open modal
modal.open();

// Close modal
modal.close();

// Update content
modal.updateContent('<p>New content</p>');

// Destroy modal
modal.destroy();
```

#### Structure

```html
<div class="modal modal--open" aria-hidden="false">
  <div class="modal__overlay"></div>
  <div class="modal__content" role="dialog" aria-modal="true">
    <header class="modal__header">
      <h2>Modal Title</h2>
      <button class="btn-icon" data-close-modal>×</button>
    </header>
    <div class="modal__body">
      <!-- Content here -->
    </div>
    <footer class="modal__footer">
      <!-- Footer buttons -->
    </footer>
  </div>
</div>
```

#### Options

```javascript
{
  closeOnOverlay: Boolean,  // Close when clicking overlay
  closeOnEscape: Boolean    // Close on Escape key
}
```

#### API

```javascript
class Modal {
  constructor(id, options)
  
  // Create modal element
  create(title, content, footer)
  
  // Open/close
  open()
  close()
  
  // Update content
  updateContent(content)
  updateTitle(title)
  
  // Lifecycle
  onClose(callback)
  destroy()
}
```

#### Styling

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
}

.modal--open {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal__content {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}
```

---

## HTML Components

### Add Site Modal

**Purpose:** Form for adding new sites and credentials

**Location:** [`src/components/add-site-modal.html`](../src/components/add-site-modal.html)

#### Features

- **Site selector** - Add to existing or create new
- **Dynamic credential fields** - Add multiple credentials
- **Label suggestions** - Dropdown with existing labels
- **Password generator** - Generate strong passwords
- **Password strength meter** - Visual strength indicator
- **Form validation** - Required field validation

#### Structure

```html
<div id="add-site-modal" class="modal">
  <div class="modal__overlay"></div>
  <div class="modal__content">
    <header class="modal__header">
      <h2>Add Site</h2>
      <button class="btn-icon" data-action="close-modal">×</button>
    </header>
    
    <div class="modal__body">
      <form id="add-site-form">
        <!-- Site selector -->
        <select id="site-selector">
          <option value="new">➕ Create New Site</option>
          <!-- Existing sites populated dynamically -->
        </select>
        
        <!-- Site info (shown when creating new) -->
        <div id="site-info-section">
          <input type="text" name="site-name" placeholder="Site Name" />
          <input type="url" name="site-url" placeholder="https://..." />
          <input type="text" name="site-tags" placeholder="Tags (comma-separated)" />
        </div>
        
        <!-- Credentials container -->
        <div id="credentials-container">
          <!-- Credential fields added dynamically -->
        </div>
        
        <button type="button" data-action="add-credential-field">
          + Add Another Credential
        </button>
      </form>
    </div>
    
    <footer class="modal__footer">
      <button class="btn btn--ghost" data-action="close-modal">
        Cancel
      </button>
      <button class="btn btn--primary" data-action="submit-form">
        Save Site
      </button>
    </footer>
  </div>
</div>
```

#### Dynamic Credential Field

```html
<div class="credential-form-item">
  <div class="credential-form-item__header">
    <h4>Credential 1</h4>
    <button type="button" data-action="remove-credential">×</button>
  </div>
  
  <!-- Label selector -->
  <select name="credential-label-select">
    <option value="">-- Select existing or type below --</option>
    <option value="Personal">Personal</option>
    <option value="Work">Work</option>
    <option value="__new__">➕ Create New Label</option>
  </select>
  
  <!-- Custom label input (shown when "Create New" selected) -->
  <input type="text" data-label-input placeholder="New label name" />
  
  <!-- Email -->
  <input type="text" name="credential-email" placeholder="Email/Username" />
  
  <!-- Password with controls -->
  <div class="password-input-group">
    <input type="password" name="credential-password" />
    <button type="button" data-action="toggle-password-visibility">👁️</button>
    <button type="button" data-action="generate-password">Generate</button>
  </div>
  
  <!-- Password strength meter -->
  <div class="password-strength-meter">
    <div class="password-strength-meter__bar"></div>
    <span class="password-strength-meter__label"></span>
  </div>
  
  <!-- Notes -->
  <textarea name="credential-notes" placeholder="Notes (optional)"></textarea>
</div>
```

---

### History Modal

**Purpose:** Display check-in history with filtering

**Location:** [`src/components/history-modal.html`](../src/components/history-modal.html)

#### Features

- **Date filtering** - Today, Yesterday, Last 