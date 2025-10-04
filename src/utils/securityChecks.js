/**
 * Security checks for production environment
 */

import { secureLog } from './secureLogger';

import { isProduction, shouldLog } from './env';

let devToolsDetected = false;

/**
 * Detect if developer tools are open
 */
export const detectDevTools = () => {
  if (isProduction && !devToolsDetected) {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      devToolsDetected = true;
      if (shouldLog) secureLog.warn('⚠️ Developer tools detected in production environment');

      // Optionally: Log to analytics service
      // analytics.logEvent('devtools_detected');
    }
  }
};

/**
 * Detect debugging attempts
 */
export const detectDebugger = () => {
  if (isProduction) {
    // Check for debugger every second
    setInterval(() => {
      const start = Date.now();
      debugger; // This will pause if devtools is open
      const end = Date.now();

      if (end - start > 100) {
        if (shouldLog) secureLog.warn('⚠️ Debugger detected');
      }
    }, 5000);
  }
};

/**
 * Initialize all security checks
 */
export const initSecurityChecks = () => {
  if (isProduction) {
    // Check on load
    detectDevTools();

    // Check on window resize
    window.addEventListener('resize', detectDevTools);

    // Periodic check
    setInterval(detectDevTools, 60000); // Every minute

    // Don't run debugger detection in production - too aggressive
    // detectDebugger();
  }
};

export default {
  initSecurityChecks,
  detectDevTools
};
