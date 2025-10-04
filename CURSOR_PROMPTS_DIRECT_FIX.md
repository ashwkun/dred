# Direct Security Fix Prompts (No Backward Compatibility)

**Approach:** Clean slate - all existing cards will need to be re-added by users  
**Benefit:** Simpler, cleaner code with no migration complexity  
**Model:** Claude 3.5 Sonnet for all prompts

---

## 🎯 COMPREHENSIVE PROMPT 1: Split Storage Implementation (30-40 min)

```
TASK: Implement split card number storage across ALL components for security.

CHANGES REQUIRED:

=== 1. UPDATE src/utils/security.js ===

Add new encryption helper methods to SecurityManager class (after line 157):

```javascript
// Encrypt card number as split fields
encryptCardNumberSplit(cardNumber, masterPassword) {
  const last4 = cardNumber.slice(-4);
  return {
    cardNumberLast4: this.encryptData(last4, masterPassword),
    cardNumberFull: this.encryptData(cardNumber, masterPassword)
  };
}

// Decrypt only last 4 digits
decryptCardNumberLast4(encryptedLast4, masterPassword) {
  return this.decryptData(encryptedLast4, masterPassword);
}

// Decrypt full card number (use sparingly!)
decryptCardNumberFull(encryptedFull, masterPassword) {
  return this.decryptData(encryptedFull, masterPassword);
}
```

=== 2. UPDATE src/AddCard.jsx ===

FIND the handleAddCard function (around lines 70-145) where card data is encrypted.

REPLACE this section:
```javascript
cardNumber: CryptoJS.AES.encrypt(cardNumber.replace(/\s/g, ''), masterPassword).toString(),
```

WITH:
```javascript
cardNumberLast4: CryptoJS.AES.encrypt(cardNumber.slice(-4), masterPassword).toString(),
cardNumberFull: CryptoJS.AES.encrypt(cardNumber.replace(/\s/g, ''), masterPassword).toString(),
```

=== 3. UPDATE src/ViewCards.jsx ===

A. REMOVE the decryptField function (lines 164-178) and REPLACE with:

```javascript
const decryptCardNumberForDisplay = (card) => {
  try {
    if (!card.cardNumberLast4) return '••••';
    const last4 = securityManager.decryptData(card.cardNumberLast4, masterPassword);
    return `•••• •••• •••• ${last4}`;
  } catch (error) {
    console.error('Error decrypting card number for display:', error);
    return '•••• •••• •••• ••••';
  }
};

