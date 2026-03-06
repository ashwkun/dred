# Dred

A privacy-first card manager that encrypts everything on your device before it ever touches a server.

**[Open Dred →](https://dredbox.web.app)**

---

## What it does

Dred stores your credit and debit card details — numbers, CVV, expiry, cardholder name — behind a master password. All encryption and decryption happens in your browser using the Web Crypto API. The server only ever sees ciphertext.

It runs as an installable PWA, so it works like a native app on your phone or desktop without needing an app store.

## Features

- **End-to-end encrypted storage** — AES-256-GCM encryption with PBKDF2 key derivation (100k iterations). Card numbers are split into two separately encrypted parts before storage.
- **Two-layer authentication** — Sign in with Google or email (first factor), then unlock your vault with a master password (second factor). The master password never leaves the device — it derives the encryption key locally. No password recovery by design.
- **Card scanner** — Scan a physical card using your phone camera (Tesseract.js OCR) to auto-fill details while adding a card.
- **Bill payment via UPI** — Generate UPI payment IDs for supported banks (Axis, ICICI, AU Small Finance, IDFC First, Amex) and pay credit card bills directly from any UPI app.
- **Bill tracking** — Track billing cycles with configurable generation dates and due offsets, see due/overdue/paid status at a glance.
- **Card themes** — Each card gets a visual face with bank-specific gradients, or pick from preset color themes. Cards render with the bank logo, network logo, and masked number.
- **3D card flip** — Tap to flip a card and reveal details (full number, CVV, expiry) with a countdown timer that auto-hides them after 30 seconds.
- **Quick copy** — Tap any detail to copy it. Clipboard auto-clears after 10 seconds.
- **Auto-lock** — Master password expires after 5 minutes of inactivity. Session times out entirely after 60 minutes.
- **Rate limiting & lockout** — Failed password attempts are rate-limited. After 3 failures, a 15-minute lockout kicks in.
- **Dark mode** — Full dark/light mode toggle, persisted across sessions.
- **Installable PWA** — Add to home screen on mobile or desktop. Offline-capable with service worker caching.
- **Responsive layout** — Sidebar navigation on desktop, bottom tab bar on mobile.

## Security model

| Layer | Detail |
|-------|--------|
| Encryption | AES-256-GCM via Web Crypto API (non-extractable keys) |
| Key derivation | PBKDF2, 100,000 iterations, user-specific salt (UID) |
| Card storage | Split-number architecture — first 12 digits and last 4 encrypted separately |
| Memory | Sensitive data held in `Uint8Array` (SecurePlaintext), zeroed immediately after use |
| Time limits | CVV/expiry auto-hide: 30s · clipboard clear: 10s · session: 60min · inactivity: 5min |
| Transport | Firestore security rules enforce per-user access (UID verification) |
| Headers | HSTS, X-Frame-Options DENY, CSP, X-Content-Type-Options, Referrer-Policy |
| Auth | Two-layer: Google OAuth or email/password (1st factor) + master password (2nd factor) |

All card data is encrypted client-side before being written to Firestore. The master password is never transmitted or stored — it only exists in memory during an active session. Decryption is on-demand: sensitive fields are decrypted when you view them and wiped from memory shortly after.

## Tech stack

- **Frontend** — React 19, Tailwind CSS, Framer Motion
- **Bundler** — Parcel
- **Backend** — Firebase (Auth, Firestore)
- **Encryption** — Web Crypto API (native browser)
- **OCR** — Tesseract.js
- **Hosting** — Firebase Hosting

## Getting started

```bash
# Clone the repo
git clone https://github.com/ashwkun/dred.git
cd dred

# Install dependencies
npm install

# Create .env with your Firebase config (see .env.example)

# Start dev server
npm run dev
```

## Deployment

```bash
# Build and deploy to production
npm run deploy

# Build and deploy to dev
npm run deploy:dev
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full environment setup.

## License

ISC
