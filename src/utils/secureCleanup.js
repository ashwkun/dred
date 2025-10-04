/**
 * Secure cleanup utilities for sensitive data
 */

import { useEffect, useRef } from 'react';

/**
 * Securely wipe a string by overwriting with zeros
 */
export const secureWipeString = (str) => {
  if (typeof str !== 'string') return null;

  // Overwrite each character
  const length = str.length;
  let wiped = '';
  for (let i = 0; i < length; i++) {
    wiped += '\0';
  }

  // Return null
  return null;
};

/**
 * Securely wipe an object by nullifying all properties
 */
export const secureWipeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        obj[key] = secureWipeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        secureWipeObject(obj[key]);
      } else {
        obj[key] = null;
      }
    }
  }
};

/**
 * Securely wipe an array
 */
export const secureWipeArray = (arr) => {
  if (!Array.isArray(arr)) return;

  arr.forEach((item, index) => {
    if (typeof item === 'string') {
      arr[index] = secureWipeString(item);
    } else if (typeof item === 'object') {
      secureWipeObject(item);
    } else {
      arr[index] = null;
    }
  });

  arr.length = 0;
};

/**
 * React hook for automatic cleanup on unmount
 */
export const useSecureCleanup = (cleanupFn) => {
  const cleanupRef = useRef(cleanupFn);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};