const decryptField = (encryptedValue) => {
  try {
    if (!encryptedValue) return '';
    if (!masterPassword) return '[Error: Decryption key missing]';
    return securityManager.decryptData(encryptedValue, masterPassword);
  } catch (error) {
    console.error('Error decrypting field:', error);
    return '[Decryption failed]';
  }
};
```

B. FIND the card mapping section (lines 322-503) and UPDATE:

REPLACE:
```javascript
const decryptedCardNumber = (() => {
  try {
    return decryptField(card.cardNumber) || "••••••••••••••••";
  } catch (error) {
    console.error("Failed to decrypt card number:", error);
    return "••••••••••••••••";
  }
})();
```

WITH:
```javascript
const displayCardNumber = decryptCardNumberForDisplay(card);
```

C. UPDATE the display section (line 436):

REPLACE:
```javascript
{decryptedCardNumber.replace(/(.{4})/g, "$1 ").trim()}
```

WITH:
```javascript
{displayCardNumber}
```

D. UPDATE handleCopy function (lines 219-229):

REPLACE ENTIRE FUNCTION with:
```javascript
const handleCopy = (e, card, cardId) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Decrypt full number ONLY for copy
  let fullNumber = null;
  try {
    fullNumber = securityManager.decryptCardNumberFull(card.cardNumberFull, masterPassword);
    navigator.clipboard.writeText(fullNumber.replace(/\s/g, ''));
    
    setCopyFeedback(prev => ({ ...prev, [cardId]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
    }, 1500);
    
    // Auto-clear clipboard after 10 seconds
    setTimeout(async () => {
      await navigator.clipboard.writeText('');
    }, 10000);
  } catch (error) {
    console.error('Error copying card number:', error);
  } finally {
    // Clear from memory immediately
    fullNumber = null;
  }
};
```

E. UPDATE the copy button call (around line 439):

REPLACE:
```javascript
onClick={(e) => handleCopy(e, decryptedCardNumber, card.id)}
```

WITH:
```javascript
onClick={(e) => handleCopy(e, card, card.id)}
```

=== 4. UPDATE src/BillPay.jsx ===

A. FIND the loadData function where cards are decrypted (lines 74-90).

REPLACE:
```javascript
const decryptedCard = {
  ...doc.data(),
  id: doc.id,
  cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8),
  bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
  networkName: CryptoJS.AES.decrypt(doc.data().networkName, masterPassword).toString(CryptoJS.enc.Utf8),
  cardHolder: CryptoJS.AES.decrypt(doc.data().cardHolder, masterPassword).toString(CryptoJS.enc.Utf8),
  theme: doc.data().theme || "#6a3de8"
};
```

WITH:
```javascript
const decryptedCard = {
  ...doc.data(),
  id: doc.id,
  // Only decrypt what's needed for display
  cardNumberLast4Display: CryptoJS.AES.decrypt(doc.data().cardNumberLast4, masterPassword).toString(CryptoJS.enc.Utf8),
  bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
  networkName: CryptoJS.AES.decrypt(doc.data().networkName, masterPassword).toString(CryptoJS.enc.Utf8),
  cardHolder: CryptoJS.AES.decrypt(doc.data().cardHolder, masterPassword).toString(CryptoJS.enc.Utf8),
  // Keep encrypted full number for UPI generation
  cardNumberFull: doc.data().cardNumberFull,
  theme: doc.data().theme || "#6a3de8"
};
```

B. UPDATE getUpiId function (lines 150-175):

ADD at the beginning of the function:
```javascript
const getUpiId = (card) => {
  if (!mobileNumber) {
    console.log("No mobile number available");
    return null;
  }
  
  // Decrypt full number ONLY when needed for UPI
  let fullNumber = null;
  try {
    fullNumber = CryptoJS.AES.decrypt(card.cardNumberFull, masterPassword).toString(CryptoJS.enc.Utf8);
    const last4 = card.cardNumberLast4Display;
    const cardNumber = fullNumber.replace(/\s/g, '');
    
    // ... existing bank detection logic ...
    
    // Clear from memory
    fullNumber = null;
    
    return upiId;
  } catch (error) {
    console.error('Error generating UPI ID:', error);
    return null;
  } finally {
    fullNumber = null;
  }
};
```

C. UPDATE the card display section (line 322-373) to use cardNumberLast4Display:

REPLACE:
```javascript
const last4 = card.cardNumber.slice(-4);
```

WITH:
```javascript
const last4 = card.cardNumberLast4Display;
```

=== 5. UPDATE src/features/settings/Settings.jsx ===

A. FIND the loadCards function (lines 40-94).

REPLACE the card decryption section (lines 54-68):
```javascript
try {
  return {
    id: doc.id,
    cardType: CryptoJS.AES.decrypt(doc.data().cardType, masterPassword).toString(CryptoJS.enc.Utf8),
    bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
    cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8),
    priority: doc.data().priority,
    createdAt: doc.data().createdAt
  };
}
```

WITH:
```javascript
try {
  return {
    id: doc.id,
    cardType: CryptoJS.AES.decrypt(doc.data().cardType, masterPassword).toString(CryptoJS.enc.Utf8),
    bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
    cardNumberLast4: CryptoJS.AES.decrypt(doc.data().cardNumberLast4, masterPassword).toString(CryptoJS.enc.Utf8),
    priority: doc.data().priority,
    createdAt: doc.data().createdAt
  };
}
```

B. UPDATE display sections (lines 315 and 684):

REPLACE:
```javascript
{card.bankName} •••• {card.cardNumber.slice(-4)}
```

WITH:
```javascript
{card.bankName} •••• {card.cardNumberLast4}
```

=== 6. CHECK OTHER FILES ===

Search the entire src/ directory for any other references to:
- `card.cardNumber` (should be replaced with cardNumberLast4 or cardNumberFull)
- `decryptField(card.cardNumber)` 
- Direct decryption of cardNumber field

Files to check:
- src/App.jsx (lines 293-357 where cards are loaded)
- src/CardCustomization.jsx (if it accesses card data)
- Any utility files in src/utils/

UPDATE ALL REFERENCES to use the new split format.

=== 7. UPDATE Firestore Security Rules (firestore.rules) ===

REPLACE the cards match block with:
```javascript
match /cards/{cardId} {
  allow read: if request.auth != null && 
                 resource.data.uid == request.auth.uid;
  
  allow write: if request.auth != null && 
                  request.resource.data.uid == request.auth.uid &&
                  request.resource.data.keys().hasAll(['cardNumberLast4', 'cardNumberFull']) &&
                  request.resource.data.cardNumberLast4 is string &&
                  request.resource.data.cardNumberFull is string;
  
  allow delete: if request.auth != null && 
                   resource.data.uid == request.auth.uid;
}
```

=== VERIFICATION ===

After making all changes:
1. Search entire codebase for "card.cardNumber" (should find ZERO results except in comments)
2. Build the app: `npm run build` (should have no errors)
3. Test adding a new card
4. Test viewing cards (should show only last 4)
5. Test copying card number (should work)
6. Test BillPay (should generate UPI correctly)
7. Test Settings delete/reorder

Show me ALL the modified code for each file listed above.
```

