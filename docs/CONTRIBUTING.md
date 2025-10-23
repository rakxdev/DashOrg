
# Contributing to DashOrg

> Enhanced Credential Dashboard

> Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or insults
- Unwelcome sexual attention
- Publishing others' private information

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Text editor or IDE (VS Code recommended)
- Basic knowledge of HTML, CSS, and JavaScript (ES6+)
- Git for version control

### Quick Start

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dashorg.git
   cd dashorg
   ```

3. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   # No build process required!
   ```

4. **Start developing**
   ```bash
   # Edit files and refresh browser to see changes
   ```

---

## Development Setup

### Recommended Tools

#### Code Editor
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Live Server
  - JavaScript (ES6) code snippets

#### Browser Extensions
- **Chrome DevTools** for debugging
- **React Developer Tools** (for component inspection)

### File Organization

```
dashorg/
├── docs/                    # Documentation
│   ├── API.md              # API reference
│   ├── ARCHITECTURE.md     # Architecture overview
│   ├── COMPONENTS.md       # Component docs
│   └── CONTRIBUTING.md     # This file
├── src/
│   ├── main.js             # Entry point
│   ├── config.js           # Configuration
│   ├── core/               # Core services
│   ├── features/           # Feature modules
│   ├── shared/             # Shared utilities
│   ├── components/         # HTML components
│   └── assets/css/         # Stylesheets
└── index.html              # Main HTML file
```

---

## Project Structure

### Architecture Overview

The project follows a **modular service-based architecture**:

```
┌─────────────────────────────────────────┐
│           index.html (UI)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           main.js (App)                 │
│  - Initialize services                  │
│  - Render UI                            │
│  - Handle events                        │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌──────▼──────┐
│   Core     │   │  Features   │
│  Services  │   │  Services   │
├────────────┤   ├─────────────┤
│ - State    │   │ - Sites     │
│ - Storage  │   │ - Creds     │
│ - Crypto   │   │ - Analytics │
└────────────┘   └─────────────┘
```

### Module Responsibilities

#### Core Services
- **State Manager**: Central state management
- **Storage Service**: LocalStorage operations
- **Crypto Service**: Encryption utilities

#### Feature Services
- **Sites Service**: Site management logic
- **Credentials Service**: Credential operations
- **Analytics Service**: Usage tracking

#### Shared Components
- **Toast**: Notifications
- **Modal**: Dialog boxes
- **Constants**: Utility functions

---

## Development Workflow

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `style/` - UI/CSS changes
- `test/` - Test additions

### 2. Make Changes

#### Adding a New Feature

1. **Plan the feature**
   - Review existing code
   - Check for similar implementations
   - Consider impact on existing features

2. **Implement the feature**
   - Follow coding standards
   - Add comments for complex logic
   - Keep functions small and focused

3. **Test thoroughly**
   - Test in multiple browsers
   - Test edge cases
   - Test with existing data

#### Fixing a Bug

1. **Reproduce the bug**
   - Create test case
   - Document steps to reproduce

2. **Identify root cause**
   - Use browser DevTools
   - Add console logs
   - Check related code

3. **Implement fix**
   - Fix the root cause
   - Ensure no regressions
   - Add comments explaining the fix

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add password strength indicator"
```

#### Commit Message Format

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, CSS
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

**Examples:**
```bash
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve check-in date calculation bug"
git commit -m "docs: update API documentation"
```

### 4. Push Changes

```bash
# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template
5. Submit for review

---

## Coding Standards

### JavaScript Style Guide

#### General Principles

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Keep functions pure when possible
- Avoid deep nesting

#### Code Examples

**✅ Good:**
```javascript
// Descriptive names, const, arrow functions
const getCompletedSites = () => {
  const sites = stateManager.getSites();
  return sites.filter(site => isSiteComplete(site));
};

// Clear, single responsibility
const isSiteComplete = (site) => {
  return site.credentials.every(cred => 
    cred.checkedInOn && isToday(cred.checkedInOn)
  );
};
```

**❌ Bad:**
```javascript
// Unclear names, var, too complex
var x = function() {
  var s = stateManager.getSites();
  var result = [];
  for(var i = 0; i < s.length; i++) {
    var complete = true;
    for(var j = 0; j < s[i].credentials.length; j++) {
      if(!s[i].credentials[j].checkedInOn) {
        complete = false;
      }
    }
    if(complete) result.push(s[i]);
  }
  return result;
};
```

#### Documentation Comments

