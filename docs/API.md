# API Documentation

> Complete API reference for DashOrg - Enhanced Credential Dashboard

## Table of Contents

- [Core Services](#core-services)
  - [State Manager](#state-manager)
  - [Storage Service](#storage-service)
- [Feature Services](#feature-services)
  - [Sites Service](#sites-service)
  - [Credentials Service](#credentials-service)
  - [Analytics Service](#analytics-service)
- [Shared Components](#shared-components)
  - [Toast](#toast)
  - [Modal](#modal)
- [Utilities](#utilities)
  - [Constants](#constants)
  - [Component Loader](#component-loader)
- [Configuration](#configuration)
- [Events](#events)

---

## Core Services

### State Manager

**Path:** [`src/core/state.js`](../src/core/state.js)

Central state management with event-driven architecture.

#### Methods

##### `init()`
Initialize state manager and load persisted state.

```javascript
await stateManager.init();
```

**Returns:** `Promise<void>`

---

##### `getState()`
Get current application state.

```javascript
const state = stateManager.getState();
```

**Returns:** `Object` - Current state object

---

##### `getSites()`
Get all sites.

```javascript
const sites = stateManager.getSites();
```

**Returns:** `Array<Site>` - Array of site objects

---

##### `getFilteredSites()`
Get sites filtered by current filters.

```javascript
const filteredSites = stateManager.getFilteredSites();
```

**Returns:** `Array<Site>` - Filtered sites array

**Filters Applied:**
- Search query (name, URL, tags, credentials)
- Status (all, done, pending)
- Category
- Tags

---

##### `addSite(siteData)`
Add new site.

```javascript
const newSite = stateManager.addSite({
  name: 'Gmail',
  url: 'https://gmail.com',
  credentials: [...]
});
```

**Parameters:**
- `siteData` (Object) - Site configuration

**Returns:** `Site` - Created site object

**Events Emitted:**
- `EVENTS.SITE_ADDED`
- `EVENTS.STATE_CHANGED`

---

##### `updateSite(id, updates)`
Update existing site.

```javascript
stateManager.updateSite('site-id-123', {
  name: 'New Name',
  tags: ['work', 'important']
});
```

**Parameters:**
- `id` (String) - Site ID
- `updates` (Object) - Updates to apply

**Returns:** `Boolean` - Success status

---

##### `checkInCredential(siteId, credentialId)`
Mark credential as checked in.

```javascript
stateManager.checkInCredential('site-id', 'cred-id');
```

**Parameters:**
- `siteId` (String) - Site ID
- `credentialId` (String) - Credential ID

**Returns:** `Boolean` - Success status

---

##### `getProgressStats()`
Get daily progress statistics.

```javascript
const stats = stateManager.getProgressStats();
// { total: 10, checked: 7, percentage: 70 }
```

**Returns:** `Object`
```javascript
{
  total: Number,        // Total credentials
  checked: Number,      // Checked today
  percentage: Number    // Completion percentage
}
```

---

##### `setFilters(filters)`
Update active filters.

```javascript
stateManager.setFilters({
  search: 'gmail',
  status: 'done'
});
```

**Parameters:**
- `filters` (Object) - Filters to apply

---

##### `on(event, callback)`
Subscribe to events.

```javascript
const unsubscribe = stateManager.on(EVENTS.STATE_CHANGED, (state) => {
  console.log('State updated:', state);
});
```

**Parameters:**
- `event` (String) - Event name
- `callback` (Function) - Event handler

**Returns:** `Function` - Unsubscribe function

---

### Storage Service

**Path:** [`src/core/storage.js`](../src/core/storage.js)

Handles localStorage operations and data persistence.

#### Methods

##### `init()`
Initialize storage and check for daily reset.

```javascript
await storageService.init();
```

---

##### `getState()`
Retrieve current state from localStorage.

```javascript
const state = storageService.getState();
```

**Returns:** `Object|null`

---

##### `setState(state)`
Save state to localStorage.

```javascript
storageService.setState(newState);
```

**Returns:** `Boolean` - Success status

---

##### `addSite(siteData)`
Add new site to storage.

```javascript
const site = storageService.addSite({
  name: 'Example',
  url: 'https://example.com',
  credentials: []
});
```

**Returns:** `Site` - Created site

---

##### `exportData(format, includeHistory, encrypt, password)`
Export data in specified format.

```javascript
const data = await storageService.exportData('json', true, false);
```

**Parameters:**
- `format` (String) - 'json' or 'csv'
- `includeHistory` (Boolean) - Include check-in history
- `encrypt` (Boolean) - Encrypt export
- `password` (String, optional) - Encryption password

**Returns:** `Promise<String>` - Exported data

---

## Feature Services

### Sites Service

**Path:** [`src/features/sites/sites.service.js`](../src/features/sites/sites.service.js)

Business logic for site management.

#### Methods

##### `createSite(siteData)`
Create new site with metadata.

```javascript
const site = sitesService.createSite({
  name: 'GitHub',
  url: 'https://github.com',
  category: 'work',
  tags: ['development'],
  credentials: []
});
```

**Returns:** `Site` - Created site with generated ID and metadata

---

##### `getSiteStatus(site)`
Get site completion status.

```javascript
const status = sitesService.getSiteStatus(site);
// Returns: 'empty' | 'pending' | 'partial' | 'done'
```

**Returns:** `String` - Status label

---

##### `getSiteProgress(site)`
Get site completion percentage.

```javascript
const progress = sitesService.getSiteProgress(site);
// Returns: 75
```

**Returns:** `Number` - Percentage (0-100)

---

##### `getPendingSites()`
Get sites with unchecked credentials.

```javascript
const pending = sitesService.getPendingSites();
```

**Returns:** `Array<Site>`

---

##### `sortSites(sites, sortBy, order)`
Sort sites by property.

```javascript
const sorted = sitesService.sortSites(sites, 'name', 'asc');
```

**Parameters:**
- `sites` (Array) - Sites to sort
- `sortBy` (String) - 'name', 'priority', 'progress', 'createdAt'
- `order` (String) - 'asc' or 'desc'

**Returns:** `Array<Site>`

---

### Credentials Service

**Path:** [`src/features/credentials/credentials.service.js`](../src/features/credentials/credentials.service.js)

Business logic for credential management.

#### Methods

##### `addCredential(siteId, credentialData)`
Add credential to site.

```javascript
const credential = credentialsService.addCredential('site-id', {
  label: 'Personal',
  email: 'user@example.com',
  password: 'secure-password'
});
```

**Returns:** `Credential` - Created credential

---

##### `toggleCheckIn(siteId, credentialId)`
Toggle credential check-in status.

```javascript
credentialsService.toggleCheckIn('site-id', 'cred-id');
```

**Returns:** `Boolean` - Success status

---

##### `copyEmail(siteId, credentialId)`
Copy email to clipboard (auto-clears after 30s).

```javascript
const success = await credentialsService.copyEmail('site-id', 'cred-id');
```

**Returns:** `Promise<Boolean>`

---

##### `copyPassword(siteId, credentialId)`
Copy password to clipboard (auto-clears after 30s).

```javascript
const success = await credentialsService.copyPassword('site-id', 'cred-id');
```

**Returns:** `Promise<Boolean>`

---

##### `findDuplicatePasswords()`
Find credentials with duplicate passwords.

```javascript
const duplicates = credentialsService.findDuplicatePasswords();
```

**Returns:** `Array<Object>` - Duplicate password groups

---

##### `findWeakPasswords()`
Find credentials with weak passwords.

```javascript
const weak = credentialsService.findWeakPasswords();
```

**Returns:** `Array<Credential>`

---

##### `getCredentialHealth(credential)`
Get credential security health score.

```javascript
const health = credentialsService.getCredentialHealth(credential);
// { score: 85, issues: [], level: 'good' }
```

**Returns:** `Object`
```javascript
{
  score: Number,        // 0-100
  issues: Array,        // List of security issues
  level: String         // 'good', 'fair', 'poor'
}
```

---

### Analytics Service

**Path:** [`src/features/analytics/analytics.service.js`](../src/features/analytics/analytics.service.js)

Track and analyze usage patterns.

---

## Shared Components

### Toast

**Path:** [`src/shared/components/toast.js`](../src/shared/components/toast.js)

Display temporary notification messages.

#### Methods

##### `success(message, duration)`
Display success toast.

```javascript
toast.success('Checked in!', 3000);
```

---

##### `error(message, duration)`
Display error toast.

```javascript
toast.error('Operation failed', 3000);
```

---

##### `warning(message, duration)`
Display warning toast.

```javascript
toast.warning('Please review settings', 3000);
```

---

##### `info(message, duration)`
Display info toast.

```javascript
toast.info('New feature available', 3000);
```

---

### Modal

**Path:** [`src/shared/components/modal.js`](../src/shared/components/modal.js)

Reusable modal dialog component.

#### Constructor

```javascript
const modal = new Modal('my-modal-id', {
  closeOnOverlay: true,
  closeOnEscape: true
});
```

#### Methods

##### `create(title, content, footer)`
Create modal element.

```javascript
modal.create('Modal Title', '<p>Content</p>', '<button>OK</button>');
```

---

##### `open()`
Open the modal.

```javascript
modal.open();
```

---

##### `close()`
Close the modal.

```javascript
modal.close();
```

---

##### `updateContent(content)`
Update modal body content.

```javascript
modal.updateContent('<p>New content</p>');
```

---

## Utilities

### Constants

**Path:** [`src/shared/constants.js`](../src/shared/constants.js)

Utility functions and helpers.

#### Functions

##### `generateUUID()`
Generate unique identifier.

```javascript
const id = generateUUID();
```

**Returns:** `String` - UUID v4 format

---

##### `formatDate(date, format)`
Format date string.

```javascript
const formatted = formatDate(new Date(), 'MMM DD, YYYY');
// Returns: "Oct 22, 2025"
```

**Parameters:**
- `date` (Date|String) - Date to format
- `format` (String) - Format string

**Returns:** `String` - Formatted date

---

##### `calculatePasswordStrength(password)`
Calculate password strength score.

```javascript
const strength = calculatePasswordStrength('MyP@ssw0rd123');
// { score: 6, label: 'Strong', color: '#22c55e' }
```

**Returns:** `Object`
```javascript
{
  score: Number,      // 0-7
  label: String,      // 'Weak', 'Moderate', 'Strong', etc.
  color: String       // Hex color code
}
```

---

##### `copyToClipboard(text)`
Copy text to clipboard.

```javascript
const success = await copyToClipboard('Text to copy');
```

**Returns:** `Promise<Boolean>`

---

##### `debounce(func, wait)`
Debounce function execution.

```javascript
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

**Returns:** `Function` - Debounced function

---

##### `isValidEmail(email)`
Validate email address.

```javascript
const valid = isValidEmail('user@example.com');
```

**Returns:** `Boolean`

---

##### `isValidURL(url)`
Validate URL.

```javascript
const valid = isValidURL('https://example.com');
```

**Returns:** `Boolean`

---

### Component Loader

**Path:** [`src/utils/component-loader.js`](../src/utils/component-loader.js)

Dynamic HTML component loading.

#### Methods

##### `loadComponent(path, targetSelector)`
Load HTML component into target element.

```javascript
await ComponentLoader.loadComponent(
  'src/components/modal.html',
  '#modal-container'
);
```

**Parameters:**
- `path` (String) - Component file path
- `targetSelector` (String) - CSS selector for target element

**Returns:** `Promise<void>`

---

## Configuration

**Path:** [`src/config.js`](../src/config.js)

Global configuration object.

### CONFIG Object

```javascript
export const CONFIG = {
  app: {
    name: 'Account Check-in Command Center',
    version: '2.0.0',
    storageKey: 'accc-dashboard-state'
  },
  theme: {
    default: 'auto'  // 'light', 'dark', 'auto'
  },
  security: {
    masterPasswordEnabled: false,
    clipboardClearSeconds: 30
  },
  notifications: {
    enabled: true,
    reminderTime: '09:00'
  },
  features: {
    categories: true,
    checkInHistory: true,
    passwordStrengthMeter: true
  },
  limits: {
    maxSites: 1000,
    maxCredentialsPerSite: 10,
    maxHistoryEntries: 100
  }
};
```

---

## Events

**Path:** [`src/config.js`](../src/config.js)

Application event constants.

### EVENTS Object

```javascript
export const EVENTS = {
  STATE_CHANGED: 'state:changed',
  SITE_ADDED: 'site:added',
  SITE_UPDATED: 'site:updated',
  SITE_DELETED: 'site:deleted',
  CREDENTIAL_CHECKED: 'credential:checked',
  FILTER_CHANGED: 'filter:changed',
  THEME_CHANGED: 'theme:changed',
  VIEW_CHANGED: 'view:changed',
  SEARCH_PERFORMED: 'search:performed',
  EXPORT_COMPLETED: 'export:completed',
  IMPORT_COMPLETED: 'import:completed'
};
```

### Usage Example

```javascript
import { EVENTS } from './config.js';
import { stateManager } from './core/state.js';

// Subscribe to events
stateManager.on(EVENTS.SITE_ADDED, (site) => {
  console.log('New site added:', site);
});

stateManager.on(EVENTS.CREDENTIAL_CHECKED, ({ siteId, credentialId }) => {
  console.log('Credential checked in');
});
```

---

## Data Structures

### Site Object

```javascript
{
  id: String,                    // Unique identifier
  name: String,                  // Site name
  url: String,                   // Site URL
  favicon: String,               // Favicon URL
  category: String|null,         // Category ID
  tags: Array<String>,           // Tags
  priority: Number,              // Priority level
  color: String,                 // Hex color
  notes: String,                 // Additional notes
  credentials: Array<Credential>,// Site credentials
  metadata: {
    loginFrequency: String,      // 'daily', 'weekly', etc.
    importance: String,          // 'low', 'normal', 'high'
    lastIssue: String|null,      // Last issue date
    averageCheckInTime: String   // Average check-in time
  },
  createdAt: String,             // ISO timestamp
  updatedAt: String              // ISO timestamp
}
```

### Credential Object

```javascript
{
  id: String,                    // Unique identifier
  label: String,                 // Credential label
  email: String,                 // Email/username
  password: String,              // Password
  notes: String,                 // Additional notes
  customFields: Array,           // Custom fields
  checkedInOn: String|null,      // Last check-in ISO timestamp
  checkInHistory: Array,         // Check-in history
  lastPasswordChange: String,    // ISO timestamp
  passwordExpiry: String|null,   // Expiry ISO timestamp
  strength: String,              // Password strength label
  breached: Boolean              // Breach detection flag
}
```

---

## Error Handling

All service methods handle errors gracefully:

```javascript
try {
  const site = sitesService.createSite(siteData);
  toast.success('Site created!');
} catch (error) {
  console.error('Failed to create site:', error);
  toast.error('Failed to create site');
}
```

---

## Best Practices

### 1. Always await async operations

```javascript
// ✅ Good
await stateManager.init();
const data = await storageService.exportData('json');

// ❌ Bad
stateManager.init();  // Missing await
```

### 2. Subscribe to events for reactive updates

```javascript
// ✅ Good
stateManager.on(EVENTS.STATE_CHANGED, () => {
  renderUI();
});

// ❌ Bad
// Manually checking state repeatedly
setInterval(() => checkState(), 1000);
```

### 3. Use service layers for business logic

```javascript
// ✅ Good
sitesService.createSite(data);

// ❌ Bad
stateManager.addSite(data);  // Bypasses business logic
```

### 4. Unsubscribe from events when done

```javascript
const unsubscribe = stateManager.on(EVENTS.SITE_ADDED, handler);

// Later...
unsubscribe();
```

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Developer Guide](./CONTRIBUTING.md)
- [Component Documentation](./COMPONENTS.md)
- [CSS Architecture](./CSS-ARCHITECTURE.md)

---

**Last Updated:** October 22, 2025  
**Version:** 2.0.0