---

## 🧹 COMPREHENSIVE PROMPT 2: Memory Cleanup Implementation (20-30 min)

```
TASK: Implement automatic memory cleanup for all decrypted card data.

CHANGES REQUIRED:

=== 1. CREATE src/utils/secureCleanup.js ===

```javascript
/**
 * Secure cleanup utilities for sensitive data
 */

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
import { useEffect, useRef } from 'react';

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
```

=== 2. UPDATE src/utils/security.js ===

REPLACE the clearSensitiveData method (lines 160-165) with:

```javascript
// Clear sensitive data from memory
clearSensitiveData() {
  // This method is now deprecated - use secureWipeString/Object/Array instead
  // Kept for backward compatibility
  console.warn('clearSensitiveData is deprecated. Use secureWipe utilities instead.');
}

// New method to clear decrypted card data
clearDecryptedCardData(cards) {
  if (!Array.isArray(cards)) return;
  
  cards.forEach(card => {
    // Wipe any decrypted fields
    if (card.cardNumberFull) card.cardNumberFull = null;
    if (card.cardNumberLast4Display) card.cardNumberLast4Display = null;
    if (card.cvv) card.cvv = null;
    if (card.expiry) card.expiry = null;
  });
}
```

=== 3. UPDATE src/ViewCards.jsx ===

ADD imports at the top:
```javascript
import { useSecureCleanup, secureWipeString, secureWipeArray } from './utils/secureCleanup';
```

ADD cleanup effect after the existing useEffects (around line 156):

```javascript
// Cleanup on unmount
useEffect(() => {
  return () => {
    console.log('ViewCards: Cleaning up card data on unmount');
    
    // Clear any decrypted data
    securityManager.clearDecryptedCardData(cards);
    
    // Clear state
    setCards([]);
    setShowDetails({});
  };
}, []);
```

UPDATE handleCopy function to use secureWipeString:

```javascript
const handleCopy = (e, card, cardId) => {
  e.preventDefault();
  e.stopPropagation();
  
  let fullNumber = null;
  try {
    fullNumber = securityManager.decryptCardNumberFull(card.cardNumberFull, masterPassword);
    navigator.clipboard.writeText(fullNumber.replace(/\s/g, ''));
    
    setCopyFeedback(prev => ({ ...prev, [cardId]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
    }, 1500);
    
    // Auto-clear clipboard after 10 seconds
    setTimeout(async () => {
      await navigator.clipboard.writeText('');
    }, 10000);
  } catch (error) {
    console.error('Error copying card number:', error);
  } finally {
    // SECURE WIPE
    fullNumber = secureWipeString(fullNumber);
  }
};
```

=== 4. UPDATE src/BillPay.jsx ===

ADD imports at the top:
```javascript
import { secureWipeString } from './utils/secureCleanup';
```

ADD cleanup effect after the loadData useEffect (after line 114):

```javascript
// Cleanup on unmount
useEffect(() => {
  return () => {
    console.log('BillPay: Cleaning up on unmount');
    
    // Wipe mobile number
    if (mobileNumber) {
      setMobileNumber('');
    }
    
    // Clear cards
    setCards([]);
    setSupportedCards([]);
  };
}, []);
```

UPDATE getUpiId function to use secureWipeString:

```javascript
const getUpiId = (card) => {
  if (!mobileNumber) return null;
  
  let fullNumber = null;
  try {
    fullNumber = CryptoJS.AES.decrypt(card.cardNumberFull, masterPassword).toString(CryptoJS.enc.Utf8);
    const last4 = card.cardNumberLast4Display;
    const cardNumber = fullNumber.replace(/\s/g, '');
    
    // ... existing UPI generation logic ...
    
    return upiId;
  } catch (error) {
    console.error('Error generating UPI ID:', error);
    return null;
  } finally {
    // SECURE WIPE
    fullNumber = secureWipeString(fullNumber);
  }
};
```

=== 5. UPDATE src/features/settings/Settings.jsx ===

ADD imports at the top:
```javascript
import { secureWipeArray } from '../../utils/secureCleanup';
```

ADD cleanup when sections collapse and on unmount.

ADD this effect near the other useEffects:

```javascript
// Cleanup when Delete Cards section collapses
useEffect(() => {
  if (!showDeleteCards && cards.length > 0) {
    console.log('Settings: Cleaning up cards data (Delete section collapsed)');
    secureWipeArray(cards);
    setCards([]);
  }
}, [showDeleteCards]);

// Cleanup when Reorder section collapses
useEffect(() => {
  if (!showReorder && cards.length > 0) {
    console.log('Settings: Cleaning up cards data (Reorder section collapsed)');
    secureWipeArray(cards);
    setCards([]);
  }
}, [showReorder]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    console.log('Settings: Cleaning up on unmount');
    secureWipeArray(cards);
    setCards([]);
  };
}, []);
```

=== 6. UPDATE src/App.jsx ===

CHECK if App.jsx loads or stores card data (around lines 293-357).

If it does, ADD cleanup:

```javascript
import { secureWipeArray } from './utils/secureCleanup';

