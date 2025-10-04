# 🚀 Quick Reference Checklist

**Print this or keep it open while working**

---

## Before You Start

```bash
# 1. Create backup branch
git checkout -b security-fixes-backup
git push origin security-fixes-backup

# 2. Create working branch
git checkout -b security-fixes-card-data

# 3. Backup Firestore (Firebase Console)
# Go to: Firestore Database > Export/Import > Export
```

---

## Phase Progress Tracker

### Phase 1: Split Storage ⏱️ 30-40 min
- [ ] Migration utility created (`src/utils/cardDataMigration.js`)
- [ ] AddCard.jsx updated (encrypt both last4 and full)
- [ ] ViewCards.jsx updated (only decrypt last4 for display)
- [ ] BillPay.jsx updated (minimal decryption)
- [ ] Settings.jsx updated (minimal decryption)
- [ ] **TEST:** Add new card, verify split fields in Firestore
- [ ] **TEST:** View cards, verify only last 4 visible
- [ ] **COMMIT:** `git commit -m "feat: implement split card number storage"`

### Phase 2: Memory Cleanup ⏱️ 20-30 min
- [ ] `src/utils/secureCleanup.js` created
- [ ] Wipe functions implemented (string, object, array)
- [ ] `useSecureCleanup` hook created
- [ ] ViewCards cleanup added
- [ ] BillPay cleanup added
- [ ] Settings cleanup added
- [ ] **TEST:** Navigate away, check state is cleared
- [ ] **TEST:** Unmount component, verify no data in memory (DevTools)
- [ ] **COMMIT:** `git commit -m "feat: add secure memory cleanup"`

### Phase 3: Time-Limited + Clipboard ⏱️ 15-25 min
- [ ] Clipboard auto-clear implemented (10 seconds)
- [ ] Copy feedback shows countdown
- [ ] CVV/Expiry auto-clear implemented (30 seconds)
- [ ] Countdown timer UI added
- [ ] Cleanup on unmount
- [ ] **TEST:** Copy card number, wait 10s, check clipboard empty
- [ ] **TEST:** Show CVV, wait 30s, verify auto-hidden
- [ ] **COMMIT:** `git commit -m "feat: time-limited decryption and secure clipboard"`

### Phase 4: Production Hardening ⏱️ 15-25 min
- [ ] `src/utils/secureLogger.js` created
- [ ] All `console.log` replaced with `secureLog.*`
- [ ] `vite.config.js` updated (terser, drop_console)
- [ ] `src/utils/securityChecks.js` created
- [ ] Security checks initialized in `main.jsx`
- [ ] `firestore.rules` updated
- [ ] **TEST:** Build production: `npm run build`
- [ ] **TEST:** No console logs in production build
- [ ] **COMMIT:** `git commit -m "feat: production security hardening"`

### Phase 5: Testing & Verification ⏱️ 20-30 min
- [ ] `utilities/verify-migration.js` created
- [ ] `tests/security.test.js` created
- [ ] All tests passing
- [ ] Migration verification script works
- [ ] **RUN:** `npm test -- security.test.js`
- [ ] **RUN:** `node utilities/verify-migration.js <userId> <password>`
- [ ] **COMMIT:** `git commit -m "test: add security test suite"`

### Phase 6: Documentation ⏱️ 10-20 min
- [ ] `SECURITY.md` created
- [ ] `MIGRATION_GUIDE.md` created
- [ ] `README.md` updated
- [ ] All docs reviewed
- [ ] **COMMIT:** `git commit -m "docs: add security documentation"`

---

## Testing Checklist (After All Phases)

### Functional Tests
- [ ] Can add new card successfully
- [ ] Can view existing cards (only last 4 visible)
- [ ] Can click "Show Details" to see CVV/Expiry
- [ ] CVV/Expiry auto-hide after 30 seconds
- [ ] Can copy card number
- [ ] Clipboard clears after 10 seconds
- [ ] Can delete cards in Settings
- [ ] Can reorder cards in Settings
- [ ] Bill Pay works correctly
- [ ] Mobile number handling works

### Security Tests
- [ ] Full card number NEVER visible in normal view
- [ ] Open React DevTools → check state → no full card numbers visible (except encrypted)
- [ ] Navigate away from ViewCards → verify state cleared
- [ ] Close DevTools, reopen → no sensitive data exposed
- [ ] Production build has no console.logs
- [ ] Firestore rules prevent unauthorized access
- [ ] Password re-entry required after timeout
- [ ] Migration script works on test data

### Performance Tests
- [ ] App loads in < 3 seconds
- [ ] Card list renders smoothly
- [ ] No memory leaks (check Chrome DevTools Memory tab)
- [ ] No console errors

---

## Migration Execution Checklist

### On Development Environment
```bash
# 1. Test migration dry-run
node utilities/migrate-card-data.js --dry-run

# 2. Review dry-run output
# Check: No errors, all cards detected

# 3. Run actual migration
node utilities/migrate-card-data.js --execute

# 4. Verify migration
node utilities/verify-migration.js <your-user-id> <your-master-password>

# 5. Test app functionality
npm run dev
# Test: Add card, view cards, delete card, etc.
```

### On Production Environment
```bash
# 1. Deploy to Firebase
npm run build
firebase deploy --only firestore:rules
firebase deploy --only hosting

# 2. Have users re-login (will re-encrypt with new format)

# 3. Monitor Firestore for issues
# Check: New cards have cardNumberLast4 and cardNumberFull fields

# 4. After 7 days, verify all cards migrated
node utilities/verify-migration.js --all-users

# 5. After 30 days, clean up old cardNumber field (optional)
# Run script to remove old field from Firestore documents
```

