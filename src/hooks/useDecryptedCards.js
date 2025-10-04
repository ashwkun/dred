// useDecryptedCards.js - Lazy decryption with auto-clearing cache
import { useState, useEffect, useRef, useCallback } from 'react';
import { securityManager, securePlaintextManager } from '../utils/security';
import { secureLog } from '../utils/secureLogger';

// Shared cache across all components (singleton pattern)
let globalCache = {
  data: null,
  timestamp: null,
  masterPassword: null,
  cards: null,
  securePlaintexts: [] // Track SecurePlaintext instances for cleanup
};

const CACHE_DURATION = 30000; // 30 seconds
const CLEAR_TIMEOUT = 60000; // Clear after 60 seconds of inactivity

/**
 * Lazy decryption hook with intelligent caching
 * - Decrypts on-demand (not upfront)
 * - Caches for 30 seconds to avoid redundant decryption
 * - Auto-clears after 60 seconds of inactivity
 * - Shared cache across ViewCards, Settings, BillPay
 */
export function useDecryptedCards(cards, masterPassword) {
  const [decryptedCards, setDecryptedCards] = useState([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const clearTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const clearCache = useCallback(() => {
    // Zero all secure plaintexts before clearing cache
    if (globalCache.securePlaintexts && globalCache.securePlaintexts.length > 0) {
      globalCache.securePlaintexts.forEach(sp => securePlaintextManager.unregister(sp));
      globalCache.securePlaintexts = [];
    }
    
    globalCache.data = null;
    globalCache.timestamp = null;
    globalCache.masterPassword = null;
    globalCache.cards = null;
    
    if (mountedRef.current) {
      setDecryptedCards([]);
    }
  }, []);

  const decryptCards = useCallback(async () => {
    if (!masterPassword || !cards || cards.length === 0) {
      setDecryptedCards([]);
      return;
    }

    // Check if cache is still valid
    const now = Date.now();
    const cacheValid = 
      globalCache.data &&
      globalCache.timestamp &&
      (now - globalCache.timestamp) < CACHE_DURATION &&
      globalCache.masterPassword === masterPassword &&
      JSON.stringify(globalCache.cards) === JSON.stringify(cards);

    if (cacheValid) {
      setDecryptedCards(globalCache.data);
      
      // Reset clear timer on cache hit
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      clearTimerRef.current = setTimeout(clearCache, CLEAR_TIMEOUT);
      return;
    }

    // Cache miss - decrypt from scratch
    setIsDecrypting(true);

    try {
      // Clear old secure plaintexts before creating new ones
      if (globalCache.securePlaintexts && globalCache.securePlaintexts.length > 0) {
        globalCache.securePlaintexts.forEach(sp => securePlaintextManager.unregister(sp));
        globalCache.securePlaintexts = [];
      }
      
      const newSecurePlaintexts = [];
      
      const decryptField = async (value, fallback = "", useSecure = false) => {
        if (!value) return fallback;
        try {
          const result = await securityManager.decryptData(String(value), masterPassword, useSecure);
          
          // Track secure plaintexts for cleanup
          if (useSecure && result) {
            newSecurePlaintexts.push(result);
          }
          
          return result || fallback;
        } catch (e) {
          secureLog.warn("Failed to decrypt field:", e.message);
          return fallback;
        }
      };

      // Decrypt all cards in parallel
      // 🔐 Use SecurePlaintext for cardNumber and CVV (most sensitive)
      const decryptedCardsPromises = cards.map(async (card) => ({
        id: card.id,
        theme: card.theme || "#6a3de8",
        cardName: await decryptField(card.cardName, "Card"),
        bankName: await decryptField(card.bankName, "Bank"),
        networkName: await decryptField(card.networkName, "Card"),
        cardNumberFull: await decryptField(card.cardNumberFull, "••••••••••••••••", true), // 🔒 Secure
        cardNumberLast4: await decryptField(card.cardNumberLast4, "••••"),
        cardHolder: await decryptField(card.cardHolder, "Card Holder"),
        cvv: await decryptField(card.cvv, "•••", true), // 🔒 Secure
        expiry: await decryptField(card.expiry, "MM/YY"),
      }));

      const result = await Promise.all(decryptedCardsPromises);

      // Update cache
      globalCache.data = result;
      globalCache.timestamp = Date.now();
      globalCache.masterPassword = masterPassword;
      globalCache.cards = cards;
      globalCache.securePlaintexts = newSecurePlaintexts;

      if (mountedRef.current) {
        setDecryptedCards(result);
      }

      // Set auto-clear timer
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      clearTimerRef.current = setTimeout(clearCache, CLEAR_TIMEOUT);
    } catch (error) {
      secureLog.error('Error decrypting cards:', error);
      if (mountedRef.current) {
        setDecryptedCards([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsDecrypting(false);
      }
    }
  }, [cards, masterPassword, clearCache]);

  // Trigger decryption when component mounts or deps change
  useEffect(() => {
    decryptCards();
  }, [decryptCards]);

  // Listen for master password timeout and clear plaintexts
  useEffect(() => {
    const handleTimeout = () => {
      clearCache();
    };
    
    window.addEventListener('master-password-timeout', handleTimeout);
    
    return () => {
      window.removeEventListener('master-password-timeout', handleTimeout);
    };
  }, [clearCache]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Don't clear cache on unmount - let auto-clear timer handle it
      // This allows other components to use the cache
    };
  }, []);

  return {
    decryptedCards,
    isDecrypting,
    clearCache
  };
}

/**
 * HOW TO USE SECURE PLAINTEXTS:
 * 
 * When you receive decrypted cards, sensitive fields (cardNumber, cvv) 
 * are SecurePlaintext instances, not strings. To use them:
 * 
 * 1. Import the helper:
 *    import { toSafeString } from '../utils/securePlaintextHelpers';
 * 
 * 2. Convert to string when needed:
 *    const cardNumberStr = toSafeString(card.cardNumberFull);
 * 
 * 3. The SecurePlaintext instances will be automatically zeroed:
 *    - After 5 minutes (failsafe timer)
 *    - When cache is cleared (60 seconds of inactivity)
 *    - When master password times out
 *    - When component unmounts (if clearCache is called)
 * 
 * SECURITY BENEFITS:
 * - Sensitive data stored in typed arrays (Uint8Array)
 * - Automatically zeroed (overwritten with random data, then zeros)
 * - Prevents plaintext from lingering in memory
 * - Tracked globally via securePlaintextManager
 */



