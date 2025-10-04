// Security Manager using Web Crypto API with non-extractable keys
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Constants
const RATE_LIMIT_MS = 1000; // 1 second
const MASTER_PASSWORD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // AES-256

// Utility: Convert string to ArrayBuffer
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Utility: Convert ArrayBuffer to string
function ab2str(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Utility: Convert ArrayBuffer to base64
function ab2base64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility: Convert base64 to ArrayBuffer
function base642ab(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

class SecurityManager {
  constructor() {
    this.lastOperation = Date.now();
    this.failedAttempts = 0;
    this.lockoutUntil = null;
    this.VALIDATION_MESSAGE = "Authentication Successful";
    this.masterKey = null; // Will store non-extractable CryptoKey
    this.setupInactivityTimer();
  }

  // Rate limiting
  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastOperation < RATE_LIMIT_MS) {
      throw new Error('Please wait before trying again');
    }
    this.lastOperation = now;
  }

  // Card data validation
  validateCardData({ cardNumber, cvv, expiry, cardHolder }) {
    if (!cardNumber?.trim() || !cvv?.trim() || !expiry?.trim() || !cardHolder?.trim()) {
      throw new Error('Please fill in all required fields');
    }
  }

  // Derive a non-extractable CryptoKey from password using PBKDF2
  async deriveKey(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      str2ab(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: 'AES-GCM',
        length: KEY_LENGTH
      },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );
  }

  // Set master key (derived from master password)
  async setMasterKey(password) {
    // Generate a random salt for this session
    const salt = crypto.getRandomValues(new Uint8Array(16));
    this.masterKey = await this.deriveKey(password, salt);
    this.sessionSalt = salt; // Store salt for this session
    console.log('Master key derived and stored (non-extractable)');
  }

  // Clear master key from memory
  clearMasterKey() {
    this.masterKey = null;
    this.sessionSalt = null;
    console.log('Master key cleared from memory');
  }

  // Encrypt data using AES-GCM with the master key
  async encryptData(data, password) {
    try {
      const cleanData = String(data || '');
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM uses 12-byte IV
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Encrypt with AES-GCM
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        str2ab(cleanData)
      );
      
      // Format: v3:salt:iv:ciphertext (all base64)
      return `v3:${ab2base64(salt)}:${ab2base64(iv)}:${ab2base64(encrypted)}`;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  // Decrypt data using AES-GCM
  async decryptData(encryptedData, password) {
    try {
      if (!encryptedData) return '';
      
      // Check format
      if (!encryptedData.startsWith('v3:')) {
        throw new Error('Unsupported encryption format. Please re-encrypt your data.');
      }
      
      // Parse v3 format: v3:salt:iv:ciphertext
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid v3 encryption format');
      }
      
      const salt = new Uint8Array(base642ab(parts[1]));
      const iv = new Uint8Array(base642ab(parts[2]));
      const ciphertext = base642ab(parts[3]);
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Decrypt with AES-GCM
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );
      
      return ab2str(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  // Master password validation
  async validatePassword(validationString, password, userId) {
    try {
      // Rate limit checks
      this.checkRateLimit();
      
      // Check lockout status
      const lockoutStatus = await this.checkLockoutStatus(userId);
      if (lockoutStatus.isLocked) {
        throw new Error(`Account locked. Try again in ${lockoutStatus.minutesLeft} minutes`);
      }

      // Try to decrypt with the provided password
      let decrypted = '';
      try {
        decrypted = await this.decryptData(validationString, password);
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        decrypted = '';
      }
      
      // If decryption was successful
      if (decrypted && decrypted.length > 0) {
        // Reset failed attempts on success
        await this.updateLockoutStatus(userId, 0);
        
        // Set the master key for this session
        await this.setMasterKey(password);
        
        return { success: true, decryptedSentence: decrypted };
      }
      
      // Increment failed attempts
      try {
        const securityDoc = await getDoc(doc(db, "userSecurity", userId));
        const currentAttempts = securityDoc.exists() ? securityDoc.data().failedAttempts || 0 : 0;
        const newAttempts = currentAttempts + 1;
        
        await this.updateLockoutStatus(userId, newAttempts);
        
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_TIME_MS/60000} minutes.`);
        }
      } catch (attemptsError) {
        console.error("Error tracking failed attempts:", attemptsError);
      }
      
      throw new Error("Invalid password");
    } catch (error) {
      throw error;
    }
  }

  // Create validation string
  async createValidationString(password, sentence) {
    return await this.encryptData(sentence, password);
  }

  // Session management
  setupInactivityTimer() {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.clearMasterKey();
        window.dispatchEvent(new CustomEvent('master-password-timeout'));
      }, MASTER_PASSWORD_TIMEOUT_MS);
    };

    const events = [
      'mousemove', 'keypress', 'scroll', 'click', 'touchstart', 
      'touchmove', 'touchend', 'submit', 'focus', 'blur', 'input', 'change'
    ];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });
    
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.addEventListener('focus', resetTimer, { passive: true });
        el.addEventListener('input', resetTimer, { passive: true });
        el.addEventListener('change', resetTimer, { passive: true });
      });
      
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', resetTimer, { passive: true });
      });
    });
    
    resetTimer();
  }

  // Check if account is locked
  isLocked() {
    return this.lockoutUntil && Date.now() < this.lockoutUntil;
  }

  // Clear sensitive data from memory
  clearSensitiveData() {
    this.clearMasterKey();
    if (typeof window !== 'undefined') {
      crypto.getRandomValues(new Uint8Array(16));
    }
  }

  async updateLockoutStatus(userId, attempts) {
    try {
      await setDoc(doc(db, "userSecurity", userId), {
        failedAttempts: attempts,
        lockoutUntil: attempts >= 3 ? Date.now() + (15 * 60 * 1000) : null,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating lockout status:", error);
    }
  }

  async checkLockoutStatus(userId) {
    try {
      const securityDoc = await getDoc(doc(db, "userSecurity", userId));
      if (securityDoc.exists()) {
        const data = securityDoc.data();
        if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
          return {
            isLocked: true,
            minutesLeft: Math.ceil((data.lockoutUntil - Date.now()) / 60000)
          };
        }
      }
      return { isLocked: false };
    } catch (error) {
      console.error("Error checking lockout status:", error);
      return { isLocked: false };
    }
  }
}

export const securityManager = new SecurityManager();
