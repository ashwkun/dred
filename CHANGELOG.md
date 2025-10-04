## 2.0.0 (2025-10-04)

Release focus: Bill Payment Tracking, card face UI overhaul, mobile-first UX, OAuth improvements, and CSP hardening.

1. Bill Payment Tracking (New Feature)
   - Track bill cycles with customizable generation date and due offset (10-25 days, default 15).
   - Smart bill status indicators: Due/Overdue/Paid with month display (MMM format).
   - "Mark as Paid" functionality with real-time pill updates and confirmation dialogs.
   - Automatic bill cycle calculation and due date nudges between generation and due dates.
   - Optional feature: displays cardholder name when bill tracking is disabled.

2. Card Face UI Enhancements
   - Complete mobile-first redesign with 3D flip animation for card details.
   - Front face: Clean layout with bank logo, card name, network logo, masked number, and bill status pill.
   - Back face: Toggle between full card number and CVV/Expiry views with 30-second auto-flip timer.
   - Icon-only action buttons (eye icon) for cleaner, space-efficient mobile interface.
   - Countdown timer display on back face showing auto-flip remaining time.
   - Optimized mobile layout: compact padding, responsive font sizes, smaller buttons.

3. Mobile OAuth Improvements
   - Adaptive OAuth: `signInWithRedirect` for mobile, `signInWithPopup` for desktop.
   - Redirect result handling with `browserPopupRedirectResolver` for better compatibility.
   - Auth persistence with `browserLocalPersistence` to survive page reloads.
   - Enhanced error handling for `auth/internal-error`, `auth/unauthorized-domain`, and network issues.

4. Content Security Policy (CSP) Hardening
   - Service worker now properly bypasses ALL Google resources to prevent CSP violations.
   - Added `googleusercontent.com` (Google profile images) and `apis.google.com` to bypass list.
   - Cache version updated to `dred-v5-google-bypass` to force service worker refresh.
   - Google profile images and OAuth flows now work without CSP errors.

5. Security and Data Integrity
   - Continued support for split card number storage (`cardNumberFirst` + `cardNumberLast4`).
   - Time-limited decryption with automatic memory cleanup and secure wipe.
   - BillPay module now correctly displays decrypted `cardNumberLast4Display` instead of encrypted values.
   - Settings and reorder modules fixed to show masked previews correctly.

6. Bug Fixes
   - Fixed BillPay showing encrypted card numbers in previews.
   - Fixed "View Details" button not triggering card flip animation.
   - Fixed dialog cancel/close buttons in bill payment confirmation.
   - Fixed timer overlapping close button on mobile.
   - Fixed buttons clipping outside card face on mobile flip view.
   - Fixed OAuth not working on mobile devices.

Notes
   - Bill tracking data is stored per card with `billGenDay`, `billDueOffsetDays`, and `lastPaidCycleKey`.
   - All existing cards work seamlessly; bill tracking is optional when adding new cards.
   - Mobile UX has been significantly improved with responsive design throughout.

---

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


