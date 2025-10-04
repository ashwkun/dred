// ViewCards.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import LogoWithFallback from "./LogoWithFallback";
import { BiCreditCard } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import { usePartialDecrypt, useRevealCardNumber, useRevealDetails } from './hooks/usePartialDecrypt';
import { toSafeString } from './utils/securePlaintextHelpers';
import { secureWipeString } from './utils/secureCleanup';
import { secureLog } from './utils/secureLogger';
import { securityManager } from './utils/security';
import { getStatus } from './utils/billing';
import format from 'date-fns/format';
import Dialog from './components/Dialog';

// Add default values for all props to make component more robust
function ViewCards({ 
  user, 
  masterPassword, 
  setActivePage = () => {}, 
  cards: externalCards = [], 
  setCards: externalSetCards = () => {}
}) {
  
  // 🚀 PERFORMANCE FIX: Always use external cards from App.jsx (single source of truth)
  // App.jsx manages the real-time Firestore listener - we just display the data
  const cards = externalCards || [];
  const setCards = externalSetCards || (() => {});

  // Card face state: 'front' | 'number' | 'cvv'
  const [cardFace, setCardFace] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, cardId: null, card: null });

  // Auto-flip back to front after 30 seconds of inactivity
  useEffect(() => {
    const timers = {};
    
    Object.keys(cardFace).forEach(cardId => {
      if (cardFace[cardId] === 'number' || cardFace[cardId] === 'cvv') {
        timers[cardId] = setTimeout(() => {
          setCardFace(prev => ({ ...prev, [cardId]: 'front' }));
          // Clean up decrypted data
          hideNumber(cardId);
          hideDetails(cardId);
        }, 30000); // 30 seconds
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [cardFace]);

  // 🚀 PERFORMANCE FIX: Fast loading - cards are already fetched by App.jsx
  useEffect(() => {
    // Validation
    if (!user || !masterPassword) {
      setError("Please log in and enter your master password.");
      setLoading(false);
      return;
    }

    setError(null);
    
    // If cards exist, show them immediately (already loaded by App.jsx)
    if (externalCards && externalCards.length > 0) {
      setLoading(false);
      return;
    }
    
    // Otherwise show brief loading for empty state or first load
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500); // Only 500ms timeout for empty state

    return () => clearTimeout(timeout);
  }, [user, masterPassword, externalCards]);

  //

  // 🔐 TIERED SECURITY: Partial decrypt (metadata + last 4 only)
  const { partialCards, isDecrypting } = usePartialDecrypt(cards, masterPassword);
  
  // Separate reveal hooks for card number and CVV/expiry
  const { revealedNumbers, revealNumber, hideNumber } = useRevealCardNumber(masterPassword);
  const { revealedDetails, revealDetails, hideDetails } = useRevealDetails(masterPassword);

  // Optimistic Paid state (cardId -> cycleKey) for instant pill update
  const [localPaidKeys, setLocalPaidKeys] = useState({});

  const openMarkPaidConfirmation = useCallback((card) => {
    setConfirmDialog({ isOpen: true, cardId: card.id, card });
  }, []);

  const handleMarkPaid = useCallback(async () => {
    const { card, cardId } = confirmDialog;
    if (!card) return;
    
    try {
      const today = new Date();
      const status = getStatus(today, card.billGenDay, card.billDueOffsetDays, localPaidKeys[cardId] ?? card.lastPaidCycleKey);
      if (!status.cycleKey) return;
      // Optimistic update
      setLocalPaidKeys((prev) => ({ ...prev, [cardId]: status.cycleKey }));
      const cardRef = doc(db, "cards", cardId);
      await updateDoc(cardRef, { lastPaidCycleKey: status.cycleKey });
      secureLog.info('Marked bill as paid for cycle:', status.cycleKey);
      setConfirmDialog({ isOpen: false, cardId: null, card: null });
    } catch (e) {
      secureLog.error('Failed to mark bill paid', e);
      // Best-effort revert on failure
      setLocalPaidKeys((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      setConfirmDialog({ isOpen: false, cardId: null, card: null });
    }
  }, [confirmDialog, localPaidKeys]);

  const handleFlipToNumber = useCallback(async (cardId, card) => {
    setCardFace(prev => ({ ...prev, [cardId]: 'number' }));
    await revealNumber(cardId, card);
  }, [revealNumber]);

  const handleToggleToCvv = useCallback(async (cardId, card) => {
    // Clear card number, show CVV
    hideNumber(cardId);
    await revealDetails(cardId, card);
    setCardFace(prev => ({ ...prev, [cardId]: 'cvv' }));
  }, [hideNumber, revealDetails]);

  const handleToggleToNumber = useCallback(async (cardId, card) => {
    // Clear CVV, show card number
    hideDetails(cardId);
    await revealNumber(cardId, card);
    setCardFace(prev => ({ ...prev, [cardId]: 'number' }));
  }, [hideDetails, revealNumber]);

  const handleFlipToFront = useCallback((cardId) => {
    setCardFace(prev => ({ ...prev, [cardId]: 'front' }));
    hideNumber(cardId);
        hideDetails(cardId);
  }, [hideNumber, hideDetails]);

  // Make the handleAddCard function more robust
  const handleAddCard = useCallback((e) => {
    e.preventDefault(); // Add this to prevent any default behavior
    //
    
    // Safe fallback if setActivePage is not a function
    if (typeof setActivePage !== 'function') {
      secureLog.error('setActivePage is not a function, trying to navigate manually');
      try {
        // Try to manually change the URL or set state
        window.history.pushState({}, "", "/#addCard");
        window.dispatchEvent(new CustomEvent('urlchange', { detail: { page: 'addCard' } }));
        return;
      } catch (err) {
        secureLog.error('Failed to navigate manually:', err);
        if (setDialog) {
          setDialog({
            isOpen: true,
            title: 'Navigation Error',
            message: 'Navigation error. Please try refreshing the page.',
            confirmText: 'OK',
            cancelText: null,
            type: 'danger',
            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
          });
        }
        return;
      }
    }
    
    // If we get here, setActivePage is a function
    setActivePage("addCard");
  }, [setActivePage]);

  const handleCopy = useCallback(async (e, card, cardId) => {
    e.preventDefault();
    e.stopPropagation();

    // Decrypt full number ONLY for copy
    let fullNumber = null;
    try {
      if (card.cardNumberFull) {
        // Legacy: decrypt full card number
        fullNumber = await securityManager.decryptCardNumberFull(card.cardNumberFull, masterPassword);
      } else if (card.cardNumberFirst && card.cardNumberLast4) {
        // New split format: decrypt both parts
        const firstSecure = await securityManager.decryptData(card.cardNumberFirst, masterPassword, true);
        const last4Secure = await securityManager.decryptData(card.cardNumberLast4, masterPassword, true);
        const plain = toSafeString(firstSecure, '') + toSafeString(last4Secure, '');
        // wrap into a pseudo SecurePlaintext-like object for uniform zeroing
        fullNumber = { toString: () => plain, zero: () => {} };
        if (firstSecure && firstSecure.zero) firstSecure.zero();
        if (last4Secure && last4Secure.zero) last4Secure.zero();
      }
      navigator.clipboard.writeText(toSafeString(fullNumber).replace(/\s/g, ''));

        setCopyFeedback(prev => ({ ...prev, [cardId]: true }));
        setTimeout(() => {
          setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
        }, 1500);

      // Auto-clear clipboard after 10 seconds
      setTimeout(async () => {
        await navigator.clipboard.writeText('');
      }, 10000);
    } catch (error) {
      secureLog.error('Error copying card number:', error);
    } finally {
      // Clear from memory immediately
      if (fullNumber) {
        fullNumber.zero();
        fullNumber = secureWipeString(fullNumber);
      }
    }
  }, [masterPassword]);

  // Memoized Timer countdown component (30 seconds)
  const CountdownTimer = memo(({ duration = 30000 }) => {
    const [progress, setProgress] = useState(100);
    
    useEffect(() => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 * (1 - elapsed / duration));
        setProgress(remaining);
        
        if (elapsed >= duration) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }, [duration]);

    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 z-30">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/70"
            strokeDasharray={`${progress * 0.88} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs font-mono">
          {Math.ceil((progress / 100) * (duration / 1000))}
        </div>
      </div>
    );
  });

  if (loading || isDecrypting) {
    return <LoadingOverlay message="Loading your cards" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <BiCreditCard className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Your Cards</h1>
          <p className="text-white/60">Manage and view your saved cards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {partialCards.map((card) => {
          const currentFace = cardFace[card.id] || 'front';
          const revealedNumber = revealedNumbers[card.id];
          const details = revealedDetails[card.id];
          const fullCardNumber = revealedNumber ? toSafeString(revealedNumber, '') : null;
          const isAmexBank = /amex|american/i.test(card.bankName || '');
          const isAmexNumber = fullCardNumber && (fullCardNumber.startsWith('34') || fullCardNumber.startsWith('37'));
          
          // Bill status
          const effectivePaidKey = localPaidKeys[card.id] ?? card.lastPaidCycleKey;
          const bill = getStatus(new Date(), card.billGenDay, card.billDueOffsetDays, effectivePaidKey);
          const paidThisCycle = bill.cycleKey && effectivePaidKey === bill.cycleKey;
          const pillState = paidThisCycle ? 'paid' : bill.state;
          const monthLabel = bill.cycleStart ? format(bill.cycleStart, 'MMM') : '';
          const pillText = pillState === 'paid' ? `Paid – ${monthLabel}` : pillState === 'overdue' ? `Overdue – ${monthLabel}` : pillState === 'open' ? `Due – ${monthLabel}` : '';
          const hasBillTracking = card.billGenDay && card.billDueOffsetDays;

          return (
            <div key={card.id} className="group perspective-1000">
              {/* Card Flip Container */}
                <div 
                className="relative w-full aspect-[1.586/1] transition-transform duration-700 ease-out transform-style-3d"
                  style={{ 
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transform: currentFace !== 'front' ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* FRONT FACE */}
                <div 
                  className={`absolute inset-0 rounded-[28px] overflow-hidden transform-gpu backface-hidden
                    shadow-[0_16px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)] group-hover:-translate-y-1
                    transition-all duration-700 ease-out ${currentFace !== 'front' ? 'pointer-events-none' : ''}`}
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {/* Theme & Glass Layers */}
                  <div className="absolute inset-0" style={{ background: card.theme, opacity: 0.4 }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${card.theme}, transparent)`, opacity: 0.3 }} />
                  <div className="absolute inset-0 backdrop-blur-2xl bg-white/[0.06]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  
                  {/* Effects wrapper */}
                  <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                    <div className="absolute inset-[2px] rounded-[26px] opacity-40 group-hover:opacity-70 transition-opacity duration-500 
                      bg-[conic-gradient(at_30%_0%,rgba(255,255,255,0.28),rgba(255,255,255,0.08),transparent_55%)]" />
                <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
                    <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                      style={{ backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 10px)` }} />
                    <div className="absolute inset-0"><div className="absolute -left-1/3 -top-1/2 w-2/3 h-[200%] rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500" /></div>
                    <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-2xl opacity-10" />
                    <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-2xl opacity-6" />
                    <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.4)]" />
                  </div>

                  {/* Front Content */}
                <div className="relative h-full p-6 flex flex-col justify-between z-10">
                  {/* Top Section */}
                  <div className="flex justify-between items-start">
                      <div className={`${isAmexBank ? 'h-12 w-40' : 'h-8 w-28'} opacity-95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]`}>
                        <LogoWithFallback logoName={card.bankName} logoType="bank" className="h-full w-full object-contain object-left" />
                    </div>
                      <div className="text-white/80 text-sm font-medium px-2 py-0.5 rounded bg-white/10 border border-white/10 backdrop-blur-md max-w-[160px] truncate">
                      {card.cardName}
                    </div>
                  </div>

                    {/* Middle - Masked Card Number */}
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="text-xl text-white font-light tracking-wider font-mono">
                        •••• •••• •••• {card.cardNumberLast4Display || '••••'}
                      </div>
                      </div>
                      
                    {/* Bottom Section */}
                    <div className="flex items-end justify-between">
                      {/* Left: Bill Pill + Mark Paid OR Card Holder */}
                      {hasBillTracking ? (
                        <div className="flex flex-col gap-1 max-w-[60%]">
                          {pillState !== 'none' && (
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md whitespace-nowrap ${pillState === 'overdue' ? 'bg-red-500/15 border-red-400/30 text-red-200' : pillState === 'paid' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200' : 'bg-amber-500/15 border-amber-400/30 text-amber-200'}`}>
                              {pillText}
                            </div>
                          )}
                          {(bill.state === 'open' || bill.state === 'overdue') && (
                          <button
                              onClick={(e) => { e.stopPropagation(); openMarkPaidConfirmation(card); }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md bg-white/5 hover:bg-white/15 border-white/20 hover:border-white/40 text-white/70 hover:text-white/90 transition-all whitespace-nowrap z-20"
                            style={{ pointerEvents: 'auto' }}
                              title="Mark bill as paid"
                            >
                              Mark Paid
                          </button>
                        )}
                        </div>
                      ) : (
                        <p className="text-white text-sm font-medium tracking-wide max-w-[60%]">{card.cardHolder}</p>
                      )}
                      
                      {/* Right: Network Logo */}
                      <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
                        <div className="h-8 w-12">
                          <LogoWithFallback logoName={card.networkName} logoType="network" className="h-full w-full object-contain object-center" />
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                {/* View Details Button - Icon only, centered below card number */}
                {currentFace === 'front' && (
                  <button
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      handleFlipToNumber(card.id, card); 
                    }}
                    className="group/details absolute top-1/2 left-1/2 -translate-x-1/2 mt-4
                      transition-all duration-300 p-2 rounded-full
                      backdrop-blur-xl border bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30
                      text-white/70 hover:text-white/90
                      opacity-100 z-50"
                    style={{ pointerEvents: 'auto' }}
                    type="button"
                    title="View details"
                  >
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover/details:scale-110" 
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}

                {/* BACK FACE */}
                <div 
                  className={`absolute inset-0 rounded-[28px] overflow-hidden transform-gpu backface-hidden rotate-y-180
                    shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${currentFace === 'front' ? 'pointer-events-none' : ''}`}
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {/* Theme & Glass Layers (same as front) */}
                  <div className="absolute inset-0" style={{ background: card.theme, opacity: 0.4 }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${card.theme}, transparent)`, opacity: 0.3 }} />
                  <div className="absolute inset-0 backdrop-blur-2xl bg-white/[0.06]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  
                  {/* Effects wrapper */}
                  <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                    <div className="absolute inset-[2px] rounded-[26px] opacity-40 
                      bg-[conic-gradient(at_30%_0%,rgba(255,255,255,0.28),rgba(255,255,255,0.08),transparent_55%)]" />
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
                    <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.4)]" />
                  </div>

                  {/* Timer */}
                  {(currentFace === 'number' || currentFace === 'cvv') && <CountdownTimer />}

                  {/* Back Content */}
                  <div className="relative h-full p-4 md:p-6 flex flex-col justify-between z-10">
                    {/* Top - Bank Logo & Close Button */}
                    <div className="flex justify-between items-start">
                      <div className={`${isAmexBank ? 'h-8 w-28 md:h-12 md:w-40' : 'h-6 w-20 md:h-8 md:w-28'} opacity-95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]`}>
                        <LogoWithFallback logoName={card.bankName} logoType="bank" className="h-full w-full object-contain object-left" />
                      </div>
                      <button
                        onClick={() => handleFlipToFront(card.id)}
                        className="p-1.5 md:p-2 rounded-md backdrop-blur-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all"
                        title="Close"
                      >
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Middle - Card Number OR CVV/Expiry */}
                    <div className="flex flex-col items-center justify-center gap-2 md:gap-4">
                      {currentFace === 'number' && (
                        <>
                          <div className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">Card Number</div>
                          <div className="text-base md:text-xl lg:text-2xl text-white font-light tracking-wider font-mono text-center px-2">
                            {fullCardNumber
                              ? isAmexNumber
                                ? `${fullCardNumber.slice(0, 4)} ${fullCardNumber.slice(4, 10)} ${fullCardNumber.slice(10)}`
                                : fullCardNumber.replace(/(.{4})/g, "$1 ").trim()
                              : '•••• •••• •••• ••••'}
                          </div>
                          {fullCardNumber && (
                            <button
                              onClick={(e) => handleCopy(e, card, card.id)}
                              className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg backdrop-blur-xl border transition-all
                                ${copyFeedback[card.id] ? 'bg-white/15 border-white/30 text-white/90' : 'bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30 text-white/70'}`}
                            >
                              {copyFeedback[card.id] ? (
                                <span className="flex items-center gap-1.5 text-[10px] md:text-xs">
                                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                  Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px] md:text-xs">
                                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                  </svg>
                                  Copy
                                </span>
                              )}
                            </button>
                          )}
                        </>
                      )}
                      {currentFace === 'cvv' && (
                        <div className="flex gap-6 md:gap-12">
                          <div className="text-center">
                            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider block mb-1 md:mb-2">CVV</span>
                            <span className="font-mono text-xl md:text-2xl text-white">{details ? toSafeString(details.cvv, '•••') : '•••'}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider block mb-1 md:mb-2">Expires</span>
                            <span className="font-mono text-xl md:text-2xl text-white">{details ? details.expiry : 'MM/YY'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom - Toggle Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => currentFace === 'number' ? handleToggleToCvv(card.id, card) : handleToggleToNumber(card.id, card)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg backdrop-blur-xl border bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30
                          flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium tracking-wide text-white/70 hover:text-white/90 transition-all"
                      >
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          {currentFace === 'number' ? (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          )}
                        </svg>
                        <span className="hidden sm:inline">{currentFace === 'number' ? 'View CVV/Expiry' : 'View Card Number'}</span>
                        <span className="sm:hidden">{currentFace === 'number' ? 'CVV/Expiry' : 'Card Number'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Card Button */}
        <button
          type="button"
          onClick={handleAddCard}
          className="w-full aspect-[1.586/1] rounded-2xl 
            bg-white/5 backdrop-blur-sm border border-white/10
            hover:bg-white/10 transition-all duration-300
            flex flex-col items-center justify-center gap-4
            group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center
            group-hover:scale-110 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Add New Card</p>
            <p className="text-sm text-white/50">Securely store your card details</p>
          </div>
        </button>
      </div>

      {/* Mark Paid Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <Dialog
          isOpen={confirmDialog.isOpen}
          title="Mark Bill as Paid?"
          message={`Are you sure you want to mark the bill for ${confirmDialog.card?.cardName || 'this card'} as paid for the current cycle?`}
          confirmText="Mark Paid"
          cancelText="Cancel"
          type="success"
          onConfirm={handleMarkPaid}
          onClose={() => setConfirmDialog({ isOpen: false, cardId: null, card: null })}
        />
      )}
    </div>
  );
}

export default ViewCards;
