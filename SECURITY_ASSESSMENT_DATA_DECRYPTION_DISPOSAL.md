# Security Assessment: Data Decryption and Disposal

**Date:** 2025-10-04  
**Application:** Dred - Card Management System  
**Assessment Type:** Data Decryption and Disposal Analysis

---

## Executive Summary

This security assessment examines where, how, and how much sensitive data is decrypted and subsequently handled/discarded in the Dred card management application. The application implements client-side encryption using AES-256 with a user-provided master password, meaning **all decryption occurs in the browser with no plaintext data ever stored on servers**.

### Key Findings:
- ✅ **Strong encryption**: AES-256 via CryptoJS
- ⚠️ **Memory management**: Limited explicit cleanup of decrypted data
- ⚠️ **Plaintext exposure**: Decrypted data persists in component state
- ⚠️ **Session management**: 30-minute inactivity timeout exists but can be bypassed
- ❌ **No secure memory wiping**: Sensitive data not explicitly zeroed in memory

---

## 1. Data Decryption Points

### 1.1 Primary Decryption Location: `src/utils/security.js`

**Function:** `decryptData(encryptedData, key)`

```javascript
// Location: Lines 148-157
decryptData(encryptedData, key) {
  try {
    return CryptoJS.AES.decrypt(encryptedData, key)
      .toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return '';
  }
}
```

