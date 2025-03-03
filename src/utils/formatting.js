/**
 * Utility functions for formatting data consistently throughout the application
 */

/**
 * Formats a number as Indian Rupee currency
 * @param {number} amount - The amount to format
 * @param {boolean} compact - Whether to use compact notation for large numbers
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === undefined || amount === null) return '₹0';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard'
  });
  
  return formatter.format(amount);
};

/**
 * Formats a date string into a user-friendly format
 * @param {string} dateString - The date string to format
 * @param {string} format - The format type ('short', 'medium', 'long')
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  let options;
  
  switch (format) {
    case 'short':
      options = { month: 'short', day: 'numeric' };
      break;
    case 'long':
      options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
      break;
    case 'month':
      options = { month: 'long', year: 'numeric' };
      break;
    case 'medium':
    default:
      options = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Formats a percentage value
 * @param {number} value - The percentage value (0-100)
 * @param {boolean} includeSymbol - Whether to include the % symbol
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, includeSymbol = true) => {
  if (value === undefined || value === null) return '0' + (includeSymbol ? '%' : '');
  
  return value.toFixed(1) + (includeSymbol ? '%' : '');
};

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 20) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};

/**
 * Formats a number to include thousand separators
 * @param {number} value - The number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (value) => {
  if (value === undefined || value === null) return '0';
  
  return new Intl.NumberFormat('en-IN').format(value);
};

/**
 * Gets a relative time description (e.g., "2 days ago")
 * @param {string} dateString - The date string
 * @returns {string} - Relative time description
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays === 1) return 'Tomorrow';
  
  if (diffInDays > -7 && diffInDays < 7) {
    return rtf.format(diffInDays, 'day');
  }
  
  const diffInMonths = (date.getFullYear() - now.getFullYear()) * 12 + date.getMonth() - now.getMonth();
  
  if (diffInMonths > -12 && diffInMonths < 12) {
    return rtf.format(diffInMonths, 'month');
  }
  
  const diffInYears = date.getFullYear() - now.getFullYear();
  return rtf.format(diffInYears, 'year');
}; 