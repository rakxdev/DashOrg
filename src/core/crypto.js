/**
 * Encryption/Decryption Utilities
 * Uses Web Crypto API for secure client-side encryption
 */

import { CONFIG } from '../config.js';

class CryptoService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.iterations = CONFIG.security.keyDerivationIterations;
    this.derivedKey = null;
  }

  /**
   * Derive encryption key from master password
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate random salt
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate random IV (Initialization Vector)
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Encrypt data with master password
   */
  async encrypt(data, password) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));

      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combine salt, IV, and encrypted data
      const result = {
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedData),
        algorithm: this.algorithm,
        iterations: this.iterations
      };

      return result;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with master password
   */
  async decrypt(encryptedObject, password) {
    try {
      // Extract components
      const salt = this.base64ToArrayBuffer(encryptedObject.salt);
      const iv = this.base64ToArrayBuffer(encryptedObject.iv);
      const encryptedData = this.base64ToArrayBuffer(encryptedObject.data);

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Decrypt data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      );

      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - incorrect password or corrupted data');
    }
  }

  /**
   * Hash password for verification (not for encryption)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify password against stored hash
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Quick encrypt for individual fields (using stored key)
   */
  async encryptField(value, password) {
    if (!value) return '';
    return await this.encrypt({ value }, password);
  }

  /**
   * Quick decrypt for individual fields
   */
  async decryptField(encryptedObject, password) {
    if (!encryptedObject) return '';
    try {
      const decrypted = await this.decrypt(encryptedObject, password);
      return decrypted.value || '';
    } catch {
      return '';
    }
  }

  /**
   * Encrypt multiple credentials
   */
  async encryptCredentials(credentials, password) {
    const encrypted = [];
    for (const cred of credentials) {
      encrypted.push({
        ...cred,
        email: await this.encryptField(cred.email, password),
        password: await this.encryptField(cred.password, password),
        notes: cred.notes ? await this.encryptField(cred.notes, password) : '',
        customFields: cred.customFields ? await this.encryptCustomFields(cred.customFields, password) : []
      });
    }
    return encrypted;
  }

  /**
   * Decrypt multiple credentials
   */
  async decryptCredentials(encryptedCredentials, password) {
    const decrypted = [];
    for (const cred of encryptedCredentials) {
      try {
        decrypted.push({
          ...cred,
          email: await this.decryptField(cred.email, password),
          password: await this.decryptField(cred.password, password),
          notes: cred.notes ? await this.decryptField(cred.notes, password) : '',
          customFields: cred.customFields ? await this.decryptCustomFields(cred.customFields, password) : []
        });
      } catch (error) {
        console.error('Failed to decrypt credential:', error);
        // Return partially decrypted or placeholder
        decrypted.push({
          ...cred,
          email: '[Decryption Failed]',
          password: '[Decryption Failed]',
          notes: ''
        });
      }
    }
    return decrypted;
  }

  /**
   * Encrypt custom fields
   */
  async encryptCustomFields(fields, password) {
    const encrypted = [];
    for (const field of fields) {
      encrypted.push({
        ...field,
        value: await this.encryptField(field.value, password)
      });
    }
    return encrypted;
  }

  /**
   * Decrypt custom fields
   */
  async decryptCustomFields(encryptedFields, password) {
    const decrypted = [];
    for (const field of encryptedFields) {
      decrypted.push({
        ...field,
        value: await this.decryptField(field.value, password)
      });
    }
    return decrypted;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate secure random password
   */
  generatePassword(length = 16, options = {}) {
    const {
      lowercase = true,
      uppercase = true,
      numbers = true,
      symbols = true
    } = options;

    let charset = '';
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData() {
    this.derivedKey = null;
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();