---

## Rollback Plan (If Something Goes Wrong)

### Immediate Rollback (< 1 hour after deployment)
```bash
# 1. Revert to previous deployment
firebase hosting:rollback

# 2. Revert Firestore rules
firebase deploy --only firestore:rules
# (manually paste old rules from git)

# 3. Notify users via app banner
"Service temporarily unavailable. Please try again in 5 minutes."
```

### Data Rollback (If migration corrupted data)
```bash
# 1. Restore Firestore from backup
# Firebase Console → Firestore → Import
# Select backup file from before migration

# 2. Revert code to old branch
git checkout main
git push origin main --force

# 3. Redeploy
npm run build
firebase deploy
```

---

## Critical Files Reference

### Files Created
```
src/utils/cardDataMigration.js    - Migration script
src/utils/secureCleanup.js         - Memory cleanup utilities
src/utils/secureLogger.js          - Production logging
src/utils/securityChecks.js        - DevTools detection
utilities/verify-migration.js      - Migration verification
tests/security.test.js             - Security tests
SECURITY.md                        - Security documentation
MIGRATION_GUIDE.md                 - Migration guide
```

### Files Modified
```
src/AddCard.jsx                    - Split number encryption
src/ViewCards.jsx                  - Minimal decryption, cleanup
src/BillPay.jsx                    - Minimal decryption, cleanup
src/features/settings/Settings.jsx - Minimal decryption, cleanup
src/utils/security.js              - Cleanup implementation
src/main.jsx                       - Security checks init
vite.config.js                     - Production build config
firestore.rules                    - Updated security rules
README.md                          - Updated with security info
```

---

## Quick Commands

### Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run specific test
npm test -- security.test.js

# Build for production
npm run build

# Preview production build
npm run preview
```

### Firebase
```bash
# Deploy everything
firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy only hosting
firebase deploy --only hosting

# View logs
firebase functions:log

# Open Firestore console
firebase open firestore
```

### Git
```bash
# Check status
git status

# View changes
git diff

# Commit with message
git commit -m "feat: [description]"

# Push to remote
git push origin security-fixes-card-data

# Create PR (if using GitHub)
gh pr create --title "Security Fixes: Card Data Handling"
```

---

## Emergency Contacts & Resources

### Firebase Console
- **Firestore:** https://console.firebase.google.com/project/[your-project]/firestore
- **Authentication:** https://console.firebase.google.com/project/[your-project]/authentication
- **Hosting:** https://console.firebase.google.com/project/[your-project]/hosting

### Documentation
- **CryptoJS:** https://cryptojs.gitbook.io/docs/
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro/
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/get-started

### Debugging Tools
- **React DevTools:** Chrome extension
- **Redux DevTools:** Chrome extension (if using Redux)
- **Chrome DevTools → Memory:** Check for memory leaks
- **Chrome DevTools → Network:** Monitor Firestore requests

---

## Success Metrics

After deployment, verify:

| Metric | Before | Target After | Check |
|--------|--------|--------------|-------|
| Full card numbers in memory | All cards | 0 (only last 4) | [ ] |
| Clipboard persistence | Forever | 10 seconds | [ ] |
| CVV/Expiry exposure | Until page close | 30 seconds | [ ] |
| Memory cleanup on unmount | None | 100% | [ ] |
| Console logs in production | Many | Zero | [ ] |
| DevTools detection | None | Implemented | [ ] |
| Firestore rule validation | Basic | Comprehensive | [ ] |

---

## Support & Troubleshooting

### Common Issues

**Issue:** Migration script fails with "Permission denied"
- **Fix:** Check Firebase Admin SDK credentials
- **Command:** `firebase login` and try again

**Issue:** Cards not displaying after migration
- **Fix:** Check console for decryption errors
- **Solution:** Verify master password is correct

**Issue:** Tests failing
- **Fix:** Update test mocks for new data structure
- **Command:** `npm test -- --updateSnapshot`

**Issue:** Production build fails
- **Fix:** Check for TypeScript errors or import issues
- **Command:** `npm run build -- --debug`

**Issue:** Firestore rules blocking writes
- **Fix:** Verify new fields in rules match code
- **Check:** `cardNumberLast4` and `cardNumberFull` validation

---

## Sign-off Checklist (Before Merging to Main)

- [ ] All phases completed and tested
- [ ] No console errors in development
- [ ] No console errors in production build
- [ ] All security tests passing
- [ ] Migration tested on development data
- [ ] Rollback plan documented and understood
- [ ] Team reviewed changes (if applicable)
- [ ] Documentation complete and accurate
- [ ] Backup of current production data exists
- [ ] Ready to deploy to production

---

## Post-Deployment Monitoring

### Week 1
- [ ] Monitor error logs daily
- [ ] Check for failed decryption errors
- [ ] Verify new cards use split format
- [ ] Monitor user feedback

### Week 2
- [ ] Run migration verification on all users
- [ ] Check for unmigrated cards
- [ ] Review security logs

### Week 4
- [ ] All cards should be migrated
- [ ] Consider removing old `cardNumber` field
- [ ] Update documentation if needed
- [ ] Celebrate successful deployment! 🎉

---

**Need Help?**
Refer to:
- `SECURITY.md` for architecture details
- `MIGRATION_GUIDE.md` for step-by-step instructions
- `CURSOR_PROMPTS_SECURITY_FIXES.md` for detailed prompts

**Last Updated:** 2025-10-04
