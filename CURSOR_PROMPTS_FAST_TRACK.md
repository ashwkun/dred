# FAST TRACK: Consolidated Security Fix Prompts

**Use this if you want to move faster with fewer prompts**  
**Model:** Claude 3.5 Sonnet for all prompts

---

## 🚀 MEGA PROMPT 1: Split Storage + Migration (20-30 min)

```
I need to implement split card number storage for security in my Firebase React app. 

CONTEXT:
- Currently storing encrypted full 16-digit card numbers as single field
- Need to split into: cardNumberLast4 (for display) and cardNumberFull (for payments only)
- Using CryptoJS AES encryption with master password
- Firebase Firestore database (no backend)

IMPLEMENT:

1. CREATE src/utils/cardDataMigration.js:
   - Function to migrate existing cards in Firestore
   - For each card: decrypt old cardNumber, split into last4 and full, re-encrypt both separately
   - Update Firestore with new fields: cardNumberLast4, cardNumberFull, migrated: true
   - Keep old cardNumber field for rollback (delete after 30 days)
   - Add dry-run mode, progress logging, error handling
   - Export: migrateCardData(userId, masterPassword, dryRun)

2. UPDATE src/AddCard.jsx (lines 114-125):
   - When saving new card, encrypt card number twice:
     const last4 = cardNumber.slice(-4);
     cardNumberLast4: CryptoJS.AES.encrypt(last4, masterPassword).toString()
     cardNumberFull: CryptoJS.AES.encrypt(cardNumber, masterPassword).toString()
   - Add migrated: true flag
   - Maintain backward compatibility

3. UPDATE src/ViewCards.jsx:
   - For card display (lines 322-373): Only decrypt cardNumberLast4
   - Show as "•••• •••• •••• 1234" (mask + last 4)
   - In handleCopy (line 219): Decrypt cardNumberFull ONLY when copy clicked, then immediately wipe
   - Add backward compatibility: if old cardNumber exists, use it
   - Add helper function: getCardNumberForDisplay(card) that handles both formats

4. UPDATE src/BillPay.jsx (lines 74-90):
   - Only decrypt cardNumberLast4 for display
   - Keep cardNumberFull encrypted in state
   - Decrypt cardNumberFull only in getUpiId function when generating UPI ID
   - Immediately wipe after UPI ID generation

5. UPDATE src/features/settings/Settings.jsx (lines 54-68):
   - Only decrypt cardNumberLast4 and bankName for display
   - No need for full card number in delete/reorder operations

Show me ALL the complete code changes with proper error handling and backward compatibility.
```

---

## 🧹 MEGA PROMPT 2: Memory Cleanup + Secure Wipe (20-30 min)

```
Implement comprehensive memory cleanup for sensitive card data in my React app.

CREATE src/utils/secureCleanup.js with:

1. secureWipeString(str):
   - Overwrite each character with '\0' before setting to null
   - Handle different string types safely
   - Return null after wiping

2. secureWipeObject(obj):
   - Recursively wipe all properties
   - Handle nested objects and arrays
   - Set to null after wiping

3. secureWipeArray(arr):
   - Wipe each element
   - Clear array
   - Set to null

4. useSecureCleanup() React hook:
   - Accepts a data reference
   - Returns cleanup function
   - Automatically wipes on component unmount

UPDATE src/utils/security.js (lines 160-165):
- Replace empty clearSensitiveData() with proper implementation
- Call secureWipe functions
- Add: clearDecryptedCardData(cards) method

ADD CLEANUP TO COMPONENTS:

1. src/ViewCards.jsx:
   ```javascript
   useEffect(() => {
     return () => {
       // On unmount, securely wipe all card data
       cards.forEach(card => {
         if (card.cardNumberFull) secureWipeString(card.cardNumberFull);
         if (card.cvv) secureWipeString(card.cvv);
       });
       setCards([]);
     };
   }, []);
   ```

2. src/BillPay.jsx:
   - Add same cleanup on unmount
   - Wipe mobile number on unmount

3. src/features/settings/Settings.jsx:
   - Cleanup when Delete Cards section collapses
   - Cleanup when Reorder section collapses
   - Full cleanup on unmount

4. UPDATE handleCopy in ViewCards.jsx:
   ```javascript
   const handleCopy = async (e, cardId) => {
     e.preventDefault();
     e.stopPropagation();
     
     const card = cards.find(c => c.id === cardId);
     let fullNumber = securityManager.decryptData(card.cardNumberFull, masterPassword);
     
     await navigator.clipboard.writeText(fullNumber.replace(/\s/g, ''));
     
     // IMMEDIATELY wipe
     fullNumber = secureWipeString(fullNumber);
     
     // Show feedback
     setCopyFeedback(prev => ({ ...prev, [cardId]: true }));
     setTimeout(() => {
       setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
     }, 1500);
   };
   ```

Show me ALL the code with complete implementations and all component updates.
```