// In the useEffect that loads cards, add cleanup:
useEffect(() => {
  // ... existing card loading logic ...
  
  return () => {
    if (unsubscribe) {
      console.log("App.jsx: Cleaning up cards listener");
      unsubscribe();
    }
    // Clear cards data
    secureWipeArray(cards);
    setCards([]);
  };
}, [user, masterPassword]);
```

=== VERIFICATION ===

1. Navigate between pages and check console for "Cleaning up" messages
2. Open React DevTools → Components → check state is cleared after unmount
3. View cards, navigate away, check memory in Chrome DevTools
4. Test that functionality still works (add, view, delete cards)

Show me all the modified code.
```

---

## ⏱️ COMPREHENSIVE PROMPT 3: Time-Limited Decryption & Secure Clipboard (15-20 min)

```
TASK: Implement time-limited decryption for CVV/Expiry and auto-clearing clipboard.

CHANGES REQUIRED:

=== 1. UPDATE src/ViewCards.jsx ===

ADD new state for time-limited decryption (after existing useState declarations):

```javascript
const [temporaryDecrypted, setTemporaryDecrypted] = useState({});
// Structure: { [cardId]: { cvv: string, expiry: string, expiresAt: number, timerId: number } }

const [clipboardTimers, setClipboardTimers] = useState({});
```

UPDATE the existing auto-hide useEffect (lines 52-66) to include data wiping:

REPLACE:
```javascript
useEffect(() => {
  const timers = {};
  
  Object.keys(showDetails).forEach(cardId => {
    if (showDetails[cardId]) {
      timers[cardId] = setTimeout(() => {
        setShowDetails(prev => ({ ...prev, [cardId]: false }));
      }, 5000);
    }
  });

  return () => {
    Object.values(timers).forEach(timer => clearTimeout(timer));
  };
}, [showDetails]);
```

WITH:
```javascript
// Auto-hide and clear decrypted data after 30 seconds
useEffect(() => {
  const timers = {};
  
  Object.keys(showDetails).forEach(cardId => {
    if (showDetails[cardId] && !temporaryDecrypted[cardId]) {
      // Decrypt CVV and Expiry when showing
      const card = cards.find(c => c.id === cardId);
      if (card) {
        try {
          const decryptedCVV = decryptField(card.cvv);
          const decryptedExpiry = decryptField(card.expiry);
          
          const expiresAt = Date.now() + 30000; // 30 seconds
          
          setTemporaryDecrypted(prev => ({
            ...prev,
            [cardId]: { cvv: decryptedCVV, expiry: decryptedExpiry, expiresAt }
          }));
        } catch (error) {
          console.error('Error decrypting sensitive fields:', error);
        }
      }
      
      // Auto-clear after 30 seconds
      timers[cardId] = setTimeout(() => {
        setTemporaryDecrypted(prev => {
          const data = prev[cardId];
          if (data) {
            // Secure wipe
            secureWipeString(data.cvv);
            secureWipeString(data.expiry);
          }
          const { [cardId]: removed, ...rest } = prev;
          return rest;
        });
        setShowDetails(prev => ({ ...prev, [cardId]: false }));
      }, 30000);
    }
  });

  return () => {
    Object.values(timers).forEach(timer => clearTimeout(timer));
  };
}, [showDetails, cards, temporaryDecrypted]);
```

UPDATE the CVV/Expiry display section (lines 458-472):

REPLACE:
```javascript
const decryptedCVV = (() => {
  try {
    return decryptField(card.cvv) || "•••";
  } catch (error) {
    console.error("Failed to decrypt CVV:", error);
    return "•••";
  }
})();
const decryptedExpiry = (() => {
  try {
    return decryptField(card.expiry) || "MM/YY";
  } catch (error) {
    console.error("Failed to decrypt expiry:", error);
    return "MM/YY";
  }
})();
```

WITH:
```javascript
// Use temporaryDecrypted instead of decrypting inline
const decryptedCVV = temporaryDecrypted[card.id]?.cvv || "•••";
const decryptedExpiry = temporaryDecrypted[card.id]?.expiry || "MM/YY";
```

ADD countdown timer display in the CVV/Expiry section:

```javascript
// Add this in the JSX where CVV/Expiry is shown
{temporaryDecrypted[card.id] && (
  <CountdownDisplay expiresAt={temporaryDecrypted[card.id].expiresAt} />
)}
```

ADD CountdownDisplay component (before the main component return):

```javascript
// Countdown timer component
const CountdownDisplay = ({ expiresAt }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  if (secondsLeft === 0) return null;
  
  return (
    <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/70">
      Auto-hide in: {secondsLeft}s
    </div>
  );
};
```

UPDATE handleCopy to show clipboard clear countdown:

REPLACE the entire handleCopy function with:

```javascript
const handleCopy = (e, card, cardId) => {
  e.preventDefault();
  e.stopPropagation();
  
  let fullNumber = null;
  try {
    fullNumber = securityManager.decryptCardNumberFull(card.cardNumberFull, masterPassword);
    navigator.clipboard.writeText(fullNumber.replace(/\s/g, ''));
    
    // Show copied message with countdown
    setCopyFeedback(prev => ({ ...prev, [cardId]: 'Copied! Clearing in 10s...' }));
    
    // Update countdown every second
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        setCopyFeedback(prev => ({ ...prev, [cardId]: `Copied! Clearing in ${countdown}s...` }));
      }
    }, 1000);
    
    // Clear feedback after 10 seconds
    const feedbackTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      setCopyFeedback(prev => ({ ...prev, [cardId]: 'Clipboard cleared' }));
      
      // Remove message after 2 more seconds
      setTimeout(() => {
        setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
      }, 2000);
    }, 10000);
    
    // Auto-clear clipboard after 10 seconds
    const clipboardTimer = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
        console.log('Clipboard cleared for security');
      } catch (err) {
        console.error('Failed to clear clipboard:', err);
      }
    }, 10000);
    
    // Store timers for cleanup
    setClipboardTimers(prev => ({
      ...prev,
      [cardId]: { countdownInterval, feedbackTimer, clipboardTimer }
    }));
    
  } catch (error) {
    console.error('Error copying card number:', error);
    setCopyFeedback(prev => ({ ...prev, [cardId]: 'Copy failed' }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
    }, 2000);
  } finally {
    fullNumber = secureWipeString(fullNumber);
  }
};
```

ADD cleanup for clipboard timers in the unmount useEffect:

```javascript
useEffect(() => {
  return () => {
    // ... existing cleanup ...
    
    // Clear all clipboard timers
    Object.values(clipboardTimers).forEach(({ countdownInterval, feedbackTimer, clipboardTimer }) => {
      clearInterval(countdownInterval);
      clearTimeout(feedbackTimer);
      clearTimeout(clipboardTimer);
    });
    
    // Clear temporary decrypted data
    Object.values(temporaryDecrypted).forEach(data => {
      if (data.cvv) secureWipeString(data.cvv);
      if (data.expiry) secureWipeString(data.expiry);
    });
    setTemporaryDecrypted({});
  };
}, [clipboardTimers, temporaryDecrypted]);
```

UPDATE the copy feedback display (around line 446-453):

REPLACE:
```javascript
{copyFeedback[card.id] && (
  <div className="absolute -top-8 left-1/2 -translate-x-1/2 
    bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/90
    border border-white/10 whitespace-nowrap z-30"
  >
    Copied!
  </div>
)}
```

WITH:
```javascript
{copyFeedback[card.id] && (
  <div className="absolute -top-8 left-1/2 -translate-x-1/2 
    bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/90
    border border-white/10 whitespace-nowrap z-30"
  >
    {copyFeedback[card.id]}
  </div>
)}
```

=== VERIFICATION ===

1. Click "Show Details" on a card
2. Verify countdown timer appears showing 30s
3. Wait and verify CVV/Expiry auto-hide after 30 seconds
4. Click copy button
5. Verify "Copied! Clearing in 10s..." message
6. Wait 10 seconds
7. Verify clipboard is empty
8. Check console for no errors

Show me all the modified code for ViewCards.jsx.
```