```javascript
/**
 * Calculate site completion percentage
 * @param {Object} site - Site object
 * @returns {Number} Percentage (0-100)
 */
const getSiteProgress = (site) => {
  if (!site.credentials?.length) return 0;
  
  const checked = site.credentials.filter(c => 
    isCheckedToday(c)
  ).length;
  
  return Math.round((checked / site.credentials.length) * 100);
};
```

### CSS Style Guide

#### BEM Methodology

Use Block Element Modifier naming:

```css
/* Block */
.site-card { }

/* Element */
.site-card__header { }
.site-card__title { }

/* Modifier */
.site-card--complete { }
.site-card--pending { }
```

#### CSS Variables

Use CSS custom properties for theming:

```css
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --spacing-md: 1rem;
}

.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
}
```

#### Responsive Design

Mobile-first approach:

```css
/* Mobile first (default) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### HTML Best Practices

#### Semantic HTML

```html
<!-- ✅ Good: Semantic elements -->
<article class="site-card">
  <header class="site-card__header">
    <h3>Site Name</h3>
  </header>
  <section class="site-card__content">
    <p>Content here</p>
  </section>
</article>

<!-- ❌ Bad: Non-semantic divs -->
<div class="site-card">
  <div class="site-card__header">
    <div>Site Name</div>
  </div>
  <div class="site-card__content">
    <div>Content here</div>
  </div>
</div>
```

#### Accessibility

```html
<!-- ARIA labels -->
<button aria-label="Close modal" class="btn-icon">×</button>

<!-- Keyboard navigation -->
<div role="dialog" aria-modal="true" tabindex="-1">
  <h2 id="modal-title">Modal Title</h2>
</div>

<!-- Alt text for images -->
<img src="icon.png" alt="Settings icon">
```

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

#### Functionality
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No broken features
- [ ] Data persists correctly

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Responsive Design
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)

#### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible

### Testing Tools

```javascript
// Add test data via console
const testSite = {
  name: 'Test Site',
  url: 'https://test.com',
  credentials: [{
    label: 'Test',
    email: 'test@test.com',
    password: 'TestPass123!'
  }]
};
sitesService.createSite(testSite);

// Check state
console.log(stateManager.getState());

// Test export/import
const data = await stateManager.exportData('json');
console.log(data);
```

---

## Submitting Changes

### Pull Request Checklist

- [ ] Code follows style guide
- [ ] No console errors or warnings
- [ ] Tested in multiple browsers
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] PR description explains changes
- [ ] Screenshots included (for UI changes)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guide
- [ ] Tested in multiple browsers
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** (if configured)
2. **Code review** by maintainers
3. **Feedback** and requested changes
4. **Approval** and merge

---

## Documentation

### When to Update Docs

Update documentation when:
- Adding new features
- Changing public APIs
- Modifying configuration
- Fixing important bugs
- Improving architecture

### Documentation Files

- **README.md** - Overview and quick start
- **HOW-IT-WORKS.md** - User guide
- **docs/API.md** - API reference
- **docs/ARCHITECTURE.md** - Technical architecture
- **docs/COMPONENTS.md** - Component documentation
- **docs/CSS-ARCHITECTURE.md** - CSS guide

### Writing Good Documentation

#### Be Clear and Concise

**✅ Good:**
```markdown
## Adding a Site

Click the "Add Site" button, enter the site name and URL, 
then add credentials with labels like "Personal" or "Work".
```

**❌ Bad:**
```markdown
## Adding a Site

You can add sites by clicking on the button that says 
"Add Site" which you'll find at the top of the page...
```

#### Include Code Examples

```markdown
### Using the Sites Service

```javascript
// Create a new site
const site = sitesService.createSite({
  name: 'GitHub',
  url: 'https://github.com',
  credentials: [...]
});
```
```

#### Use Screenshots

For UI features, include annotated screenshots showing:
- Where to find the feature
- What the feature looks like
- Expected results

---

## Common Tasks

### Adding a New Service

1. Create file in appropriate directory
2. Export singleton instance
3. Import in main.js
4. Update documentation

```javascript
// src/features/example/example.service.js
class ExampleService {
  constructor() {
    // Initialize
  }
  
  doSomething() {
    // Implementation
  }
}

export const exampleService = new ExampleService();
```

### Adding a New CSS Module

1. Create file in `src/assets/css/`
2. Import in `main.css`
3. Use BEM naming
4. Document new classes

```css
/* src/assets/css/new-component.css */
.new-component {
  /* Styles */
}

.new-component__element {
  /* Element styles */
}
```

```css
/* src/assets/css/main.css */
@import './new-component.css';
```

### Adding a Configuration Option

1. Add to `src/config.js`
2. Use in relevant service
3. Update documentation

```javascript
// src/config.js
export const 