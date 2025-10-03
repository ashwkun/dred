/**
 * Secure Logger Utility
 * 
 * Prevents sensitive data from being logged to console
 * Automatically strips logs in production
 */

// Check if we're in development mode (works with Parcel)
const isDevelopment = process.env.NODE_ENV !== 'production';

// Sensitive field patterns that should NEVER be logged
const SENSITIVE_PATTERNS = [
  'password',
  'masterpassword',
  'masterpass',
  'cardnumber',
  'cvv',
  'pin',
  'otp',
  'token',
  'secret',
  'key',
  'credential'
];

/**
 * Checks if a key might contain sensitive data
 */
function isSensitiveKey(key) {
  const lowerKey = String(key).toLowerCase().replace(/[_-]/g, '');
  return SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern));
}

/**
 * Redacts sensitive data from objects
 */
function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      // Redact sensitive fields
      if (typeof value === 'string' && value.length > 0) {
        redacted[key] = value.substring(0, 1) + '***' + (value.length > 1 ? value.substring(value.length - 1) : '');
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Safe logger that only works in development and redacts sensitive data
 */
export const logger = {
  log: (...args) => {
    if (!isDevelopment) return;
    const redactedArgs = args.map(arg => redactSensitiveData(arg));
    console.log(...redactedArgs);
  },

  error: (...args) => {
    if (!isDevelopment) return;
    const redactedArgs = args.map(arg => redactSensitiveData(arg));
    console.error(...redactedArgs);
  },

  warn: (...args) => {
    if (!isDevelopment) return;
    const redactedArgs = args.map(arg => redactSensitiveData(arg));
    console.warn(...redactedArgs);
  },

  debug: (...args) => {
    if (!isDevelopment) return;
    const redactedArgs = args.map(arg => redactSensitiveData(arg));
    console.debug(...redactedArgs);
  },

  // Special method for logging password-like data (always redacts)
  logRedacted: (message, sensitiveValue) => {
    if (!isDevelopment) return;
    if (typeof sensitiveValue === 'string' && sensitiveValue.length > 0) {
      console.log(message, sensitiveValue.substring(0, 1) + '******');
    } else {
      console.log(message, '[REDACTED]');
    }
  }
};

// Export a production-safe console wrapper
export default logger;

