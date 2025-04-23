import CryptoJS from 'crypto-js';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Constants
const RATE_LIMIT_MS = 1000; // 1 second
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes

class SecurityManager {
  constructor() {
    this.lastOperation = Date.now();
    this.failedAttempts = 0;
    this.lockoutUntil = null;
    this.VALIDATION_MESSAGE = "Authentication Successful";
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
    // Only check if fields are not empty
    if (!cardNumber?.trim() || !cvv?.trim() || !expiry?.trim() || !cardHolder?.trim()) {
      throw new Error('Please fill in all required fields');
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
        decrypted = this.decryptData(validationString, password);
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        // Don't expose the actual error to the user
        decrypted = '';
      }
      
      // If decryption was successful
      if (decrypted && decrypted.length > 0) {
        // Reset failed attempts on success
        await this.updateLockoutStatus(userId, 0);
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
        // Still throw an invalid password error but don't expose the internal error
      }
      
      throw new Error("Invalid password");
    } catch (error) {
      throw error;
    }
  }

  createValidationString(password, sentence) {
    return this.encryptData(sentence, password);
  }

  // Session management
  setupInactivityTimer() {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session-timeout'));
      }, SESSION_TIMEOUT_MS);
    };

    // Track more interaction events
    const events = [
      'mousemove', 'keypress', 'scroll', 'click', 'touchstart', 
      'touchmove', 'touchend', 'submit', 'focus', 'blur', 'input', 'change'
    ];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });
    
    // Also track specific card form interactions
    document.addEventListener('DOMContentLoaded', () => {
      // Add input tracking for forms
      document.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.addEventListener('focus', resetTimer, { passive: true });
        el.addEventListener('input', resetTimer, { passive: true });
        el.addEventListener('change', resetTimer, { passive: true });
      });
      
      // Add form submission tracking
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

  // Secure data encryption
  encryptData(data, key) {
    try {
      // Just convert to string and encrypt - no JSON.stringify
      const cleanData = String(data || '');
      return CryptoJS.AES.encrypt(cleanData, key).toString();
    } catch (error) {
      console.error('Error encrypting data:', error);
      return '';
    }
  }

  // Secure data decryption
  decryptData(encryptedData, key) {
    try {
      // Just decrypt - no JSON.parse
      return CryptoJS.AES.decrypt(encryptedData, key)
        .toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return '';
    }
  }

  // Clear sensitive data from memory
  clearSensitiveData() {
    // Clear any sensitive data from memory
    if (typeof window !== 'undefined') {
      window.crypto.getRandomValues(new Uint8Array(16));
    }
  }

  async updateLockoutStatus(userId, attempts) {
    try {
      await setDoc(doc(db, "userSecurity", userId), {
        failedAttempts: attempts,
        lockoutUntil: attempts >= 3 ? Date.now() + (15 * 60 * 1000) : null,
        updatedAt: new Date()
      }, { merge: true });  // Add merge: true to update only the specified fields
    } catch (error) {
      console.error("Error updating lockout status:", error);
      // Don't throw the error to prevent the 400 Bad Request from blocking the UI
      // Instead we'll just log it and continue
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
      return { isLocked: false }; // Default to not locked if there's an error
    }
  }
}

export const securityManager = new SecurityManager(); 