/**
 * Helper utilities for working with SecurePlaintext instances in components
 */

/**
 * Safely convert a value to string - handles both SecurePlaintext and regular strings
 * @param {string|SecurePlaintext} value - Value to convert
 * @param {string} fallback - Fallback value if conversion fails
 * @returns {string} - The string value
 */
export function toSafeString(value, fallback = '') {
  if (!value) return fallback;
  
  // Check if it's a SecurePlaintext instance (has toString method and buffer property)
  if (typeof value === 'object' && value.buffer && typeof value.toString === 'function') {
    try {
      return value.toString();
    } catch (error) {
      console.warn('Failed to convert SecurePlaintext to string:', error);
      return fallback;
    }
  }
  
  // Already a string
  if (typeof value === 'string') {
    return value;
  }
  
  return String(value);
}

/**
 * Format card number - safely handles SecurePlaintext
 * @param {string|SecurePlaintext} cardNumber - Card number to format
 * @returns {string} - Formatted card number
 */
export function formatCardNumber(cardNumber) {
  const str = toSafeString(cardNumber, '');
  if (!str) return '•••• •••• •••• ••••';
  
  // Remove existing spaces
  const cleaned = str.replace(/\s/g, '');
  
  // Format as groups of 4
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}

/**
 * Get last 4 digits of card - safely handles SecurePlaintext
 * @param {string|SecurePlaintext} cardNumber - Card number
 * @returns {string} - Last 4 digits
 */
export function getLastFour(cardNumber) {
  const str = toSafeString(cardNumber, '');
  const cleaned = str.replace(/\s/g, '');
  return cleaned.slice(-4) || '••••';
}

/**
 * Mask card number except last 4 - safely handles SecurePlaintext
 * @param {string|SecurePlaintext} cardNumber - Card number to mask
 * @returns {string} - Masked card number
 */
export function maskCardNumber(cardNumber) {
  const str = toSafeString(cardNumber, '');
  const cleaned = str.replace(/\s/g, '');
  
  if (cleaned.length < 4) return '••••';
  
  const masked = '•'.repeat(cleaned.length - 4);
  const last4 = cleaned.slice(-4);
  
  return `${masked}${last4}`;
}

/**
 * Check if a value is a SecurePlaintext instance
 * @param {any} value - Value to check
 * @returns {boolean} - True if SecurePlaintext
 */
export function isSecurePlaintext(value) {
  return value && typeof value === 'object' && value.buffer && typeof value.zero === 'function';
}

