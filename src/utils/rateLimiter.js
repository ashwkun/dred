/**
 * Client-Side Rate Limiter
 * 
 * Since Firebase Spark plan doesn't support App Check or Cloud Functions,
 * we implement client-side rate limiting as a best-effort protection.
 * 
 * NOTE: This is NOT foolproof (can be bypassed by determined attacker)
 * but provides reasonable protection for normal users and casual abuse.
 */

import { secureLog } from './secureLogger';

class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.LIMITS = {
      // Action: [maxAttempts, timeWindowMs]
      'card_create': [10, 60 * 1000], // 10 cards per minute
      'card_update': [20, 60 * 1000], // 20 updates per minute
      'card_delete': [10, 60 * 1000], // 10 deletes per minute
      'auth_attempt': [5, 60 * 1000], // 5 auth attempts per minute
      'password_validation': [3, 60 * 1000], // 3 password checks per minute
      'mobile_update': [3, 60 * 1000], // 3 mobile number updates per minute
    };
  }

  /**
   * Check if action is allowed based on rate limit
   * @param {string} action - The action type
   * @param {string} userId - The user ID (optional, uses 'global' if not provided)
   * @returns {boolean} - true if allowed, false if rate limit exceeded
   */
  checkLimit(action, userId = 'global') {
    const key = `${action}:${userId}`;
    const [maxAttempts, timeWindow] = this.LIMITS[action] || [100, 60 * 1000];
    
    const now = Date.now();
    
    // Get or initialize attempt history
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const attempts = this.limits.get(key);
    
    // Remove old attempts outside time window
    const validAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
    
    // Check if limit exceeded
    if (validAttempts.length >= maxAttempts) {
      secureLog.warn(`Rate limit exceeded for ${action} by user ${userId}`);
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.limits.set(key, validAttempts);
    
    return true;
  }

  /**
   * Record an attempt (call after successful operation)
   * @param {string} action - The action type
   * @param {string} userId - The user ID
   */
  recordAttempt(action, userId = 'global') {
    // Already recorded in checkLimit
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clear() {
    this.limits.clear();
  }

  /**
   * Get remaining attempts for an action
   * @param {string} action - The action type
   * @param {string} userId - The user ID
   * @returns {number} - Remaining attempts
   */
  getRemainingAttempts(action, userId = 'global') {
    const key = `${action}:${userId}`;
    const [maxAttempts, timeWindow] = this.LIMITS[action] || [100, 60 * 1000];
    
    if (!this.limits.has(key)) {
      return maxAttempts;
    }
    
    const now = Date.now();
    const attempts = this.limits.get(key);
    const validAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
    
    return Math.max(0, maxAttempts - validAttempts.length);
  }

  /**
   * Get time until rate limit resets
   * @param {string} action - The action type
   * @param {string} userId - The user ID
   * @returns {number} - Milliseconds until reset (0 if not limited)
   */
  getTimeUntilReset(action, userId = 'global') {
    const key = `${action}:${userId}`;
    const [, timeWindow] = this.LIMITS[action] || [100, 60 * 1000];
    
    if (!this.limits.has(key)) {
      return 0;
    }
    
    const attempts = this.limits.get(key);
    if (attempts.length === 0) {
      return 0;
    }
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + timeWindow;
    const now = Date.now();
    
    return Math.max(0, resetTime - now);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export class for testing
export default RateLimiter;

