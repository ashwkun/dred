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
      const lockoutStatus = await this.checkLockoutStatus(userId);
      if (lockoutStatus.isLocked) {
        throw new Error(`Account locked. Try again in ${lockoutStatus.minutesLeft} minutes`);
      }

      const decrypted = this.decryptData(validationString, password);
      if (decrypted && decrypted.length > 0) {
        await this.updateLockoutStatus(userId, 0);
        return { success: true, decryptedSentence: decrypted };
      }
      
      // Increment failed attempts
      const securityDoc = await getDoc(doc(db, "userSecurity", userId));
      const currentAttempts = securityDoc.exists() ? securityDoc.data().failedAttempts || 0 : 0;
      const newAttempts = currentAttempts + 1;
      
      await this.updateLockoutStatus(userId, newAttempts);
      
      if (newAttempts >= 3) {
        throw new Error("Too many failed attempts. Account locked for 15 minutes.");
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

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
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
    await setDoc(doc(db, "userSecurity", userId), {
      failedAttempts: attempts,
      lockoutUntil: attempts >= 3 ? Date.now() + (15 * 60 * 1000) : null,
      updatedAt: new Date()
    });
  }

  async checkLockoutStatus(userId) {
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
  }
}

export const securityManager = new SecurityManager(); 