// usePartialDecrypt.js - Minimal decryption (metadata + last 4 only)
import { useState, useEffect, useRef, useCallback } from 'react';
import { securityManager, securePlaintextManager } from '../utils/security';
import { toSafeString } from '../utils/securePlaintextHelpers';
import { shouldLog } from '../utils/env';
import { secureLog } from '../utils/secureLogger';

// Shared cache for partial decryption
let partialCache = {
  data: null,
  timestamp: null,
  masterPassword: null,
  cards: null
};

const CACHE_DURATION = 60000; // 60 seconds (longer than full decrypt since it's safer)

/**
 * Partial decryption hook - only decrypts non-sensitive data
 * - Decrypts: cardName, bankName, networkName, cardNumberLast4, cardHolder
 * - Does NOT decrypt: cardNumberFirst, CVV, expiry
 * - Safe to keep in memory - cleared only when master password expires (5 min inactivity) or explicit logout
 * - No arbitrary timeout - synced with master password session lifetime
 */
export function usePartialDecrypt(cards, masterPassword) {
  const [partialCards, setPartialCards] = useState([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptingCards, setDecryptingCards] = useState({});
  const mountedRef = useRef(true);

  const clearCache = useCallback(() => {
    partialCache.data = null;
    partialCache.timestamp = null;
    partialCache.masterPassword = null;
    partialCache.cards = null;
    if (mountedRef.current) {
      setPartialCards([]);
    }
  }, []);

  const decryptCards = useCallback(async () => {
    if (!masterPassword || !cards || cards.length === 0) {
      setPartialCards([]);
      return;
    }

    // Check cache validity
    const now = Date.now();
    const cardsMatch = partialCache.cards && cards && 
      partialCache.cards.length === cards.length &&
      partialCache.cards.every((cachedCard, i) => 
        cachedCard.id === cards[i].id && 
        cachedCard.cardNumberLast4 === cards[i].cardNumberLast4 &&
        cachedCard.cardName === cards[i].cardName
      );

    const cacheValid = 
      partialCache.data &&
      partialCache.timestamp &&
      (now - partialCache.timestamp) < CACHE_DURATION &&
      partialCache.masterPassword === masterPassword &&
      cardsMatch;

    if (cacheValid) {
      setPartialCards(partialCache.data);
      return;
    }

    // Cache miss - decrypt minimal data
    setIsDecrypting(true);

    try {
      const decryptField = async (value, fallback = "") => {
        if (!value) return fallback;
        try {
          const result = await securityManager.decryptData(String(value), masterPassword);
          return result || fallback;
        } catch (e) {
          if (shouldLog) secureLog.warn("Failed to decrypt field:", e.message);
          return fallback;
        }
      };

      // Decrypt only non-sensitive fields in parallel
      const partialCardsPromises = cards.map(async (card) => ({
        id: card.id,
        theme: card.theme || "#6a3de8",
        isAmex: card.isAmex || false,
        // Bill tracking (plain)
        billGenDay: card.billGenDay || null,
        billDueOffsetDays: card.billDueOffsetDays || null,
        lastPaidCycleKey: card.lastPaidCycleKey || null,
        // ✅ Decrypt these (non-sensitive metadata)
        cardName: await decryptField(card.cardName, "Card"),
        bankName: await decryptField(card.bankName, "Bank"),
        networkName: await decryptField(card.networkName, "Card"),
        cardNumberLast4Display: await decryptField(card.cardNumberLast4, "••••"), // Decrypted for display
        cardHolder: await decryptField(card.cardHolder, "Card Holder"),
        // ❌ Do NOT decrypt these (keep encrypted for reveal-on-demand)
        cardNumberFirst: card.cardNumberFirst, // Keep encrypted
        cardNumberLast4: card.cardNumberLast4, // Keep encrypted (needed for full reveal)
        cardNumberFull: card.cardNumberFull, // Keep encrypted (fallback path)
        cvv: card.cvv, // Keep encrypted
        expiry: card.expiry, // Keep encrypted
      }));

      const result = await Promise.all(partialCardsPromises);

      // Update cache
      partialCache.data = result;
      partialCache.timestamp = Date.now();
      partialCache.masterPassword = masterPassword;
      partialCache.cards = cards;

      if (mountedRef.current) {
        setPartialCards(result);
      }
    } catch (error) {
      if (shouldLog) secureLog.error('Error in partial decryption:', error);
      if (mountedRef.current) {
        setPartialCards([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsDecrypting(false);
      }
    }
  }, [cards, masterPassword, clearCache]);

  // Trigger decryption
  useEffect(() => {
    decryptCards();
  }, [decryptCards]);

  // Listen for master password timeout event to clear cache
  useEffect(() => {
    const handleMasterPasswordTimeout = () => {
      clearCache();
    };

    window.addEventListener('master-password-timeout', handleMasterPasswordTimeout);

    return () => {
      window.removeEventListener('master-password-timeout', handleMasterPasswordTimeout);
    };
  }, [clearCache]);

  // Clear cache when masterPassword changes to null (logout)
  useEffect(() => {
    if (!masterPassword && partialCache.data) {
      clearCache();
    }
  }, [masterPassword, clearCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    partialCards,
    isDecrypting,
    decryptingCards,
    clearCache
  };
}

/**
 * Decrypt card number on-demand (ONLY first digits)
 * Separate from CVV/expiry for better security
 * Returns SecurePlaintext instances that are auto-zeroed
 */
export function useRevealCardNumber(masterPassword) {
  const [revealedNumbers, setRevealedNumbers] = useState({});
  const timersRef = useRef({});
  const securePlaintextsRef = useRef({}); // Track SecurePlaintext instances

  const revealNumber = useCallback(async (cardId, card) => {
    if (!masterPassword || !card) return null;

    try {
      let securePlaintext;
      
      if (card.cardNumberFull) {
        // Legacy/full format: decrypt full card number on demand
        securePlaintext = await securityManager.decryptData(card.cardNumberFull, masterPassword, true);
      } else if (card.cardNumberFirst) {
        // Split format: decrypt first part; use already decrypted last4 if available
        const firstSecure = await securityManager.decryptData(card.cardNumberFirst, masterPassword, true);
        const firstPart = toSafeString(firstSecure, '');

        // Prefer already-decrypted last4 from partial cards
        let last4Part = (typeof card.cardNumberLast4Display === 'string' && /\d{4}/.test(card.cardNumberLast4Display))
          ? card.cardNumberLast4Display
          : '';

        // If not available, decrypt encrypted last4
        if (!last4Part && card.cardNumberLast4) {
          const last4Secure = await securityManager.decryptData(card.cardNumberLast4, masterPassword, true);
          last4Part = toSafeString(last4Secure, '');
          if (last4Secure && last4Secure.zero) last4Secure.zero();
        }

        if (!firstPart || !last4Part) {
          return null;
        }

        const fullNumber = firstPart + last4Part;

        // Create and register a SecurePlaintext for the combined number
        securePlaintext = securePlaintextManager.create(fullNumber);

        // Zero the first part plaintext
        if (firstSecure && firstSecure.zero) firstSecure.zero();
      } else {
        return null;
      }
      
      // Zero old plaintext if exists
      if (securePlaintextsRef.current[cardId]) {
        securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
      }
      
      // Store SecurePlaintext instance
      securePlaintextsRef.current[cardId] = securePlaintext;
      setRevealedNumbers(prev => ({ ...prev, [cardId]: securePlaintext }));

      // Auto-hide and zero after 30 seconds
      if (timersRef.current[cardId]) {
        clearTimeout(timersRef.current[cardId]);
      }
      timersRef.current[cardId] = setTimeout(() => {
        if (securePlaintextsRef.current[cardId]) {
          securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
          delete securePlaintextsRef.current[cardId];
        }
        setRevealedNumbers(prev => {
          const updated = { ...prev };
          delete updated[cardId];
          return updated;
        });
      }, 30000);

      return securePlaintext;
    } catch (error) {
      if (shouldLog) secureLog.error('Error revealing card number:', error);
      return null;
    }
  }, [masterPassword]);

  const hideNumber = useCallback((cardId) => {
    // Zero the secure plaintext
    if (securePlaintextsRef.current[cardId]) {
      securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
      delete securePlaintextsRef.current[cardId];
    }
    
    if (timersRef.current[cardId]) {
      clearTimeout(timersRef.current[cardId]);
      delete timersRef.current[cardId];
    }
    setRevealedNumbers(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
  }, []);

  // Cleanup on unmount - zero all plaintexts
  useEffect(() => {
    return () => {
      Object.values(securePlaintextsRef.current).forEach(sp => {
        securePlaintextManager.unregister(sp);
      });
      securePlaintextsRef.current = {};
      
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);
  
  // Listen for master password timeout
  useEffect(() => {
    const handleTimeout = () => {
      Object.values(securePlaintextsRef.current).forEach(sp => {
        securePlaintextManager.unregister(sp);
      });
      securePlaintextsRef.current = {};
      setRevealedNumbers({});
    };
    
    window.addEventListener('master-password-timeout', handleTimeout);
    return () => window.removeEventListener('master-password-timeout', handleTimeout);
  }, []);

  return {
    revealedNumbers,
    revealNumber,
    hideNumber
  };
}

/**
 * Decrypt CVV/expiry on-demand (ONLY when Show Details is clicked)
 * Separate from card number for maximum security
 * Returns SecurePlaintext for CVV, regular string for expiry
 */
export function useRevealDetails(masterPassword) {
  const [revealedDetails, setRevealedDetails] = useState({});
  const timersRef = useRef({});
  const securePlaintextsRef = useRef({}); // Track SecurePlaintext instances for CVV

  const revealDetails = useCallback(async (cardId, card) => {
    if (!masterPassword || !card) return null;

    try {
      // Zero old CVV plaintext if exists
      if (securePlaintextsRef.current[cardId]) {
        securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
      }
      
      // Decrypt CVV as SecurePlaintext (most sensitive)
      const cvvSecurePlaintext = await securityManager.decryptData(String(card.cvv), masterPassword, true);
      securePlaintextsRef.current[cardId] = cvvSecurePlaintext;
      
      // Decrypt expiry as regular string (less sensitive)
      let expiry = "MM/YY";
      try {
        expiry = await securityManager.decryptData(String(card.expiry), masterPassword) || "MM/YY";
        } catch (e) {
        // Silently fallback to placeholder
        }

      const details = {
        cvv: cvvSecurePlaintext,
        expiry: expiry,
      };

      // Store temporarily
      setRevealedDetails(prev => ({ ...prev, [cardId]: details }));

      // Auto-hide and zero after 30 seconds
      if (timersRef.current[cardId]) {
        clearTimeout(timersRef.current[cardId]);
      }
      timersRef.current[cardId] = setTimeout(() => {
        if (securePlaintextsRef.current[cardId]) {
          securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
          delete securePlaintextsRef.current[cardId];
        }
        setRevealedDetails(prev => {
          const updated = { ...prev };
          delete updated[cardId];
          return updated;
        });
      }, 30000);

      return details;
    } catch (error) {
      if (shouldLog) secureLog.error('Error revealing CVV/expiry:', error);
      return null;
    }
  }, [masterPassword]);

  const hideDetails = useCallback((cardId) => {
    // Zero the CVV secure plaintext
    if (securePlaintextsRef.current[cardId]) {
      securePlaintextManager.unregister(securePlaintextsRef.current[cardId]);
      delete securePlaintextsRef.current[cardId];
    }
    
    if (timersRef.current[cardId]) {
      clearTimeout(timersRef.current[cardId]);
      delete timersRef.current[cardId];
    }
    setRevealedDetails(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
  }, []);

  // Cleanup on unmount - zero all CVV plaintexts
  useEffect(() => {
    return () => {
      Object.values(securePlaintextsRef.current).forEach(sp => {
        securePlaintextManager.unregister(sp);
      });
      securePlaintextsRef.current = {};
      
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);
  
  // Listen for master password timeout
  useEffect(() => {
    const handleTimeout = () => {
      Object.values(securePlaintextsRef.current).forEach(sp => {
        securePlaintextManager.unregister(sp);
      });
      securePlaintextsRef.current = {};
      setRevealedDetails({});
    };
    
    window.addEventListener('master-password-timeout', handleTimeout);
    return () => window.removeEventListener('master-password-timeout', handleTimeout);
  }, []);

  return {
    revealedDetails,
    revealDetails,
    hideDetails
  };
}

