/**
 * Credentials Service
 * Business logic for credential management
 */

import { stateManager } from '../../core/state.js';
import { generateUUID, calculatePasswordStrength, copyToClipboard } from '../../shared/constants.js';
import { CONFIG } from '../../config.js';

class CredentialsService {
  /**
   * Add credential to site
   */
  addCredential(siteId, credentialData) {
    const site = stateManager.getSite(siteId);
    if (!site) return null;

    const newCredential = {
      id: generateUUID(),
      label: credentialData.label,
      email: credentialData.email,
      password: credentialData.password,
      notes: credentialData.notes || '',
      customFields: credentialData.customFields || [],
      checkedInOn: null,
      checkInHistory: [],
      lastPasswordChange: new Date().toISOString(),
      passwordExpiry: credentialData.passwordExpiry || null,
      strength: calculatePasswordStrength(credentialData.password).label,
      breached: false
    };

    const updatedCredentials = [...site.credentials, newCredential];
    stateManager.updateSite(siteId, { credentials: updatedCredentials });

    return newCredential;
  }

  /**
   * Update credential
   */
  updateCredential(siteId, credentialId, updates) {
    const site = stateManager.getSite(siteId);
    if (!site) return false;

    const credentialIndex = site.credentials.findIndex(c => c.id === credentialId);
    if (credentialIndex === -1) return false;

    // Update password strength if password changed
    if (updates.password) {
      updates.strength = calculatePasswordStrength(updates.password).label;
      updates.lastPasswordChange = new Date().toISOString();
    }

    site.credentials[credentialIndex] = {
      ...site.credentials[credentialIndex],
      ...updates
    };

    return stateManager.updateSite(siteId, { credentials: site.credentials });
  }

  /**
   * Delete credential
   */
  deleteCredential(siteId, credentialId) {
    const site = stateManager.getSite(siteId);
    if (!site) return false;

    const updatedCredentials = site.credentials.filter(c => c.id !== credentialId);
    return stateManager.updateSite(siteId, { credentials: updatedCredentials });
  }

  /**
   * Get credential
   */
  getCredential(siteId, credentialId) {
    const site = stateManager.getSite(siteId);
    if (!site) return null;

    return site.credentials.find(c => c.id === credentialId);
  }

  /**
   * Check in credential
   */
  checkIn(siteId, credentialId) {
    return stateManager.checkInCredential(siteId, credentialId);
  }

  /**
   * Reset credential check-in
   */
  resetCheckIn(siteId, credentialId) {
    return stateManager.resetCredential(siteId, credentialId);
  }

  /**
   * Toggle credential check-in
   */
  toggleCheckIn(siteId, credentialId) {
    const credential = this.getCredential(siteId, credentialId);
    if (!credential) return false;

    const isCheckedToday = credential.checkedInOn && this.isToday(credential.checkedInOn);
    
    if (isCheckedToday) {
      return this.resetCheckIn(siteId, credentialId);
    } else {
      return this.checkIn(siteId, credentialId);
    }
  }

  /**
   * Copy email to clipboard
   */
  async copyEmail(siteId, credentialId) {
    const credential = this.getCredential(siteId, credentialId);
    if (!credential) return false;

    const success = await copyToClipboard(credential.email);
    
    if (success && CONFIG.security.clipboardClearSeconds > 0) {
      setTimeout(() => {
        copyToClipboard(''); // Clear clipboard
      }, CONFIG.security.clipboardClearSeconds * 1000);
    }

    return success;
  }

  /**
   * Copy password to clipboard
   */
  async copyPassword(siteId, credentialId) {
    const credential = this.getCredential(siteId, credentialId);
    if (!credential) return false;

    const success = await copyToClipboard(credential.password);
    
    if (success && CONFIG.security.clipboardClearSeconds > 0) {
      setTimeout(() => {
        copyToClipboard(''); // Clear clipboard
      }, CONFIG.security.clipboardClearSeconds * 1000);
    }

    return success;
  }

  /**
   * Get password strength
   */
  getPasswordStrength(password) {
    return calculatePasswordStrength(password);
  }

  /**
   * Check if credential is checked in today
   */
  isCheckedInToday(credential) {
    return credential.checkedInOn && this.isToday(credential.checkedInOn);
  }

  /**
   * Get credential status
   */
  getCredentialStatus(credential) {
    if (!credential.checkedInOn) return 'never';
    if (this.isToday(credential.checkedInOn)) return 'today';
    
    const daysAgo = this.getDaysAgo(credential.checkedInOn);
    if (daysAgo === 1) return 'yesterday';
    if (daysAgo <= 7) return 'this-week';
    if (daysAgo <= 30) return 'this-month';
    return 'stale';
  }

