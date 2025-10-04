# Sequential Cursor Prompts for Security Vulnerability Fixes

**Constraint:** Firebase-only (no backend server)  
**Goal:** Fix all critical security vulnerabilities related to card data decryption and disposal  
**Approach:** 6-phase sequential implementation

---

## 📋 Pre-Flight Checklist

Before starting, ensure:
- [ ] All current code is committed to git
- [ ] Create a new branch: `git checkout -b security-fixes-card-data`
- [ ] Backup your current Firestore data
- [ ] Test on a development environment first

---

## Phase 1: Data Model Migration - Split Card Number Storage

**Model:** Claude 3.5 Sonnet (for complex architectural changes)

### Prompt 1A: Analysis and Migration Plan

```
I need to implement split card number storage in my Firebase card management app for security. Currently, full 16-digit card numbers are stored encrypted as a single field. I need to:

1. Split storage into:
   - encryptedLast4: Only last 4 digits (for display)
   - encryptedFullNumber: Full 16 digits (for payments only)
   
2. Create a migration script that:
   - Reads existing cards from Firestore
   - For each card, split the card number
   - Encrypt both parts separately with the master password
   - Update Firestore documents with new structure
   - Maintain backward compatibility during migration

Current structure in Firestore:
{
  cardNumber: "encrypted_full_number",
  cvv: "encrypted_cvv",
  expiry: "encrypted_expiry",
  ...
}

New structure should be:
{
  cardNumberLast4: "encrypted_last_4_digits",
  cardNumberFull: "encrypted_full_16_digits",
  cvv: "encrypted_cvv",
  expiry: "encrypted_expiry",
  migrated: true,  // flag to track migration
  ...
}

Create a migration utility file at src/utils/cardDataMigration.js that:
1. Checks if each card needs migration (no 'migrated' flag)
2. Decrypts the old cardNumber field
3. Splits into last 4 and full number
4. Re-encrypts both separately
5. Updates Firestore with new fields
6. Sets migrated: true flag
7. Keeps old cardNumber field for rollback safety (can delete later)

Show me the complete migration utility with error handling and progress tracking.
```

### Prompt 1B: Update AddCard Component

```
Now update src/AddCard.jsx to save card numbers in the new split format when adding new cards.

Changes needed:
1. When encrypting card data (around line 114-125), encrypt card number twice:
   - const cardNumberLast4 = cardNumber.slice(-4);
   - const cardNumberFull = cardNumber;
   - Encrypt both separately
   
2. Store in Firestore as:
   {
     cardNumberLast4: CryptoJS.AES.encrypt(cardNumberLast4, masterPassword).toString(),
     cardNumberFull: CryptoJS.AES.encrypt(cardNumberFull, masterPassword).toString(),
     migrated: true,
     // Keep existing fields
   }

3. Maintain backward compatibility - if old format exists, still work with it

Update the handleAddCard function and show me the complete changes.
```

### Prompt 1C: Update ViewCards to Use Split Data

```
Update src/ViewCards.jsx to use the new split card number format.

Requirements:
1. For display (card list view), ONLY decrypt cardNumberLast4
2. For copy function, decrypt cardNumberFull ONLY when user clicks copy
3. Add backward compatibility - if old 'cardNumber' field exists, use it
4. Clear decrypted full number immediately after copy operation

Specific changes:
1. In the decryptField section (lines 324-373), check for new format:
   - If cardNumberLast4 exists, decrypt only that for display
   - Show as "•••• •••• •••• 1234" (mask first 12, show last 4)
   
2. In handleCopy function (line 219-229):
   - Decrypt cardNumberFull only when called
   - Store in temporary variable
   - Copy to clipboard
   - Immediately overwrite variable with zeros
   - Set variable to null
   
3. Remove any decryption of full card number from the main render loop

Show me the complete updated code for ViewCards.jsx with these changes.
```

---

## Phase 2: Memory Cleanup Implementation

**Model:** Claude 3.5 Sonnet

### Prompt 2A: Create Secure Memory Cleanup Utility