---

## ⏱️ MEGA PROMPT 3: Time-Limited Decryption + Clipboard Security (15-20 min)

```
Implement time-limited decryption and secure clipboard handling.

PART 1: AUTO-CLEARING CLIPBOARD

Update src/ViewCards.jsx handleCopy function:

1. After copying card number to clipboard
2. Show message: "Copied! Clipboard will auto-clear in 10s"
3. After 10 seconds, clear clipboard: navigator.clipboard.writeText('')
4. Show confirmation: "Clipboard cleared for security"
5. Prevent multiple timers from conflicting (track with ref)

PART 2: TIME-LIMITED CVV/EXPIRY

Update src/ViewCards.jsx for temporary sensitive data:

1. Create new state:
   ```javascript
   const [temporaryDecrypted, setTemporaryDecrypted] = useState({});
   // Structure: { [cardId]: { cvv: string, expiry: string, expiresAt: number, timerId: number } }
   ```

2. Update handleViewDetails (or create if doesn't exist):
   ```javascript
   const handleViewDetails = (cardId) => {
     const card = cards.find(c => c.id === cardId);
     
     // Decrypt CVV and Expiry
     const decryptedCVV = securityManager.decryptData(card.cvv, masterPassword);
     const decryptedExpiry = securityManager.decryptData(card.expiry, masterPassword);
     
     // Store with 30-second expiration
     const expiresAt = Date.now() + 30000;
     const timerId = setTimeout(() => {
       // Auto-clear after 30 seconds
       setTemporaryDecrypted(prev => {
         const data = prev[cardId];
         if (data) {
           secureWipeString(data.cvv);
           secureWipeString(data.expiry);
         }
         const { [cardId]: removed, ...rest } = prev;
         return rest;
       });
       setShowDetails(prev => ({ ...prev, [cardId]: false }));
     }, 30000);
     
     setTemporaryDecrypted(prev => ({
       ...prev,
       [cardId]: { cvv: decryptedCVV, expiry: decryptedExpiry, expiresAt, timerId }
     }));
     
     setShowDetails(prev => ({ ...prev, [cardId]: true }));
   };
   ```

3. Update the card display section (lines 458-472) to use temporaryDecrypted instead of decrypting inline

4. Add countdown timer UI showing "Auto-hide in: 25s"

5. Add cleanup on unmount to clear all timers and wipe data

PART 3: RESTRICT REPEATED VIEWING

Track last view time per card:
- If user tries to view CVV/Expiry again within 60 seconds, show error
- Message: "Please wait before viewing sensitive details again"
- Or implement mini password re-prompt (optional for now)

Show me complete code for all three parts.
```

---

## 🔒 MEGA PROMPT 4: Production Hardening (15-20 min)

```
Implement production security hardening measures.

PART 1: SECURE LOGGING

CREATE src/utils/secureLogger.js:

```javascript
const isDevelopment = import.meta.env.DEV;

const SENSITIVE_FIELDS = [
  'cardNumber', 'cardNumberFull', 'cvv', 'password', 
  'masterPassword', 'expiry', 'cardHolder'
];

const redactSensitiveData = (data) => {
  if (typeof data === 'string') {
    // Check if string looks like card number, cvv, etc.
    if (/^\d{15,16}$/.test(data)) return '[CARD_NUMBER_REDACTED]';
    if (/^\d{3,4}$/.test(data)) return '[CVV_REDACTED]';
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted = { ...data };
    SENSITIVE_FIELDS.forEach(field => {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    });
    return redacted;
  }
  
  return data;
};

export const secureLog = {
  error: (message, data) => {
    if (isDevelopment) {
      console.error(message, redactSensitiveData(data));
    }
    // In production, send to error tracking service (optional)
  },
  
  warn: (message, data) => {
    if (isDevelopment) {
      console.warn(message, redactSensitiveData(data));
    }
  },
  
  info: (message, data) => {
    if (isDevelopment) {
      console.info(message, redactSensitiveData(data));
    }
  },
  
  debug: (message, data) => {
    if (isDevelopment) {
      console.debug(message, redactSensitiveData(data));
    }
  }
};
```

PART 2: REPLACE ALL CONSOLE LOGS

Search and replace in src/ directory:
- console.log → secureLog.debug
- console.error → secureLog.error
- console.warn → secureLog.warn
- Remove any console.log that contains actual password or card data

PART 3: PRODUCTION BUILD CONFIG

Update vite.config.js:
```javascript
export default defineConfig({
  // ... existing config
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove all console.* in production
        drop_debugger: true,     // Remove debugger statements
        pure_funcs: ['console.log', 'console.debug']  // Remove specific functions
      }
    },
    sourcemap: false  // Don't generate sourcemaps in production
  }
});
```

PART 4: SECURITY CHECKS

CREATE src/utils/securityChecks.js:
```javascript
// Detect if React DevTools is open in production
export const detectDevTools = () => {
  if (import.meta.env.PROD) {
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        // DevTools detected
        console.warn('Developer tools detected in production');
        return 'devtools-detected';
      }
    });
    console.log(element);
  }
};

