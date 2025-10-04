## 1.5.0 (2025-10-04)

Release focus: security hardening, memory hygiene, split-number storage, UI refinements, and CSP fixes.

1. Security and Privacy
   - Replaced all console calls with environment-aware `secureLog` and redaction.
   - Added secure plaintext handling (typed arrays) and zeroization on teardown.
   - Implemented time-limited decryption for CVV/expiry and secure clipboard auto-clear.
   - Introduced memory cleanup utilities and integrated across Views, Settings, Bill Pay, App.
   - Runtime security checks: devtools/debugger awareness (prod gated).

2. Data Model and Encryption
   - Split card number storage: `cardNumberFirst` + `cardNumberLast4` with on-demand full reconstruction.
   - New `SecurityManager` helpers for split encryption/decryption.
   - Firestore rules updated to enforce split fields and required attributes.

3. UX and UI
   - ViewCards card face redesign with glassmorphism; refined iconography and animations.
   - Bill Pay shows masked UPI; decrypts only when needed (Pay/eye).
   - Copy flow: faster animation, textless buttons, and clear countdown.

4. Stability and Build
   - Parcel environment fixes (`process.env.NODE_ENV`) and CSP updates for Firebase/Google APIs.
   - Firestore connectivity reliability: long polling mode with SW exclusions for Firebase endpoints.
   - Service worker cache version bump and safer fetch strategy.

5. Fixes
   - Edit Cards: fallback to `cardNumberFull` for legacy docs; correct decryption and formatting.
   - Settings syntax issues resolved; partial decryption hook robustness improvements.

Notes
   - Production bundle has no dev logs; sensitive values are redacted in development.
   - All on-demand decrypted data is time-bound and securely wiped.