```
Create a new utility file src/utils/secureCleanup.js that implements secure memory cleanup for sensitive data.

Requirements:
1. Function to securely wipe strings by overwriting with zeros
2. Function to securely wipe objects (recursively)
3. Function to clear decrypted card data from component state
4. Hook for automatic cleanup on component unmount

Implementation:
```javascript
// Create these functions:
1. secureWipeString(str) - overwrites string characters with '\0'
2. secureWipeObject(obj) - recursively nullifies all properties
3. secureWipeArray(arr) - clears and nullifies array elements
4. useSecureCleanup(dataRef) - React hook that cleans up on unmount

// Add TypeScript types if possible for better safety
```

Also update src/utils/security.js:
- Replace the empty clearSensitiveData() function (lines 160-165) with proper implementation
- Call the secure wipe functions
- Add method to security manager: clearDecryptedData(data)

Show me the complete implementation with JSDoc comments.
```

### Prompt 2B: Add Cleanup to ViewCards

```
Update src/ViewCards.jsx to use the new secure cleanup utilities.

Add cleanup in these scenarios:
1. Component unmount - clear all decrypted data
2. When user navigates away - clear card state
3. After 30 seconds of no interaction with a card - clear its decrypted data
4. After copy operation - immediately clear full number

Specific implementation:
1. Import useSecureCleanup from utils/secureCleanup
2. Add useEffect cleanup that runs on unmount:
   ```javascript
   useEffect(() => {
     return () => {
       // Securely wipe all cards data
       secureWipeArray(cards);
       setCards([]);
     };
   }, []);
   ```

3. In handleCopy, add cleanup:
   ```javascript
   const handleCopy = async (e, cardId) => {
     const fullNumber = decryptField(card.cardNumberFull); // Decrypt temporarily
     await navigator.clipboard.writeText(fullNumber);
     secureWipeString(fullNumber); // Immediately wipe
     // Show feedback
   };
   ```

4. Add 30-second auto-cleanup for decrypted CVV/Expiry data

Show me all the changes needed in ViewCards.jsx.
```

### Prompt 2C: Add Cleanup to BillPay and Settings

```
Apply the same secure cleanup patterns to:
1. src/BillPay.jsx (lines 24-114)
2. src/features/settings/Settings.jsx (lines 40-94)

For both components:
1. Add useEffect cleanup on unmount
2. Clear decrypted card data when sections collapse (Delete Cards, Reorder)
3. Wipe data before setting state to []
4. Use secureWipeArray before clearing cards

Show me the specific changes for both files.
```

---

## Phase 3: Secure Clipboard Management

**Model:** Claude 3.5 Sonnet

### Prompt 3: Implement Auto-Clearing Clipboard

```
Update the clipboard handling in src/ViewCards.jsx to automatically clear sensitive data.

Requirements:
1. After copying card number, auto-clear clipboard after 10 seconds
2. Show warning to user that clipboard will be cleared
3. Prevent multiple clipboard clear timers from conflicting
4. Handle browser permissions properly

Implementation:
```javascript
const handleCopy = async (e, cardId) => {
  e.preventDefault();
  e.stopPropagation();
  
  // 1. Decrypt full card number temporarily
  const card = cards.find(c => c.id === cardId);
  const fullNumber = securityManager.decryptData(card.cardNumberFull, masterPassword);
  
  // 2. Copy to clipboard
  await navigator.clipboard.writeText(fullNumber.replace(/\s/g, ''));
  
  // 3. Immediately wipe from memory
  secureWipeString(fullNumber);
  
  // 4. Show feedback with warning
  setCopyFeedback(prev => ({ 
    ...prev, 
    [cardId]: 'Copied! Clipboard will clear in 10s' 
  }));
  
  // 5. Clear clipboard after 10 seconds
  setTimeout(async () => {
    await navigator.clipboard.writeText('');
    setCopyFeedback(prev => ({ ...prev, [cardId]: 'Clipboard cleared' }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
    }, 2000);
  }, 10000);
  
  // 6. Clear feedback after 1.5 seconds
  setTimeout(() => {
    setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
  }, 1500);
};
```

Update the handleCopy function and the copy feedback UI to show the countdown timer.
Show me the complete implementation.
```

---

## Phase 4: Time-Limited Decryption for Sensitive Fields

**Model:** Claude 3.5 Sonnet

