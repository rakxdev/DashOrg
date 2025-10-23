
# CSS Architecture Guide

> Comprehensive guide to the CSS architecture and styling system

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Naming Conventions](#naming-conventions)
- [CSS Variables](#css-variables)
- [Design Tokens](#design-tokens)
- [Component Styling](#component-styling)
- [Responsive Design](#responsive-design)
- [Animations](#animations)
- [Best Practices](#best-practices)

---

## Overview

The CSS architecture follows a **modular, scalable approach** with:

- **Modular CSS files** - Separate files for different concerns
- **BEM methodology** - Block Element Modifier naming
- **CSS Custom Properties** - Variables for theming
- **Mobile-first** - Responsive design approach
- **No preprocessors** - Pure CSS3

### Design Philosophy

1. **Maintainability** - Easy to update and extend
2. **Scalability** - Grows with the application
3. **Performance** - Minimal CSS, efficient selectors
4. **Consistency** - Unified design language
5. **Accessibility** - WCAG 2.1 AA compliant

---

## File Structure

### CSS Organization

```
src/assets/css/
├── main.css           # Imports orchestrator
├── variables.css      # Design tokens & CSS variables
├── base.css           # Reset, base styles, animations
├── layout.css         # Page layout, grid, containers
├── components.css     # Reusable UI components
├── forms.css          # Form elements & inputs
├── modal.css          # Modal dialog styles
├── cards.css          # Site & credential cards
└── toast.css          # Toast notification styles
```

### Import Order

**[`main.css`](../src/assets/css/main.css)**

```css
/* 1. Variables - Design tokens first */
@import './variables.css';

/* 2. Base - Reset and foundational styles */
@import './base.css';

/* 3. Layout - Page structure */
@import './layout.css';

/* 4. Components - Reusable UI elements */
@import './components.css';

/* 5. Forms - Input elements */
@import './forms.css';

/* 6. Modals - Dialog boxes */
@import './modal.css';

/* 7. Cards - Content cards */
@import './cards.css';

/* 8. Toast - Notifications */
@import './toast.css';
```

**Why this order?**
- Variables must load first (used by all)
- Base styles before components
- General before specific
- Layout before content

---

## Naming Conventions

### BEM (Block Element Modifier)

**Block** - Standalone component

```css
.site-card { }
.modal { }
.toast { }
```

**Element** - Part of a block

```css
.site-card__header { }
.site-card__title { }
.site-card__icon { }
```

**Modifier** - Variation of block or element

```css
.site-card--complete { }
.site-card--pending { }
.btn--primary { }
.btn--ghost { }
```

### BEM Examples

```html
<!-- Block -->
<article class="site-card">
  <!-- Element -->
  <header class="site-card__header">
    <!-- Element with modifier -->
    <h3 class="site-card__title site-card__title--large">
      Site Name
    </h3>
  </header>
  
  <!-- Element -->
  <div class="site-card__body">
    Content
  </div>
</article>

<!-- Block with modifier -->
<article class="site-card site-card--complete">
  ...
</article>
```

### Utility Classes

For common patterns:

```css
.inline-stack { display: inline-flex; gap: 0.5rem; }
.btn--plain { background: none; border: none; }
.sr-only { /* Screen reader only */ }
```

---

## CSS Variables

### Variable Naming

```css
--{property}-{variant}-{state}
```

Examples:
```css
--color-primary
--color-primary-hover
--spacing-sm
--radius-md
```

### Variable Structure

**[`variables.css`](../src/assets/css/variables.css)**

```css
:root {
  /* Colors - Base */
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
  
  /* Colors - Neutrals */
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-surface: #ffffff;
  --color-background: #f9fafb;
  
  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
  
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-md: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Border Radius */
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Z-index layers */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-overlay: 900;
  --z-modal: 1000;
  --z-toast: 1100;
}
```

### Dark Theme Variables

```css
[data-theme="dark"] {
  --color-text: #f9fafb;
  --color-text-muted: #d1d5db;
  --color-border: #374151;
  --color-surface: #1f2937;
  --color-background: #111827;
}
```

---

## Design Tokens

### Color Palette

#### Primary Colors

```css
--color-primary: #3b82f6;      /* Blue - Main brand */
--color-primary-light: #60a5fa;
--color-primary-dark: #2563eb;
```

**Usage:** Primary actions, links, focus states

#### Semantic Colors

```css
--color-success: #10b981;      /* Green - Success states */
--color-warning: #f59e0b;      /* Orange - Warnings */
--color-error: #ef4444;        /* Red - Errors */
--color-info: #06b6d4;         /* Cyan - Information */
```

**Usage:** Feedback, status indicators, alerts

#### Neutral Colors

```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Spacing Scale

Based on 4px baseline:

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

**Usage:**
```css
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}
```

### Typography Scale

Modular scale (1.125 ratio):

```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-md: 1rem;       /* 16px - base */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
```

---

## Component Styling

### Button Component

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

/* Primary variant */
.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Ghost variant */
.btn--ghost {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn--ghost:hover {
  background: var(--color-gray-50);
}

/* Size variants */
.btn--tiny {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn--large {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
}

/* State variants */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading {
  position: relative;
  color: transparent;
}

.btn--loading::after {
  content: "";
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### Card Component

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.card__body {
  color: var(--color-text-muted);
  line-height: 1.6;
}
```

### Form Elements

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.field input,
.field select,
.field textarea {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-md);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field input:invalid {
  border-color: var(--color-error);
}

.field__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.field__error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Media Queries

```css
/* Mobile (default) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large desktop */
@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Container Queries (Future)

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: auto 1fr;
  }
}
```

---

## Animations

### Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Animation Usage

```css
.toast {
  animation: slideIn 0.3s ease;
}

.loading {
  animation: pulse 2s infinite;
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Transition Best Practices

```css
/* ✅ Good: Specific properties */
.btn {
  transition: background-color 200ms ease,
              transform 200ms ease,
              box-shadow 200ms ease;
}

/* ❌ Bad: Generic 'all' */
.btn {
  transition: all 200ms ease;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Best Practices

### 1. Use CSS Variables

**✅ Good:**
```css
.card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  color: var(--color-text);
}
```

**❌ Bad:**
```css
.card {
  padding: 24px;
  border-radius: 8px;
  color: #1f2937;
}
```

### 2. Mobile-First Responsive

**✅ Good:**
```css
/* Mobile default */
.container {
  padding: 1rem;
}

/* Desktop override */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
  }
}
```

**❌ Bad:**
```css
/* Desktop default */
.container {
  padding: 2rem;
}

/* Mobile override */