---

## 🔒 COMPREHENSIVE PROMPT 4: Production Hardening (15-20 min)

```
TASK: Remove console logs, add secure logging, and harden production build.

CHANGES REQUIRED:

=== 1. CREATE src/utils/secureLogger.js ===

```javascript
/**
 * Secure logging utility that redacts sensitive data
 * Only logs in development, strips in production
 */

const isDevelopment = import.meta.env.DEV;

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
```

=== 2. REPLACE CONSOLE LOGS IN ALL FILES ===

Search and replace in these files:

A. **src/ViewCards.jsx**
Replace ALL instances of:
- `console.log(` → `secureLog.debug(`
- `console.error(` → `secureLog.error(`
- `console.warn(` → `secureLog.warn(`

Add import at top: `import { secureLog } from './utils/secureLogger';`

B. **src/AddCard.jsx**
Same replacements as above.
Add import at top: `import { secureLog } from './utils/secureLogger';`

C. **src/BillPay.jsx**
Same replacements.
Add import at top: `import { secureLog } from './utils/secureLogger';`

D. **src/features/settings/Settings.jsx**
Same replacements.
Add import at top: `import { secureLog } from '../../utils/secureLogger';`

E. **src/MasterPasswordPrompt.jsx**
Same replacements.
Add import at top: `import { secureLog } from './utils/secureLogger';`

F. **src/App.jsx**
Same replacements.
Add import at top: `import { secureLog } from './utils/secureLogger';`

G. **src/utils/security.js**
Same replacements.
Add import at top: `import { secureLog } from './secureLogger';`

=== 3. UPDATE vite.config.js ===

ADD production build optimization:

FIND the export default defineConfig section and UPDATE:

```javascript
export default defineConfig({
  plugins: [react()],
  
  // ... existing config ...
  
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,        // Remove all console.* in production
        drop_debugger: true,       // Remove debugger statements
        pure_funcs: [
          'console.log',
          'console.debug',
          'console.info',
          'console.warn'
        ]
      },
      mangle: {
        safari10: true
      }
    },
    sourcemap: false,  // Don't generate sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks: {
          'crypto': ['crypto-js'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
```

=== 4. CREATE src/utils/securityChecks.js ===

```javascript
/**
 * Security checks for production environment
 */

let devToolsDetected = false;

/**
 * Detect if developer tools are open
 */
export const detectDevTools = () => {
  if (import.meta.env.PROD && !devToolsDetected) {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      devToolsDetected = true;
      console.warn('⚠️ Developer tools detected in production environment');
      
      // Optionally: Log to analytics service
      // analytics.logEvent('devtools_detected');
    }
  }
};

/**
 * Detect debugging attempts
 */
export const detectDebugger = () => {
  if (import.meta.env.PROD) {
    // Check for debugger every second
    setInterval(() => {
      const start = Date.now();
      debugger; // This will pause if devtools is open
      const end = Date.now();
      
      if (end - start > 100) {
        console.warn('⚠️ Debugger detected');
      }
    }, 5000);
  }
};

/**
 * Initialize all security checks
 */
export const initSecurityChecks = () => {
  if (import.meta.env.PROD) {
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
```

=== 5. UPDATE src/main.jsx ===

ADD security checks initialization:

```javascript
import { initSecurityChecks } from './utils/securityChecks';

// ... existing imports and code ...

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

// Initialize security checks
initSecurityChecks();
```

=== 6. UPDATE firestore.rules ===

REPLACE the entire file with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check user owns resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Cards collection
    match /cards/{cardId} {
      // Allow read if user owns the card
      allow read: if isOwner(resource.data.uid);
      
      // Allow write if user owns the card and required fields exist
      allow create: if isOwner(request.resource.data.uid) &&
                       request.resource.data.keys().hasAll([
                         'cardNumberLast4',
                         'cardNumberFull',
                         'cvv',
                         'expiry',
                         'bankName',
                         'networkName',
                         'cardHolder',
                         'cardType'
                       ]) &&
                       request.resource.data.cardNumberLast4 is string &&
                       request.resource.data.cardNumberFull is string;
      
      // Allow update if user owns the card
      allow update: if isOwner(resource.data.uid) &&
                       isOwner(request.resource.data.uid);
      
      // Allow delete if user owns the card
      allow delete: if isOwner(resource.data.uid);
    }
    
    // Validation strings (for master password)
    match /validationStrings/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Mobile numbers (for bill pay)
    match /mobile_numbers/{docId} {
      allow read: if isAuthenticated() && resource.data.uid == request.auth.uid;
      allow write: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
    }
    
    // User security (lockout tracking)
    match /userSecurity/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

=== VERIFICATION ===

1. Build production: `npm run build`
2. Check dist/assets/*.js files - should have NO console.log statements
3. Test in production mode: `npm run preview`
4. Open DevTools - should see warning in console (dev mode only)
5. Check that app functions correctly
6. Deploy updated Firestore rules: `firebase deploy --only firestore:rules`

Show me all the modified files.
```

---

## ✅ FINAL VERIFICATION PROMPT (10-15 min)

```
TASK: Final comprehensive verification that all security fixes are working correctly.

VERIFICATION CHECKLIST:

=== 1. CODE AUDIT ===

A. Search entire src/ directory for:
```bash
# Run these searches and show results:

# 1. Check for old cardNumber field usage (should be ZERO results)
grep -r "card\.cardNumber[^FL]" src/

# 2. Check for direct CryptoJS usage outside utils/security.js
grep -r "CryptoJS\.AES\." src/ | grep -v "src/AddCard.jsx" | grep -v "src/BillPay.jsx" | grep -v "src/features/settings/Settings.jsx"

# 3. Check for console.log (should only be secureLog)
grep -r "console\.log\|console\.error\|console\.warn" src/ | grep -v "secureLog" | grep -v "node_modules"

# 4. Check for missing secureWipe calls
grep -r "fullNumber =" src/ | grep -v "secureWipeString"
```

Report any findings and fix them.

B. Verify imports in all modified files:
- ViewCards.jsx: Should import secureLog, secureWipeString
- AddCard.jsx: Should import secureLog
- BillPay.jsx: Should import secureLog, secureWipeString
- Settings.jsx: Should import secureLog, secureWipeArray
- App.jsx: Should import secureLog

=== 2. FUNCTIONAL TESTING ===

Test these scenarios and report results:

A. **Add New Card**
1. Navigate to Add Card
2. Fill in card details: 
   - Card Number: 4532015112830366 (test card)
   - CVV: 123
   - Expiry: 12/25
   - Name: Test User
3. Submit form
4. Check Firestore document has: cardNumberLast4, cardNumberFull (both encrypted)
5. Verify no old "cardNumber" field exists

B. **View Cards**
1. Navigate to View Cards
2. Verify card displays as: "•••• •••• •••• 0366"
3. Verify full card number is NOT visible in React DevTools state
4. Click "Show Details"
5. Verify CVV and Expiry appear
6. Verify countdown timer shows "Auto-hide in: 30s"
7. Wait 30 seconds
8. Verify CVV/Expiry automatically hide
9. Check React DevTools - temporaryDecrypted should be empty

C. **Copy Card Number**
1. Click copy button on a card
2. Verify message: "Copied! Clearing in 10s..."
3. Paste into notepad - should show full 16-digit number
4. Wait 10 seconds
5. Try to paste again - clipboard should be empty
6. Verify message changed to "Clipboard cleared"

D. **Bill Pay**
1. Navigate to Bill Pay
2. Add mobile number if not present
3. Verify cards show only last 4 digits
4. Click "Pay Bill" button
5. Verify UPI URL is generated correctly
6. Check console - no full card numbers logged

E. **Settings - Delete Card**
1. Navigate to Settings
2. Expand "Delete Cards" section
3. Verify cards show only last 4 digits
4. Delete a card
5. Verify card is removed from Firestore
6. Collapse section
7. Check console for "Cleaning up" message

F. **Settings - Reorder Cards**
1. Expand "Reorder Cards" section
2. Drag cards to reorder
3. Click "Save Order"
4. Verify order saved in Firestore
5. Collapse section
6. Check console for "Cleaning up" message

=== 3. SECURITY TESTING ===

A. **Memory Inspection**
1. Open Chrome DevTools → Memory tab
2. Take a heap snapshot
3. Search for "4532" (test card number)
4. Should find ZERO results for full card number in plaintext
5. Navigate away from ViewCards
6. Take another heap snapshot
7. Compare - memory should be released

B. **React DevTools Inspection**
1. Open React DevTools
2. Navigate to ViewCards component
3. Check state:
   - cards array should have cardNumberLast4 and cardNumberFull (encrypted strings)
   - Should NOT have any plaintext card numbers
4. Click "Show Details"
5. Check temporaryDecrypted in state
6. Wait 30 seconds
7. temporaryDecrypted should be empty

C. **Console Log Check**
1. Build production: `npm run build`
2. Serve: `npm run preview`
3. Open console
4. Perform all actions (add card, view, copy, etc.)
5. Console should be EMPTY (no logs in production)

D. **Clipboard Security**
1. Copy card number
2. Open browser's clipboard history (if available)
3. After 10 seconds, verify clipboard is cleared
4. Check clipboard managers don't retain the data

=== 4. BUILD VERIFICATION ===

```bash
# 1. Build for production
npm run build

# 2. Check build output
ls -lh dist/assets/

# 3. Check for console.log in bundles
grep -r "console\.log" dist/assets/

# 4. Preview production build
npm run preview
```

Should have:
- ✅ No console.log in dist/assets/*.js
- ✅ Minified and optimized bundles
- ✅ No source maps (sourcemap: false)

=== 5. FIRESTORE RULES TESTING ===

Test these scenarios in Firebase Console:

A. **Try to read another user's card**
- Should FAIL with permission denied

B. **Try to create card without cardNumberLast4**
- Should FAIL with validation error

C. **Try to create card without cardNumberFull**
- Should FAIL with validation error

D. **Try to update card to remove required fields**
- Should FAIL with validation error

E. **Try to delete own card**
- Should SUCCEED

=== 6. FINAL CHECKLIST ===

Mark each as complete:

- [ ] No plaintext card numbers in code
- [ ] All console.log replaced with secureLog
- [ ] secureWipe called after decryption
- [ ] Cleanup on component unmount works
- [ ] 30-second CVV/Expiry timeout works
- [ ] 10-second clipboard clear works
- [ ] Production build has no console logs
- [ ] Firestore rules enforce new structure
- [ ] Memory is cleaned up properly
- [ ] No sensitive data in React DevTools
- [ ] All tests pass

=== REPORT ===

Provide a summary report:
1. Which checks passed ✅
2. Which checks failed ❌
3. Any issues found
4. Recommended fixes for any issues
```

---

## 🚀 Quick Execution Guide

### Order of Execution:
1. **Prompt 1** - Split Storage (30-40 min)
2. **Prompt 2** - Memory Cleanup (20-30 min)  
3. **Prompt 3** - Time-Limited + Clipboard (15-20 min)
4. **Prompt 4** - Production Hardening (15-20 min)
5. **Final Verification** - Complete testing (10-15 min)

### After Each Prompt:
```bash
# Test the changes
npm run dev

# If working, commit
git add .
git commit -m "feat: [describe changes]"
```

### After All Prompts:
```bash
# Build and test production
npm run build
npm run preview

# Deploy
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

---

## ⚠️ Critical Notes

1. **Users will need to re-add all their cards** (old data won't work)
2. **Add a banner in the app:** "Security Update: Please re-add your cards"
3. **Test thoroughly before deploying to production**
4. **Keep a backup of Firestore data** (just in case)
5. **Monitor error logs after deployment**

---

## Model Recommendation

**Claude 3.5 Sonnet** for all 5 prompts - it excels at:
- React component refactoring ✅
- Security-critical code ✅
- Comprehensive code changes ✅
- Following complex instructions ✅