// Initialize security checks
export const initSecurityChecks = () => {
  if (import.meta.env.PROD) {
    detectDevTools();
    
    // Run check every 60 seconds
    setInterval(detectDevTools, 60000);
  }
};
```

Call initSecurityChecks() in src/main.jsx after root render.

PART 5: UPDATE FIRESTORE RULES

Update firestore.rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Card data
    match /cards/{cardId} {
      allow read: if request.auth != null && 
                     resource.data.uid == request.auth.uid;
      
      allow write: if request.auth != null && 
                      request.resource.data.uid == request.auth.uid &&
                      request.resource.data.cardNumberLast4 is string &&
                      request.resource.data.cardNumberFull is string &&
                      request.resource.data.migrated == true;
      
      allow delete: if request.auth != null && 
                       resource.data.uid == request.auth.uid;
    }
    
    // Validation strings
    match /validationStrings/{userId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == userId;
    }
    
    // Mobile numbers
    match /mobile_numbers/{docId} {
      allow read, write: if request.auth != null && 
                            resource.data.uid == request.auth.uid;
    }
    
    // User security (lockout tracking)
    match /userSecurity/{userId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == userId;
    }
  }
}
```

Show me all complete implementations.
```

---

## ✅ MEGA PROMPT 5: Testing & Verification (15-20 min)

```
Create comprehensive testing and verification tools.

CREATE utilities/verify-migration.js:

```javascript
// Script to verify card data migration
const admin = require('firebase-admin');
const CryptoJS = require('crypto-js');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('../service-account-key.json'))
});

const db = admin.firestore();

async function verifyMigration(userId, masterPassword) {
  console.log(`\n🔍 Verifying card migration for user: ${userId}\n`);
  
  const cardsRef = db.collection('cards').where('uid', '==', userId);
  const snapshot = await cardsRef.get();
  
  if (snapshot.empty) {
    console.log('❌ No cards found for this user');
    return;
  }
  
  let total = 0;
  let migrated = 0;
  let errors = 0;
  
  snapshot.forEach(doc => {
    total++;
    const data = doc.data();
    
    console.log(`\nCard ID: ${doc.id}`);
    
    // Check for new fields
    if (data.cardNumberLast4 && data.cardNumberFull && data.migrated === true) {
      console.log('✅ Has new split format');
      
      // Verify decryption works
      try {
        const last4 = CryptoJS.AES.decrypt(data.cardNumberLast4, masterPassword)
                        .toString(CryptoJS.enc.Utf8);
        const fullNumber = CryptoJS.AES.decrypt(data.cardNumberFull, masterPassword)
                            .toString(CryptoJS.enc.Utf8);
        
        // Verify last 4 matches
        if (fullNumber.slice(-4) === last4) {
          console.log('✅ Last 4 digits match');
          migrated++;
        } else {
          console.log('❌ Last 4 digits DO NOT match');
          console.log(`   Full: ${fullNumber.slice(-4)}, Last4: ${last4}`);
          errors++;
        }
      } catch (e) {
        console.log('❌ Decryption failed:', e.message);
        errors++;
      }
    } else if (data.cardNumber) {
      console.log('⚠️  Old format detected - needs migration');
    } else {
      console.log('❌ Invalid card data structure');
      errors++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total cards: ${total}`);
  console.log(`   Migrated: ${migrated} (${(migrated/total*100).toFixed(1)}%)`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Needs migration: ${total - migrated - errors}`);
  
  if (migrated === total && errors === 0) {
    console.log(`\n✅ All cards successfully migrated!\n`);
  } else {
    console.log(`\n⚠️  Migration incomplete or has errors\n`);
  }
}

// Run verification
const userId = process.argv[2];
const masterPassword = process.argv[3];

if (!userId || !masterPassword) {
  console.log('Usage: node verify-migration.js <userId> <masterPassword>');
  process.exit(1);
}

verifyMigration(userId, masterPassword)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

CREATE tests/security.test.js (React Testing Library):

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { secureWipeString, secureWipeObject } from '../src/utils/secureCleanup';
import ViewCards from '../src/ViewCards';

describe('Security Tests', () => {
  describe('Secure Wipe Functions', () => {
    test('secureWipeString should overwrite string', () => {
      let sensitive = "1234567890123456";
      sensitive = secureWipeString(sensitive);
      expect(sensitive).toBeNull();
    });
    
    test('secureWipeObject should clear all properties', () => {
      const obj = { cardNumber: '1234', cvv: '123' };
      secureWipeObject(obj);
      expect(obj.cardNumber).toBeNull();
      expect(obj.cvv).toBeNull();
    });
  });
  
  describe('Split Card Number', () => {
    test('should only decrypt last 4 for display', () => {
      // Mock card with split format
      const mockCard = {
        cardNumberLast4: 'encrypted_last_4',
        cardNumberFull: 'encrypted_full_number'
      };
      
      // Test that only last4 is decrypted for display
      // Implementation depends on your component structure
    });
  });
  
  describe('Memory Cleanup', () => {
    test('should clear card data on unmount', async () => {
      const { unmount } = render(<ViewCards user={mockUser} masterPassword="test" />);
      
      // Verify component mounted with data
      // ...
      
      // Unmount and verify cleanup
      unmount();
      
      // Check that sensitive data was cleared
      // This is hard to test directly, but you can test that cleanup functions are called
    });
  });
  
  describe('Time-Limited Decryption', () => {
    test('should auto-hide CVV after 30 seconds', async () => {
      jest.useFakeTimers();
      
      render(<ViewCards user={mockUser} masterPassword="test" />);
      
      // Click to show details
      const showButton = screen.getByText('Show Details');
      userEvent.click(showButton);
      
      // Verify CVV is shown
      expect(screen.getByText(/CVV/)).toBeInTheDocument();
      
      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      
      // Verify CVV is hidden
      await waitFor(() => {
        expect(screen.queryByText(/CVV/)).not.toBeVisible();
      });
      
      jest.useRealTimers();
    });
  });
  
  describe('Clipboard Security', () => {
    test('should clear clipboard after 10 seconds', async () => {
      jest.useFakeTimers();
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
      
      render(<ViewCards user={mockUser} masterPassword="test" />);
      
      // Click copy button
      const copyButton = screen.getByLabelText('Copy card number');
      userEvent.click(copyButton);
      
      // Verify clipboard was written
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringMatching(/^\d+$/));
      
      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);
      
      // Verify clipboard was cleared
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('');
      });
      
      jest.useRealTimers();
    });
  });
});
```

Show me both complete files with all tests.
```

---

## 📝 FINAL PROMPT: Documentation

```
Create comprehensive documentation for the security improvements.

CREATE SECURITY.md:

Document:
1. Overview of security architecture
2. Split card number storage explanation
3. Memory cleanup mechanisms
4. Time-limited decryption details
5. Clipboard security
6. Production hardening measures
7. How to verify security (for auditors)
8. Developer guidelines for maintaining security

CREATE MIGRATION_GUIDE.md:

Step-by-step guide:
1. Pre-migration checklist
2. Backup instructions
3. How to run migration script
4. How to verify migration success
5. Rollback procedure
6. What users will experience
7. FAQ

UPDATE README.md:

Add new sections:
- Security Features (highlight split storage, auto-cleanup, etc.)
- Migration from old version
- Security best practices for developers
- Compliance notes (PCI DSS considerations)

Show me all three documents in full.
```

---

## ⚡ Ultra-Fast Track (3 Mega Prompts)

If you want even faster execution, combine prompts:

### ULTRA PROMPT 1 (40-50 min)
Combine: Mega Prompt 1 + Mega Prompt 2

### ULTRA PROMPT 2 (30-40 min)
Combine: Mega Prompt 3 + Mega Prompt 4

### ULTRA PROMPT 3 (20-30 min)
Mega Prompt 5 + Final Documentation

---

## 🎯 Execution Checklist

After each mega prompt:

- [ ] Review code changes carefully
- [ ] Test in development environment
- [ ] Run any new utilities/scripts
- [ ] Verify no breaking changes
- [ ] Commit changes: `git commit -m "feat: [description]"`
- [ ] Move to next prompt only when current works

---

## 🚨 Critical Reminders

1. **Always test on development Firebase project first**
2. **Backup Firestore data before migration**
3. **Keep old cardNumber field for 30 days**
4. **Users may need to re-login after deployment**
5. **Test each feature individually before moving on**

---

## Model Recommendation

**Use Claude 3.5 Sonnet for ALL prompts** - it handles:
- Complex architectural changes ✅
- React component updates ✅
- Security logic ✅
- Testing code ✅
- Documentation ✅

It's the most consistent for security-critical code.