**Security Analysis:**
- ✅ Uses industry-standard AES-256 encryption
- ✅ Returns empty string on failure (doesn't leak error details)
- ⚠️ No explicit memory cleanup after decryption
- ⚠️ Decrypted data returned as plain string to caller

---

## 2. Data Decryption Instances

### 2.1 Master Password Validation (`src/MasterPasswordPrompt.jsx`)

**Occurrence:** Lines 38-86  
**Frequency:** Once per session (during login)

**What is decrypted:**
- Validation string (used to verify password correctness)

**Data lifecycle:**
1. User enters master password
2. Encrypted validation string retrieved from Firestore
3. Decryption attempted with provided password
4. **Plaintext stored in state:** `validationSentence` (Line 153)
5. Displayed briefly during validation animation
6. **Not explicitly cleared from memory**

**Security Concerns:**
```javascript
// Line 151-153
const result = await securityManager.validatePassword(validationString, inputValue, user.uid);
setValidationSentence(result.decryptedSentence); // PLAINTEXT IN STATE
setShowSuccess(true);
```

---

### 2.2 Card Data Viewing (`src/ViewCards.jsx`)

**Occurrence:** Lines 164-178 + multiple inline calls  
**Frequency:** Continuous (for every card in view)

**What is decrypted:**
- Card numbers (15-16 digits)
- CVV codes (3-4 digits)
- Expiry dates
- Cardholder names
- Bank names
- Network names

**Data lifecycle per card:**
1. Encrypted data retrieved from Firestore
2. Decrypted on-demand when viewing cards
3. **Plaintext stored in component render cycle**
4. Displayed with 5-second auto-hide timer for sensitive details
5. **Remains in React component state until page unmount**

**Critical Code Sections:**

```javascript
// Lines 322-373 - Card data decryption
const decryptedCardNumber = decryptField(card.cardNumber); // PLAINTEXT
const decryptedCVV = decryptField(card.cvv);               // PLAINTEXT
const decryptedExpiry = decryptField(card.expiry);         // PLAINTEXT
const decryptedCardHolder = decryptField(card.cardHolder); // PLAINTEXT
```

**Volume Assessment:**
- If user has 10 cards: **10 card numbers + 10 CVVs + 10 expiry dates = 30+ sensitive fields decrypted simultaneously**
- All kept in memory for duration of page view

---

### 2.3 Card Addition (`src/AddCard.jsx`)

**Occurrence:** Lines 114-125  
**Frequency:** Each time a new card is added

**What is encrypted (not decrypted):**
- New card details are encrypted before storage
- **No decryption occurs in this component**

**Security Note:** This is a write-only operation - good security practice.

---

### 2.4 Bill Pay Feature (`src/BillPay.jsx`)

**Occurrence:** Lines 48-90  
**Frequency:** On component mount and when viewing bill pay page

**What is decrypted:**
- Mobile numbers (for UPI ID generation)
- Card numbers (last 4 digits + full number for UPI)
- Bank names
- Network names
- Cardholder names

**Data lifecycle:**
1. All user cards fetched from Firestore
2. **Bulk decryption of all cards at once** (Lines 74-90)
3. Decrypted data stored in component state
4. Used to generate UPI payment IDs
5. **Remains in state until component unmounts**

**Critical Security Issue:**
```javascript
// Lines 76-85 - BULK DECRYPTION
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

**Volume:** ALL user cards decrypted simultaneously and kept in plaintext in state.

---

### 2.5 Settings Page (`src/features/settings/Settings.jsx`)

**Occurrence:** Lines 54-68  
**Frequency:** When user opens "Delete Cards" section

**What is decrypted:**
- Card type
- Bank name
- Card number (for display of last 4 digits)

**Data lifecycle:**
1. Cards fetched when section expanded
2. Decrypted for display in deletion list
3. Stored in component state
4. **Cleared only when component unmounts**

---

## 3. Data Volume Analysis

### 3.1 Decryption by Page/Feature

| Feature | Fields Decrypted | Frequency | Data Retention |
|---------|-----------------|-----------|----------------|
| Master Password Validation | 1 validation string | Once per session | Until page reload |
| View Cards | 6 fields × N cards | Continuous | Until page change |
| Bill Pay | 4 fields × N cards | On page load | Until page change |
| Settings (Delete) | 3 fields × N cards | On expand | Until collapse/unmount |
| Settings (Reorder) | 3 fields × N cards | On expand | Until collapse/unmount |

### 3.2 Worst-Case Scenario

**Assumptions:**
- User has 20 credit cards
- User navigates to View Cards page

**Total Decrypted Data in Memory:**
- 20 card numbers (16 digits each) = 320 digits
- 20 CVV codes (3-4 digits each) ≈ 70 digits  
- 20 expiry dates = 40 characters
- 20 cardholder names ≈ 400 characters
- 20 bank names ≈ 300 characters
- 20 network names ≈ 200 characters

**Total:** ~1,330 characters of **highly sensitive plaintext** in browser memory

---

## 4. Data Disposal Mechanisms

### 4.1 Explicit Cleanup Function

**Location:** `src/utils/security.js`, Lines 160-165

```javascript
clearSensitiveData() {
  // Clear any sensitive data from memory
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(new Uint8Array(16));
  }
}
```

**Analysis:**
- ❌ **Function exists but is NEVER called anywhere in the codebase**
- ❌ Does not actually clear any sensitive data
- ❌ Only generates random values (unclear purpose)
- ❌ No memory zeroing or explicit cleanup

---

### 4.2 Session Timeout

**Location:** `src/utils/security.js`, Lines 93-128

**Configuration:**
- Timeout: 30 minutes of inactivity
- Triggers: `session-timeout` event

**What happens on timeout:**
```javascript
// Lines 97-99
inactivityTimer = setTimeout(() => {
  window.dispatchEvent(new CustomEvent('session-timeout'));
}, SESSION_TIMEOUT_MS);
```

**Handler in App.jsx (Lines 208-233):**
- Checks if user is on `addCard` or `viewCards` page
- **If user is active, timeout is prevented** (Lines 213-218)
- Otherwise, user is signed out

**Security Issues:**
- ⚠️ Active users bypass auto-logout
- ❌ No explicit memory cleanup on timeout
- ❌ Master password not cleared from state on timeout (unless user signs out)

---

### 4.3 Component Unmounting

**React Lifecycle:**
- Decrypted data in component state is garbage collected when component unmounts
- **However:** JavaScript garbage collection is non-deterministic
- **Issue:** Sensitive data may remain in memory for extended periods

---

### 4.4 Master Password Handling

**Location:** `src/App.jsx`, Lines 35, 162, 373

**Storage:**
```javascript
const [masterPassword, setMasterPassword] = useState(null);
```

**Clearing:**
```javascript
// Only cleared on sign out (Line 373)
setMasterPassword(null);
```

**Security Issues:**
- ❌ Master password stored in plain string in React state
- ❌ Not explicitly zeroed/overwritten before clearing
- ❌ Persists for entire session duration
- ❌ Can be accessed via React DevTools if open

---

## 5. Security Vulnerabilities

### 5.1 CRITICAL: No Memory Wiping

**Vulnerability:** Sensitive plaintext data (card numbers, CVVs) remains in browser memory indefinitely

**Attack Vectors:**
1. **Browser DevTools:** Anyone with physical access can inspect component state
2. **Memory dumps:** Browser crashes or debuggers can expose plaintext
3. **Browser extensions:** Malicious extensions can read component state
4. **XSS attacks:** Could extract data from component state

**Recommendation:** Implement secure memory wiping:
```javascript
function secureWipe(obj) {
  if (typeof obj === 'string') {
    // Overwrite string with zeros
    return obj.split('').map(() => '\0').join('');
  }
  Object.keys(obj).forEach(key => {
    obj[key] = null;
  });
}
```

---

### 5.2 HIGH: Bulk Decryption

**Vulnerability:** All cards decrypted at once in BillPay and Settings

**Issue:** Maximizes plaintext exposure window

**Recommendation:** 
- Decrypt on-demand only when user explicitly views a specific card
- Re-encrypt immediately after use
- Use time-limited decryption (auto-hide after 5 seconds)

---

### 5.3 MEDIUM: clearSensitiveData() Not Used

**Vulnerability:** Security function exists but is never called

**Recommendation:**
1. Implement proper cleanup:
```javascript
clearSensitiveData(data) {
  // Overwrite sensitive strings with zeros
  if (typeof data === 'string') {
    for (let i = 0; i < data.length; i++) {
      data = data.substr(0, i) + '\0' + data.substr(i + 1);
    }
  }
  // Force garbage collection hint
  if (window.gc) window.gc();
}
```

2. Call on:
   - Component unmount
   - Page navigation
   - Session timeout
   - Manual card detail hiding

---

### 5.4 MEDIUM: Session Bypass

**Vulnerability:** Active users can bypass 30-minute timeout

**Code:** `src/App.jsx`, Lines 213-218

**Recommendation:**
- Enforce maximum session duration regardless of activity
- Require re-authentication for sensitive operations

---

### 5.5 LOW: Console Logging

**Vulnerability:** Multiple `console.log()` statements throughout codebase

**Examples:**
- Line 110 in `MasterPasswordPrompt.jsx`: Logs master password (first character + "******")
- Various error logs may leak partial sensitive data

**Recommendation:**
- Remove all `console.log()` statements in production builds
- Use proper logging framework with sensitive data redaction

---

## 6. Data Flow Diagram

```
┌─────────────────┐
│  User Input     │
│  (Password)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Firestore DB   │
│  (Encrypted)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SecurityMgr    │◄──────── Master Password (Plain, in State)
│  decryptData()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Component      │
│  State          │◄──────── Plaintext stored here
│  (React)        │          ❌ No cleanup
└────────┬────────┘          ❌ Accessible via DevTools
         │
         ▼
