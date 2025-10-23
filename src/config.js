/**
 * Global Configuration
 * Customize application behavior and defaults
 */

export const CONFIG = {
  // Application Info
  app: {
    name: 'Account Check-in Command Center',
    version: '2.1.0',
    storageKey: 'accc-dashboard-state',
    credentialsKey: 'accc-credentials',
    historyKey: 'accc-history'
  },

  // Theme Settings
  theme: {
    default: 'auto', // 'light', 'dark', 'auto'
    storageKey: 'accc-theme-preference'
  },

  // View Settings
  view: {
    defaultMode: 'grid', // 'grid', 'list', 'kanban', 'timeline', 'focus'
    defaultDensity: 'comfortable', // 'compact', 'comfortable', 'spacious'
    cardsPerRow: 'auto', // 'auto' or number
    showFavicons: true,
    showLastCheckin: true,
    animateTransitions: true
  },

  // Reset Settings
  reset: {
    autoReset: true,
    resetTime: '00:00', // 24-hour format
    timezone: 'local' // or specific timezone like 'America/New_York'
  },

  // Security Settings
  security: {
    masterPasswordEnabled: false,
    autoLockMinutes: 15, // 0 to disable
    clipboardClearSeconds: 30,
    requireAuthOnStart: false,
    encryptionAlgorithm: 'AES-GCM',
    keyDerivationIterations: 100000,
    preventScreenCapture: true
  },

  // Notification Settings
  notifications: {
    enabled: true,
    reminderTime: '09:00',
    staleDays: 7, // Alert for accounts not checked in X days
    showBrowserNotifications: false // Requires permission
  },

  // Search Settings
  search: {
    fuzzyThreshold: 0.3, // 0 = exact, 1 = match anything
    debounceMs: 300,
    minCharacters: 2,
    maxResults: 50
  },

  // Analytics Settings
  analytics: {
    enabled: true,
    trackCheckIns: true,
    trackSearches: false,
    retentionDays: 90
  },

  // Backup Settings
  backup: {
    autoBackup: false,
    backupInterval: 7, // days
    maxBackups: 5,
    includeHistory: true
  },

  // Import/Export Settings
  export: {
    defaultFormat: 'encrypted-json',
    includeMetadata: true,
    includeAnalytics: true
  },

  // UI Settings
  ui: {
    dateFormat: 'MMM DD, YYYY',
    timeFormat: '12h', // '12h' or '24h'
    confirmDeletes: true,
    showTooltips: true,
    animationSpeed: 'normal' // 'fast', 'normal', 'slow'
  },

  // Feature Flags
  features: {
    categories: true,
    customFields: true,
    checkInHistory: true,
    passwordStrengthMeter: true,
    breachDetection: false, // Requires external API
    qrCodeGeneration: true,
    batchOperations: true,
    streakTracking: true
  },

  // Limits
  limits: {
    maxSites: 1000,
    maxCredentialsPerSite: 10,
    maxTagsPerSite: 10,
    maxCustomFieldsPerCredential: 5,
    maxHistoryEntries: 100
  },

  // Default Categories
  defaultCategories: [
    { name: 'Finance', color: '#10b981', icon: '💰' },
    { name: 'Work', color: '#3b82f6', icon: '💼' },
    { name: 'Personal', color: '#8b5cf6', icon: '👤' },
    { name: 'Social Media', color: '#ec4899', icon: '📱' },
    { name: 'Entertainment', color: '#f59e0b', icon: '🎬' },
    { name: 'Utilities', color: '#6366f1', icon: '⚡' }
  ],

  // Filter Presets
  filterPresets: {
    'urgent-today': {
      name: 'Urgent Today',
      status: 'pending',
      priority: ['high', 'critical'],
      lastCheckin: { olderThan: '24h' }
    },
    'finance-accounts': {
      name: 'Finance Accounts',
      category: 'finance',
      tags: ['banking', 'investment']
    },
    'stale-credentials': {
      name: 'Stale Credentials',
      lastCheckin: { olderThan: '30d' },
      passwordAge: { olderThan: '90d' }
    },
    'needs-attention': {
      name: 'Needs Attention',
      status: 'pending',
      priority: ['high'],
      lastCheckin: { olderThan: '7d' }
    }
  }
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Status constants
export const STATUS = {
  PENDING: 'pending',
  DONE: 'done',
  IN_PROGRESS: 'in_progress'
};

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Event names
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