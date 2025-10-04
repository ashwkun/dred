/**
 * Secure logging utility that redacts sensitive data
 * Only logs in development, strips in production
 */

// Parcel uses process.env.NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';

const SENSITIVE_PATTERNS = {
  cardNumber: /\b\d{15,16}\b/g,
  cvv: /\b\d{3,4}\b/g,
  // Add more patterns as needed
};

const SENSITIVE_FIELDS = [
  'cardNumber',
  'cardNumberFull',
  'cardNumberLast4',
  'cvv',
  'password',
  'masterPassword',
  'expiry',
  'cardHolder',
  'validationString',
  'mobileNumber'
];

/**
 * Redact sensitive data from strings and objects
 */
const redactSensitiveData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings
  if (typeof data === 'string') {
    let redacted = data;

    // Redact card numbers
    redacted = redacted.replace(SENSITIVE_PATTERNS.cardNumber, '[CARD_REDACTED]');

    // Redact CVVs
    redacted = redacted.replace(SENSITIVE_PATTERNS.cvv, '[CVV_REDACTED]');

    return redacted;
  }

  // Handle objects
  if (typeof data === 'object') {
    const redacted = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Check if key is sensitive
        if (SENSITIVE_FIELDS.includes(key)) {
          redacted[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object') {
          redacted[key] = redactSensitiveData(data[key]);
        } else {
          redacted[key] = redactSensitiveData(data[key]);
        }
      }
    }

    return redacted;
  }

  return data;
};

/**
 * Secure logger that only logs in development
 */
export const secureLog = {
  error: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.error(message, redactSensitiveData(data));
      } else {
        console.error(message);
      }
    }
  },

  warn: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.warn(message, redactSensitiveData(data));
      } else {
        console.warn(message);
      }
    }
  },

  info: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.info(message, redactSensitiveData(data));
      } else {
        console.info(message);
      }
    }
  },

  debug: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.debug(message, redactSensitiveData(data));
      } else {
        console.debug(message);
      }
    }
  }
};

export default secureLog;