┌─────────────────┐
│  DOM/Browser    │◄──────── Plaintext rendered
│  Rendering      │          ⏱️  Auto-hide after 5s (ViewCards)
└────────┬────────┘          ❌ Still in state after hiding
         │
         │ (User navigates away or signs out)
         │
         ▼
┌─────────────────┐
│  setState(null) │◄──────── ❌ No secure wipe
└────────┬────────┘          ❌ Garbage collected eventually
         │                   ⚠️  May persist in memory
         ▼
   [Garbage Collection]
   (Non-deterministic)
```

---

## 7. Recommendations

### Priority 1 (Critical)

1. **Implement Secure Memory Wiping**
   - Create utility to overwrite sensitive strings before nullification
   - Call on component unmount, page navigation, manual hide
   
2. **Minimize Decryption Scope**
   - Decrypt only what's needed, when it's needed
   - Avoid bulk decryption in BillPay and Settings

3. **Time-Limited Decryption**
   - Automatically re-encrypt or clear after configurable timeout (default: 30 seconds)

### Priority 2 (High)

4. **Remove Unused Security Code**
   - Either implement or remove `clearSensitiveData()` function
   
5. **Session Management Improvements**
   - Enforce maximum session duration
   - Clear all decrypted data on timeout

6. **Production Logging**
   - Strip all console.log statements
   - Implement redacted error logging

### Priority 3 (Medium)

7. **React DevTools Protection**
   - Disable React DevTools in production
   - Obfuscate component state names

8. **Content Security Policy**
   - Implement strict CSP headers
   - Prevent unauthorized script execution

9. **Secure State Management**
   - Consider using encrypted state management library
   - Implement state encryption layer

---

## 8. Compliance Considerations

### PCI DSS (Payment Card Industry Data Security Standard)

**Violations:**
- ❌ **Requirement 3.4:** Plaintext PANs (Primary Account Numbers) rendered on screen without adequate protection
- ❌ **Requirement 3.5:** Card data not securely deleted after authorization
- ⚠️ **Requirement 8.2.3:** Session management partially implemented but bypassable

### GDPR (General Data Protection Regulation)

**Concerns:**
- ⚠️ **Article 32 (Security):** Appropriate technical measures partially implemented
- ⚠️ **Right to Erasure:** No secure deletion mechanism for card data in memory

---

## 9. Conclusion

The Dred application implements **strong encryption at rest** using AES-256, which is commendable. However, **data disposal and in-memory security practices are insufficient** for handling highly sensitive payment card data.

### Summary of Data Lifecycle:

| Stage | Security Level | Issues |
|-------|---------------|--------|
| **Storage (Firestore)** | ✅ Excellent | AES-256 encrypted |
| **Transmission** | ✅ Good | HTTPS enforced |
| **Decryption** | ✅ Good | Client-side only |
| **In-Memory** | ⚠️ Weak | No secure cleanup |
| **Display** | ⚠️ Weak | Auto-hide implemented but data persists |
| **Disposal** | ❌ Critical | No secure wiping |

### Key Metrics:

- **Decryption Points:** 5 major locations
- **Average Decrypted Fields:** 6 per card
- **Maximum Plaintext in Memory:** ~1,330 characters (for 20 cards)
- **Data Retention:** Entire session duration (30+ minutes)
- **Explicit Cleanup Calls:** 0 (zero)

### Risk Level: **MEDIUM-HIGH**

While the application is not immediately vulnerable to remote attacks due to client-side encryption, **physical access or browser-based attacks could expose all card data in plaintext**.

---

## Appendix A: Code References

### Decryption Implementations
- `src/utils/security.js:148-157` - Core decryption function
- `src/ViewCards.jsx:164-178` - Card viewing decryption
- `src/BillPay.jsx:76-85` - Bill pay bulk decryption
- `src/features/settings/Settings.jsx:58-63` - Settings decryption

### Session Management
- `src/utils/security.js:93-128` - Inactivity timer
- `src/App.jsx:208-233` - Session timeout handler

### Cleanup Attempts
- `src/utils/security.js:160-165` - Unused cleanup function
- `src/App.jsx:373` - Master password clearing on sign-out

---

**Assessment Prepared By:** AI Security Analyst  
**Date:** October 4, 2025  
**Next Review:** Recommended within 30 days after implementing critical fixes