### Prompt 4A: Implement Time-Limited State for CVV/Expiry

```
Update src/ViewCards.jsx to implement time-limited decryption for CVV and Expiry.

Currently, when user clicks "Show Details", CVV and Expiry are decrypted and stay in memory.

Change to:
1. Decrypt CVV/Expiry only when shown
2. Store in temporary state with 30-second expiration
3. Auto-clear from memory after 30 seconds (not just hide UI)
4. Show countdown timer to user
5. Require re-authentication if user wants to view again within 1 minute

Implementation approach:
```javascript
const [temporaryDecrypted, setTemporaryDecrypted] = useState({});
// Structure: { [cardId]: { cvv: 'decrypted', expiry: 'decrypted', expiresAt: timestamp } }

const handleViewDetails = (cardId) => {
  const card = cards.find(c => c.id === cardId);
  
  // Decrypt temporarily
  const decryptedCVV = securityManager.decryptData(card.cvv, masterPassword);
  const decryptedExpiry = securityManager.decryptData(card.expiry, masterPassword);
  
  // Store with expiration
  const expiresAt = Date.now() + 30000; // 30 seconds
  setTemporaryDecrypted(prev => ({
    ...prev,
    [cardId]: { cvv: decryptedCVV, expiry: decryptedExpiry, expiresAt }
  }));
  
  // Auto-clear after 30 seconds
  setTimeout(() => {
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
};
```

Update the ViewCards.jsx component with this implementation and add a countdown timer UI.
Show me all changes needed.
```

### Prompt 4B: Add Re-Authentication for Repeated Viewing

```
Add a security feature: if user tries to view CVV/Expiry multiple times within 1 minute, require password re-entry.

Requirements:
1. Track last view time per card
2. If < 60 seconds since last view, show mini password prompt
3. Validate password before showing details again
4. Use existing MasterPasswordPrompt styling but smaller modal

Create a new component src/components/QuickPasswordPrompt.jsx and integrate it into ViewCards.jsx.

Show me the complete implementation with the new component and integration code.
```

---

## Phase 5: Remove Full Number Decryption from Bulk Operations

**Model:** Claude 3.5 Sonnet

### Prompt 5A: Optimize BillPay Decryption

```
Update src/BillPay.jsx to only decrypt what's needed for UPI ID generation.

Current issue: All cards are fully decrypted and stored in state (lines 74-90).

Changes needed:
1. For displaying cards in list: Only decrypt cardNumberLast4 and bankName
2. For generating UPI ID: Decrypt cardNumberFull ONLY when user clicks "Pay Bill"
3. Store minimal decrypted data in state
4. Clear full number immediately after UPI URL generation

New approach:
```javascript
// In loadData (lines 24-114):
const cardsData = cardsSnapshot.docs.map(doc => {
  return {
    ...doc.data(),
    id: doc.id,
    // Only decrypt what's needed for display
    bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
    networkName: CryptoJS.AES.decrypt(doc.data().networkName, masterPassword).toString(CryptoJS.enc.Utf8),
    cardNumberLast4: CryptoJS.AES.decrypt(doc.data().cardNumberLast4, masterPassword).toString(CryptoJS.enc.Utf8),
    // Keep encrypted full number for later use
    cardNumberFullEncrypted: doc.data().cardNumberFull,
  };
});

// In getUpiId - decrypt on demand:
const getUpiId = (card) => {
  if (!mobileNumber) return null;
  
  // Decrypt full number only when needed
  const fullNumber = CryptoJS.AES.decrypt(card.cardNumberFullEncrypted, masterPassword).toString(CryptoJS.enc.Utf8);
  const last4 = fullNumber.slice(-4);
  
  let upiId = null;
  // Generate UPI ID based on bank...
  
  // Immediately wipe full number
  secureWipeString(fullNumber);
  
  return upiId;
};
```

Update BillPay.jsx with these changes and show me the complete modified code.
```

### Prompt 5B: Optimize Settings Decryption

```
Update src/features/settings/Settings.jsx to minimize decryption:

Changes for Delete Cards section (lines 40-94):
1. Only decrypt cardType, bankName, and cardNumberLast4
2. Don't decrypt full card number unless absolutely necessary
3. Add cleanup when section collapses

Changes for Reorder Cards section (lines 632-714):
1. Only decrypt display fields (cardType, bankName, last 4 digits)
2. Don't need full card number for reordering

Show me the updated Settings.jsx with minimal decryption approach.
```

---

## Phase 6: Production Hardening & Security Measures

**Model:** Claude 3.5 Sonnet

### Prompt 6A: Remove Console Logs and Add Secure Logging

```
Create a secure logging utility and remove all console.log statements that might leak sensitive data.

1. Create src/utils/secureLogger.js:
```javascript
// Only log in development
// Automatically redact sensitive fields (cardNumber, cvv, password, etc.)
// Add log levels: error, warn, info, debug

export const secureLog = {
  error: (message, data) => { /* implementation */ },
  warn: (message, data) => { /* implementation */ },
  info: (message, data) => { /* implementation */ },
  debug: (message, data) => { /* implementation */ },
};

// Redact function that masks sensitive data
const redactSensitiveData = (obj) => {
  // Replace cardNumber, cvv, password fields with [REDACTED]
};
```

2. Search entire src/ directory and replace:
   - All console.log with secureLog.debug
   - All console.error with secureLog.error
   - Ensure no sensitive data is logged

3. In production build, ensure all debug logs are stripped

Show me the secureLogger.js implementation and a search/replace strategy for the codebase.
```

### Prompt 6B: Add Security Headers and Protections

```
Even though we don't have a backend, we can add client-side security measures.

1. Update public/index.html to add Content Security Policy meta tags:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
```

2. Create src/utils/securityChecks.js to detect:
   - React DevTools in production
   - Browser debugging tools open
   - Unusual clipboard access patterns
   - Multiple failed password attempts

3. Add integrity checks for critical security functions

4. Update vite.config.js to strip debug code in production:
```javascript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
}
```

Show me the implementation for all these security hardening measures.
```

### Prompt 6C: Update Firestore Security Rules

```
Update firestore.rules to add additional security for the new card number split structure.

Current rules need to ensure:
1. Users can only read/write their own cards
2. Validate that cardNumberLast4 is exactly 4 characters (encrypted length will be consistent)
3. Validate that cardNumberFull exists and is encrypted
4. Ensure migrated flag is set for new cards
5. Prevent deletion of cards without proper authentication

Show me the updated firestore.rules with comprehensive validation.
```

---

## Phase 7: Testing & Validation

**Model:** GPT-4 (for comprehensive test generation)

### Prompt 7A: Create Security Test Suite

```
Create a comprehensive test suite to validate all security fixes.

Create tests/security.test.js that tests:

1. Split Card Number Storage:
   - Verify last 4 digits can be decrypted without full number
   - Verify full number is only decrypted when explicitly needed
   - Test migration from old format to new format

2. Memory Cleanup:
   - Verify data is cleared on component unmount
   - Test secure wipe functions work correctly
   - Verify no sensitive data in state after cleanup

3. Clipboard Security:
   - Test clipboard auto-clear after 10 seconds
   - Verify no sensitive data remains in clipboard

4. Time-Limited Decryption:
   - Verify CVV/Expiry auto-clear after 30 seconds
   - Test re-authentication requirement

5. Minimal Decryption:
   - Verify BillPay only decrypts what's needed
   - Verify Settings components minimize decryption

Use React Testing Library and Jest. Show me the complete test suite.
```

### Prompt 7B: Create Migration Verification Script

```
Create a script utilities/verify-migration.js that:

1. Connects to Firebase
2. Queries all cards
3. Checks each card for:
   - Has cardNumberLast4 field
   - Has cardNumberFull field
   - Has migrated: true flag
   - Can decrypt both fields successfully
   - Last 4 of full number matches cardNumberLast4
4. Reports any cards that need migration
5. Reports any decryption failures

Show me the complete verification script with detailed logging.
```

---

## Phase 8: Documentation & Rollout

**Model:** GPT-4 (for documentation)

### Prompt 8: Create Migration Guide

```
Create MIGRATION_GUIDE.md that documents:

1. Pre-migration checklist
2. Step-by-step migration process
3. How to run the migration script
4. How to verify migration success
5. Rollback procedure if needed
6. What users will notice (if anything)
7. Testing checklist before production deployment

Also update README.md with new security features:
- Split card number storage
- Automatic memory cleanup
- Secure clipboard handling
- Time-limited sensitive data viewing

Show me both documents.
```

---

## 🎯 Execution Order Summary

Run these prompts in order:

| Phase | Prompt | Estimated Time | Model |
|-------|--------|----------------|-------|
| 1 | 1A - Migration Plan | 10-15 min | Claude 3.5 Sonnet |
| 1 | 1B - Update AddCard | 5-10 min | Claude 3.5 Sonnet |
| 1 | 1C - Update ViewCards | 10-15 min | Claude 3.5 Sonnet |
| 2 | 2A - Cleanup Utility | 10 min | Claude 3.5 Sonnet |
| 2 | 2B - ViewCards Cleanup | 10 min | Claude 3.5 Sonnet |
| 2 | 2C - BillPay/Settings Cleanup | 10 min | Claude 3.5 Sonnet |
| 3 | 3 - Clipboard Security | 10 min | Claude 3.5 Sonnet |
| 4 | 4A - Time-Limited Decrypt | 15 min | Claude 3.5 Sonnet |
| 4 | 4B - Re-authentication | 10 min | Claude 3.5 Sonnet |
| 5 | 5A - BillPay Optimization | 10 min | Claude 3.5 Sonnet |
| 5 | 5B - Settings Optimization | 5 min | Claude 3.5 Sonnet |
| 6 | 6A - Secure Logging | 10 min | Claude 3.5 Sonnet |
| 6 | 6B - Security Headers | 10 min | Claude 3.5 Sonnet |
| 6 | 6C - Firestore Rules | 5 min | Claude 3.5 Sonnet |
| 7 | 7A - Test Suite | 15 min | GPT-4 |
| 7 | 7B - Verification Script | 10 min | GPT-4 |
| 8 | 8 - Documentation | 10 min | GPT-4 |

**Total Estimated Time:** 3-4 hours for all phases

---

## 🚀 Quick Start Commands

After getting all the code from Cursor:

```bash
# 1. Run migration (on development first!)
node utilities/migrate-card-data.js --dry-run

# 2. If dry-run looks good, run actual migration
node utilities/migrate-card-data.js --execute

# 3. Verify migration
node utilities/verify-migration.js

# 4. Run security tests
npm test -- security.test.js

# 5. Build and test production
npm run build
npm run preview

# 6. If all good, deploy
firebase deploy
```

---

## ⚠️ Critical Notes

1. **Test on development Firebase project first!**
2. **Backup Firestore data before migration**
3. **Keep old cardNumber field for 30 days** (rollback safety)
4. **Test each phase before moving to next**
5. **Users will need to re-login after deployment** (to re-encrypt with new format)

---

## 🔒 Security Improvements Summary

After all phases complete:

✅ **Split card number storage** - Only last 4 in memory for display  
✅ **Automatic memory cleanup** - Sensitive data wiped on unmount  
✅ **Secure clipboard** - Auto-clear after 10 seconds  
✅ **Time-limited decryption** - CVV/Expiry auto-clear after 30 seconds  
✅ **Minimal decryption** - Only decrypt what's needed, when needed  
✅ **No console logs** - Secure logging with redaction  
✅ **Production hardening** - CSP, integrity checks, DevTools detection  
✅ **Updated Firestore rules** - Validation for new structure  

---

## 📊 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Full card numbers in memory | All cards (100%) | 0 (only decrypted on copy) |
| Average plaintext exposure | 30+ minutes | < 30 seconds |
| Memory cleanup | None (0%) | Automatic (100%) |
| Clipboard persistence | Forever | 10 seconds max |
| DevTools visibility | Full access | Detected & logged |
| Console leaks | Many | Zero (production) |

---

## Model Recommendations

- **Claude 3.5 Sonnet**: Best for architectural changes, complex logic, React components
- **GPT-4**: Better for test generation, documentation, comprehensive guides
- **GPT-4 Turbo**: Faster for simple refactoring tasks

Use **Claude 3.5 Sonnet** for Phases 1-6 (critical security logic)  
Use **GPT-4** for Phases 7-8 (testing & documentation)