  /**
   * Get all credentials across all sites
   */
  getAllCredentials() {
    const sites = stateManager.getSites();
    const allCredentials = [];

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        allCredentials.push({
          ...credential,
          siteName: site.name,
          siteId: site.id,
          siteUrl: site.url
        });
      });
    });

    return allCredentials;
  }

  /**
   * Find duplicate passwords
   */
  findDuplicatePasswords() {
    const credentials = this.getAllCredentials();
    const passwordMap = new Map();
    const duplicates = [];

    credentials.forEach(cred => {
      if (!passwordMap.has(cred.password)) {
        passwordMap.set(cred.password, []);
      }
      passwordMap.get(cred.password).push(cred);
    });

    passwordMap.forEach((creds, password) => {
      if (creds.length > 1) {
        duplicates.push({
          password,
          count: creds.length,
          credentials: creds
        });
      }
    });

    return duplicates;
  }

  /**
   * Find weak passwords
   */
  findWeakPasswords() {
    const credentials = this.getAllCredentials();
    return credentials.filter(cred => {
      const strength = calculatePasswordStrength(cred.password);
      return strength.score <= 3;
    });
  }

  /**
   * Find expired passwords
   */
  findExpiredPasswords() {
    const credentials = this.getAllCredentials();
    const now = new Date();

    return credentials.filter(cred => {
      if (!cred.passwordExpiry) return false;
      const expiryDate = new Date(cred.passwordExpiry);
      return expiryDate < now;
    });
  }

  /**
   * Find expiring soon passwords (within 30 days)
   */
  findExpiringSoonPasswords() {
    const credentials = this.getAllCredentials();
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    return credentials.filter(cred => {
      if (!cred.passwordExpiry) return false;
      const expiryDate = new Date(cred.passwordExpiry);
      return expiryDate > now && expiryDate <= thirtyDaysLater;
    });
  }

  /**
   * Get credential health score
   */
  getCredentialHealth(credential) {
    let score = 100;
    const issues = [];

    // Check password strength
    const strength = calculatePasswordStrength(credential.password);
    if (strength.score <= 2) {
      score -= 30;
      issues.push('Weak password');
    } else if (strength.score <= 4) {
      score -= 15;
      issues.push('Moderate password strength');
    }

    // Check password age
    const passwordAge = this.getDaysAgo(credential.lastPasswordChange);
    if (passwordAge > 365) {
      score -= 20;
      issues.push('Password not changed in over a year');
    } else if (passwordAge > 180) {
      score -= 10;
      issues.push('Password not changed in 6+ months');
    }

    // Check if breached
    if (credential.breached) {
      score -= 40;
      issues.push('Password found in data breach');
    }

    // Check expiry
    if (credential.passwordExpiry) {
      const expiryDate = new Date(credential.passwordExpiry);
      if (expiryDate < new Date()) {
        score -= 25;
        issues.push('Password expired');
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      level: score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor'
    };
  }

  /**
   * Add custom field to credential
   */
  addCustomField(siteId, credentialId, field) {
    const credential = this.getCredential(siteId, credentialId);
    if (!credential) return false;

    const newField = {
      id: generateUUID(),
      label: field.label,
      value: field.value,
      type: field.type || 'text'
    };

    const customFields = [...(credential.customFields || []), newField];
    return this.updateCredential(siteId, credentialId, { customFields });
  }

  /**
   * Remove custom field from credential
   */
  removeCustomField(siteId, credentialId, fieldId) {
    const credential = this.getCredential(siteId, credentialId);
    if (!credential) return false;

    const customFields = (credential.customFields || []).filter(f => f.id !== fieldId);
    return this.updateCredential(siteId, credentialId, { customFields });
  }

  /**
   * Get check-in statistics
   */
  getCheckInStats() {
    const credentials = this.getAllCredentials();
    const checkedToday = credentials.filter(c => this.isCheckedInToday(c));

    return {
      total: credentials.length,
      checkedToday: checkedToday.length,
      pending: credentials.length - checkedToday.length,
      percentage: credentials.length > 0 
        ? Math.round((checkedToday.length / credentials.length) * 100)
        : 0
    };
  }

  /**
   * Check if date is today
   */
  isToday(dateString) {
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(dateString).toISOString().split('T')[0];
    return today === checkDate;
  }

  /**
   * Get days ago from date
   */
  getDaysAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const credentialsService = new CredentialsService();