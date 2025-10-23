
# Architecture Documentation

> Technical architecture and design decisions for DashOrg - Enhanced Credential Dashboard

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [System Architecture](#system-architecture)
- [Layer Architecture](#layer-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Storage Strategy](#storage-strategy)
- [Security Architecture](#security-architecture)
- [Module Organization](#module-organization)
- [Design Patterns](#design-patterns)
- [Performance Considerations](#performance-considerations)

---

## Overview

DashOrg (Enhanced Credential Dashboard) is a **client-side web application** built with vanilla JavaScript, HTML, and CSS. It follows a **modular service-based architecture** with clear separation of concerns.

### Key Characteristics

- **Zero Dependencies**: Pure vanilla JavaScript (ES6+)
- **Client-Side Only**: No backend, all data stored locally
- **Event-Driven**: Reactive state management with pub/sub pattern
- **Modular**: Feature-based organization with service layers
- **Privacy-First**: 100% local data storage, no external calls

### Technology Stack

```
┌─────────────────────────────────────────┐
│  HTML5 + CSS3 + Vanilla JavaScript ES6+ │
├─────────────────────────────────────────┤
│  Browser APIs:                          │
│  - localStorage                         │
│  - Web Crypto API                       │
│  - Clipboard API                        │
│  - Date/Time APIs                       │
└─────────────────────────────────────────┘
```

---

## Architecture Principles

### 1. Separation of Concerns

Each layer has a specific responsibility:

- **UI Layer**: User interface and interactions
- **Application Layer**: Business logic orchestration
- **Service Layer**: Feature-specific business logic
- **Core Layer**: Foundational services (state, storage)
- **Utility Layer**: Reusable helper functions

### 2. Dependency Inversion

High-level modules don't depend on low-level modules. Both depend on abstractions.

```javascript
// ✅ Good: Service depends on abstraction
class SitesService {
  constructor(stateManager) {
    this.state = stateManager;
  }
}

// ❌ Bad: Direct dependency on implementation
class SitesService {
  constructor() {
    this.state = new StateManager(); // Tight coupling
  }
}
```

### 3. Single Responsibility

Each module has one reason to change:

- **StateManager**: Only manages application state
- **StorageService**: Only handles data persistence
- **SitesService**: Only manages site-related logic

### 4. Open/Closed Principle

Open for extension, closed for modification:

```javascript
// Extensible through events
stateManager.on(EVENTS.SITE_ADDED, (site) => {
  // New functionality without modifying StateManager
  analyticsService.trackSiteAdded(site);
});
```

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     index.html (UI)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │Site Cards  │ │  Modals    │ │  Controls  │          │
│  └────────────┘ └────────────┘ └────────────┘          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   main.js (App Class)                    │
│  - Initialize application                                │
│  - Coordinate services                                   │
│  - Handle UI events                                      │
│  - Render components                                     │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
│ Core Services│  │   Features  │  │   Shared   │
├──────────────┤  ├─────────────┤  ├────────────┤
│ StateManager │  │ Sites       │  │ Toast      │
│ Storage      │  │ Credentials │  │ Modal      │
│ Crypto       │  │ Analytics   │  │ Constants  │
│ Migrations   │  │             │  │ Loader     │
└──────────────┘  └─────────────┘  └────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                ┌────────▼────────┐
                │  localStorage   │
                └─────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer (UI)

**Location:** `index.html`, rendered by `main.js`

**Responsibilities:**
- Display data to user
- Capture user interactions
- Render dynamic content
- Handle UI state (modals, tooltips)

**Communication:**
- Calls → Application Layer
- Listens ← State change events

### 2. Application Layer

**Location:** `src/main.js` (App class)

**Responsibilities:**
- Initialize services
- Coordinate service calls
- Handle user events
- Orchestrate UI rendering
- Manage application lifecycle

**Example:**
```javascript
class App {
  async init() {
    await stateManager.init();
    this.render();
    this.attachEventListeners();
    this.subscribeToEvents();
  }
  
  render() {
    this.renderProgress();
    this.renderSites();
  }
}
```

### 3. Service Layer

**Location:** `src/features/`, `src/core/`

**Responsibilities:**
- Business logic
- Data transformation
- Validation
- Feature-specific operations

**Services:**
- **SitesService**: Site CRUD operations
- **CredentialsService**: Credential management
- **AnalyticsService**: Usage tracking
- **StateManager**: State orchestration
- **StorageService**: Data persistence

### 4. Utility Layer

**Location:** `src/shared/`, `src/utils/`

**Responsibilities:**
- Helper functions
- Reusable components
- Common utilities
- Constants and configurations

---

## Data Flow

### User Action Flow

```
User Interaction
    ↓
Event Handler (main.js)
    ↓
Service Method Call
    ↓
State Update (stateManager)
    ↓
Storage Persistence (storageService)
    ↓
Event Emission (EVENTS.*)
    ↓
UI Re-render
    ↓
Visual Feedback (toast, animation)
```

### Example: Check-In Flow

```javascript
// 1. User clicks "Check In" button
<button onclick="handleCheckIn('site-123', 'cred-456')">

// 2. Event handler in main.js
handleCheckIn(siteId, credId) {
  credentialsService.toggleCheckIn(siteId, credId);
}

// 3. Service updates state
toggleCheckIn(siteId, credId) {
  stateManager.checkInCredential(siteId, credId);
}

// 4. State manager persists and emits
checkInCredential(siteId, credId) {
  storageService.checkInCredential(siteId, credId);
  this.emit(EVENTS.CREDENTIAL_CHECKED, { siteId, credId });
}

// 5. UI listens and re-renders
stateManager.on(EVENTS.CREDENTIAL_CHECKED, () => {
  this.render();
  toast.success('Checked in!');
});
```

---

## State Management

### State Structure

```javascript
{
  version: "2.0.0",
  lastReset: "2025-10-22",
  settings: {
    theme: "auto",
    viewMode: "grid",
    autoReset: true,
    notifications: {...}
  },
  categories: [
    { id: "cat-1", name: "Finance", color: "#10b981" }
  ],
  sites: [
    {
      id: "site-1",
      name: "Gmail",
      url: "https://gmail.com",
      credentials: [
        {
          id: "cred-1",
          label: "Personal",
          email: "user@example.com",
          password: "encrypted",
          checkedInOn: "2025-10-22T10:30:00Z",
          checkInHistory: [...]
        }
      ]
    }
  ],
  analytics: {
    totalCheckIns: 150,
    currentStreak: 7,
    longestStreak: 14
  }
}
```

### State Update Flow

```javascript
// Immutable updates
const updateState = (updates) => {
  state = {
    ...state,
    ...updates
  };
  persistState(state);
  emitStateChange(state);
};
```

### Event-Driven Updates

```javascript
// Publisher
stateManager.emit(EVENTS.SITE_ADDED, newSite);

// Subscriber
stateManager.on(EVENTS.SITE_ADDED, (site) => {
  console.log('New site:', site);
  renderSites();
});
```

---

## Storage Strategy

### localStorage Architecture

```
localStorage
├─ accc-dashboard-state      // Main application state
│  ├─ version
│  ├─ settings
│  ├─ sites[]
│  ├─ categories[]
│  └─ analytics
│
└─ accc-theme-preference    // Theme setting
```

### Data Persistence Flow

```javascript
// Write
stateManager.updateSite() 
  → storageService.setState()
  → localStorage.setItem()

// Read
app.init() 
  → stateManager.init()
  → storageService.getState()
  → localStorage.getItem()
```

### Migration Strategy

```javascript
// Version-based migrations
const migrations = {
  '1.0.0': (data) => {
    // Migrate from v1.0.0 to v2.0.0
    return transformedData;
  }
};

// Auto-migration on load
if (currentVersion < targetVersion) {
  data = migrations[currentVersion](data);
}
```

---

## Security Architecture

### Threat Model

**Threats:**
1. Cross-Site Scripting (XSS)
2. Data exposure through console
3. Clipboard sniffing
4. Browser history leaking

**Mitigations:**
1. Input sanitization
2. No eval() or innerHTML with user data
3. Auto-clear clipboard
4. Sensitive data not in URLs

### Data Protection

```javascript
// Encryption (optional)
const encrypt = async (data, password) => {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  return { encrypted, iv, algorithm: 'AES-GCM' };
};
```

### Clipboard Security

```javascript
// Auto-clear after 30 seconds
copyToClipboard(text).then(() => {
  setTimeout(() => {
    copyToClipboard(''); // Clear
  }, 30000);
});
```

---

## Module Organization

### Feature-Based Structure

```
src/
├── main.js                 # Application entry
├── config.js               # Configuration
│
├── core/                   # Core services
│   ├── state.js           # State management
│   ├── storage.js         # Persistence
│   ├── crypto.js          # Encryption
│   └── migrations.js      # Data migrations
│
├── features/              # Feature modules
│   ├── sites/
│   │   └── sites.service.js
│   ├── credentials/
│   │   └── credentials.service.js
│   └── analytics/
│       └── analytics.service.js
│
├── shared/                # Shared code
│   ├── components/
│   │   ├── toast.js
│   │   └── modal.js
│   └── constants.js
│
└── utils/                 # Utilities
    └── component-loader.js
```

### Dependency Graph

```
main.js
  ├─→ core/state.js
  │     ├─→ core/storage.js
  │     │     └─→ shared/constants.js
  │     └─→ config.js
  │
  ├─→ features/sites.service.js
  │     ├─→ core/state.js
  │     └─→ shared/constants.js
  │
  ├─→ features/credentials.service.js
  │     ├─→ core/state.js
  │     └─→ shared/constants.js
  │
  └─→ shared/components/toast.js
```

---

## Design Patterns

### 1. Singleton Pattern

**Usage:** Services that should have only one instance

```javascript
class StateManager {
  // Implementation
}

// Export single instance
export const stateManager = new StateManager();
```

### 2. Observer Pattern (Pub/Sub)

**Usage:** Event-driven communication

```javascript
class StateManager {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}
```

### 3. Service Layer Pattern

**Usage:** Encapsulate business logic

```javascript
class SitesService {
  createSite(data) {
    // Validation
    // Business rules
    // State updates
    return newSite;
  }
}
```

### 4. Module Pattern

**Usage:** Encapsulation and namespacing

```javascript
export const utils = {
  formatDate,
  generateUUID,
  calculatePasswordStrength
};
```

### 5. Facade Pattern

**Usage:** Simplified interface to complex subsystems

```javascript
// App class provides simple interface
class App {
  init() {
    // Coordinates multiple services
    await stateManager.init();
    await componentLoader.load();
    this.render();
  }
}
```

---

## Performance Considerations

### 1. Debouncing User Input

```javascript
const searchInput = debounce((query) => {
  performSearch(query);
}, 300); // Wait 300ms after user stops typing
