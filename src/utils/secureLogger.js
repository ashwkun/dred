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

// Helpers
const isSecurePlaintext = (obj) => obj && typeof obj === 'object' && 'buffer' in obj && typeof obj.zero === 'function';
const isReactElement = (obj) => obj && typeof obj === 'object' && obj.$$typeof !== undefined;
const isDomNode = (obj) => (typeof Node !== 'undefined' && obj instanceof Node) || (obj && obj.nodeType && obj.nodeName);
const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]';

const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 50;
const MAX_KEYS = 100;

/**
 * Redact sensitive data from strings and objects (cycle-safe, depth-limited)
 */
const redactSensitiveData = (data, seen = new WeakSet(), depth = 0) => {
  if (data === null || data === undefined) return data;

  // Strings: pattern redaction
  if (typeof data === 'string') {
    let redacted = data;
    redacted = redacted.replace(SENSITIVE_PATTERNS.cardNumber, '[CARD_REDACTED]');
    redacted = redacted.replace(SENSITIVE_PATTERNS.cvv, '[CVV_REDACTED]');
    return redacted;
  }

  // Primitives / functions / symbols
  const t = typeof data;
  if (t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol' || t === 'function') {
    return t === 'function' ? '[Function]' : data;
  }

  // Dates / RegExp / Error
  if (data instanceof Date) return new Date(data.getTime());
  if (data instanceof RegExp) return data.toString();
  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: isDevelopment ? data.stack : undefined };
  }

  // React elements / DOM nodes / SecurePlaintext
  if (isReactElement(data)) return '[ReactElement]';
  if (isDomNode(data)) return `[DOMNode:${data.nodeName || 'unknown'}]`;
  if (isSecurePlaintext(data)) return '[SecurePlaintext]';

  // Arrays
  if (Array.isArray(data)) {
    if (seen.has(data)) return '[Circular]';
    seen.add(data);
    if (depth >= MAX_DEPTH) return `[Array(${data.length})]`;
    const out = [];
    for (let i = 0; i < Math.min(data.length, MAX_ARRAY_ITEMS); i++) {
      out.push(redactSensitiveData(data[i], seen, depth + 1));
    }
    if (data.length > MAX_ARRAY_ITEMS) out.push(`[+${data.length - MAX_ARRAY_ITEMS} more]`);
    return out;
  }

  // Objects
  if (typeof data === 'object') {
    if (seen.has(data)) return '[Circular]';
    seen.add(data);
    if (!isPlainObject(data)) {
      // For non-plain objects, avoid deep traversal
      return `[Object ${data.constructor?.name || 'Unknown'}]`;
    }
    if (depth >= MAX_DEPTH) return '[Object]';

    const out = {};
    let processed = 0;
    for (const key of Object.keys(data)) {
      if (processed++ >= MAX_KEYS) {
        out['__truncated'] = true;
        break;
      }
      if (SENSITIVE_FIELDS.includes(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactSensitiveData(data[key], seen, depth + 1);
      }
    }
    return out;
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
