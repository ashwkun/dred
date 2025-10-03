# Security Action Items - Priority List

## 🔴 CRITICAL - Must Fix Before Production

### 1. Fix XSS Vulnerability in TopBar Component
**File:** `src/components/TopBar.jsx:87`  
**Current Code:**
```javascript
e.target.parentElement.innerHTML = `<div class="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">${(user.displayName || user.email || 'U')[0].toUpperCase()}</div>`;
```
**Fix:** Replace with textContent or proper React rendering:
```javascript
const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
e.target.parentElement.textContent = initial;
```

### 2. Remove/Disable Production Console Logs
**Files:** `App.jsx`, `MasterPasswordPrompt.jsx`, `Auth.jsx`, `ViewCards.jsx`, `firebase.js`, and others  
**Action:** Implement environment-based logging:
```javascript
const isDev = process.env.NODE_ENV === 'development';
const log = {
  debug: (...args) => isDev && console.log(...args),
  info: (...args) => isDev && console.info(...args),
  error: (...args) => console.error(...args),
};
```

### 3. Enable Password Requirements
**File:** `src/MasterPasswordPrompt.jsx:82-85`  
**Action:** Uncomment and enable password validation (12+ chars, uppercase, lowercase, number, special character)

### 4. Update Session Timeout
**File:** `src/utils/security.js:7`  
**Current:** 30 minutes  
**Action:** Change to 2 minutes as planned
```javascript
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
```
**Bonus:** Add 30-second warning before timeout

### 5. Implement Key Derivation for Encryption
**File:** `src/utils/security.js`  
**Action:** Replace direct password use with PBKDF2:
```javascript
const salt = CryptoJS.lib.WordArray.random(128/8);
const key = CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 256/32,
    iterations: 10000
});
const encrypted = CryptoJS.AES.encrypt(data, key).toString();
```

---

## 🟠 HIGH PRIORITY - Fix Before Launch

### 6. Implement Content Security Policy
**Files:** `index.html`, `public/index.html`  
**Action:** Add CSP meta tag:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://firebaseapp.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com;">
```

### 7. Implement Firebase App Check
**Action:** Add Firebase App Check to protect against abuse:
```bash
npm install firebase
```
```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR-RECAPTCHA-V3-SITE-KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 8. Add Input Validation and Sanitization
**Files:** `AddCard.jsx`, `BillPay.jsx`  
**Action:**
- Add mobile number validation (10 digits)
- Sanitize text inputs (cardHolder name)
- Add server-side validation via Firestore Rules or Cloud Functions

### 9. Run Security Audit
**Action:**
```bash
npm audit
npm audit fix
npm outdated
```
Fix any high/critical vulnerabilities

### 10. Implement Audit Logging
**Action:** Log sensitive operations (card additions, deletions, failed login attempts) to Firestore for audit trail

---

## 🟡 MEDIUM PRIORITY - Recommended

### 11. Add Session Timeout Warning
**File:** `src/utils/security.js`  
**Action:** Show warning dialog 30 seconds before session expires

### 12. Add Password Strength Meter
**File:** `src/MasterPasswordPrompt.jsx`  
**Action:** Implement visual password strength indicator

### 13. Implement Server-Side Validation
**Action:** Create Cloud Functions for:
- Card data validation
- Rate limiting
- Audit logging
- Additional security checks

### 14. Add Error Handling Improvements
**Files:** Multiple  
**Action:**
- Use generic error messages for users
- Log detailed errors server-side only
- Remove stack traces in production

### 15. Implement Subresource Integrity (SRI)
**Files:** `index.html`  
**Action:** Add integrity hashes to external scripts and stylesheets

---

## 🟢 LOW PRIORITY - Nice to Have

### 16. Implement Multi-Factor Authentication
**Action:** Add 2FA/MFA support via Firebase Authentication

### 17. Add Security Headers
**Action:** Configure hosting to send security headers:
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 18. Add Password Recovery Hint System
**Action:** Allow users to store an encrypted hint for password recovery

### 19. Implement Automated Security Testing
**Action:** Set up:
- OWASP ZAP automated scans
- Snyk for dependency scanning
- GitHub Dependabot alerts

### 20. Conduct Penetration Testing
**Action:** Hire professional security firm for pre-launch penetration testing

---

## Quick Reference Checklist

### Before Production Deploy:
- [ ] XSS vulnerability fixed
- [ ] Console logs removed/disabled
- [ ] Password requirements enabled
- [ ] Session timeout = 2 minutes
- [ ] Key derivation implemented
- [ ] CSP headers added
- [ ] Firebase App Check enabled
- [ ] npm audit clean
- [ ] Input validation added
- [ ] Manual security testing completed

### Week 1 After Launch:
- [ ] Monitor logs for suspicious activity
- [ ] Review Firestore security rules
- [ ] Implement audit logging
- [ ] Add session timeout warning
- [ ] Add password strength meter

### Month 1 After Launch:
- [ ] Server-side validation via Cloud Functions
- [ ] MFA implementation
- [ ] Automated security testing
- [ ] Professional penetration testing
- [ ] Security monitoring dashboard

---

## Testing Checklist

### Manual Testing Required:
- [ ] Test authentication flows
- [ ] Test XSS in all input fields
- [ ] Test session timeout behavior
- [ ] Test account lockout (3 failed attempts)
- [ ] Test card encryption/decryption
- [ ] Test unauthorized access attempts
- [ ] Test mobile number validation
- [ ] Test password requirements
- [ ] Test Firebase rules enforcement

### Automated Testing:
- [ ] Run npm audit
- [ ] Run Lighthouse security audit
- [ ] Run OWASP ZAP scan
- [ ] Check all dependencies for vulnerabilities

---

## Estimated Time to Fix

**Critical Issues:** 8-12 hours  
**High Priority Issues:** 16-24 hours  
**Medium Priority Issues:** 24-40 hours  
**Low Priority Issues:** 40+ hours  

**Total for Production Readiness (Critical + High):** ~2-3 days of focused work

---

## Notes

1. **Firebase Keys:** ✅ Confirmed OK to be public - security is enforced through Firestore Rules
2. **Session Timeout:** ✅ Acknowledged - will be changed to 2 minutes
3. **Password Requirements:** ✅ Acknowledged - will be enabled before production
4. **Client-side Encryption:** ✅ Good practice for privacy, but needs key derivation improvement

---

## Contact for Questions

Refer to full `SECURITY_ASSESSMENT.md` for detailed explanations and code examples for each issue.
