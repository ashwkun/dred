// ViewCards.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import LogoWithFallback from "./LogoWithFallback";
import { BiCreditCard } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import { usePartialDecrypt, useRevealCardNumber, useRevealDetails } from './hooks/usePartialDecrypt';
import { toSafeString } from './utils/securePlaintextHelpers';
import { secureWipeString } from './utils/secureCleanup';
import { secureLog } from './utils/secureLogger';
import { securityManager } from './utils/security';

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

  const [showDetails, setShowDetails] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState({});

  //

  // Auto-hide details after 5 seconds
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

  const handleViewDetails = useCallback(async (cardId, card) => {
    // Use callback form to access current state without adding dependency
    setShowDetails(prev => {
      const isCurrentlyShowing = prev[cardId];
      
      if (isCurrentlyShowing) {
        // Hide details and clear decrypted CVV/expiry
        hideDetails(cardId);
        return { ...prev, [cardId]: false };
      } else {
        // Show details and decrypt CVV/expiry
        revealDetails(cardId, card);
        return { ...prev, [cardId]: true };
      }
    });
  }, [hideDetails, revealDetails]);

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
        fullNumber = await securityManager.decryptCardNumberFull(card.cardNumberFull, masterPassword);
      } else if (card.cardNumberFirst && card.cardNumberLast4) {
        const firstSecure = await securityManager.decryptData(card.cardNumberFirst, masterPassword, true);
        const plain = toSafeString(firstSecure, '') + card.cardNumberLast4;
        // wrap into a pseudo SecurePlaintext-like object for uniform zeroing
        fullNumber = { toString: () => plain, zero: () => {} };
        if (firstSecure && firstSecure.zero) firstSecure.zero();
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

  // Memoized Timer countdown component
  const CountdownTimer = memo(({ duration = 5000 }) => {
    const [progress, setProgress] = useState(100);
    
    useEffect(() => {
      const startTime = Date.now();
      // Reduced update frequency from 50ms to 100ms for better performance
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6">
        <svg className="w-6 h-6 transform -rotate-90">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/60"
            strokeDasharray={`${progress * 0.628} 100`}
            strokeLinecap="round"
          />
        </svg>
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
          const isShowingDetails = showDetails[card.id];
          const revealedNumber = revealedNumbers[card.id];
          const details = revealedDetails[card.id];
          // Convert SecurePlaintext to string safely
          let fullCardNumber = null;
          if (revealedNumber) {
            if (card.cardNumberFirst) {
              fullCardNumber = (toSafeString(revealedNumber, '') + (card.cardNumberLast4 || ''));
            } else {
              // Fallback: revealedNumber holds full number when no split exists
              fullCardNumber = toSafeString(revealedNumber, '');
            }
          }
          const isAmexBank = /amex|american/i.test(card.bankName || '');

          return (
            <div key={card.id} className="group">
              <div className="relative w-full aspect-[1.586/1] rounded-[28px] overflow-hidden transform-gpu transition-all duration-700 ease-out 
                shadow-[0_16px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)] group-hover:-translate-y-1"
                style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                {/* Animated gradient border moved inside effects wrapper for strict clipping */}
                {/* Enhanced Theme Layers */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: card.theme,
                    opacity: 0.4,  // Increased from 0.15
                  }}
                />

                {/* Additional Theme Gradient */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(120deg, ${card.theme}, transparent)`,
                    opacity: 0.3,
                  }}
                />

                {/* Glassmorphic Layers */}
                <div className="absolute inset-0 backdrop-blur-2xl bg-white/[0.06]" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                
                {/* Effects wrapper to clip all overlays within rounded card */}
                <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                  {/* Gradient border inside clip to avoid initial paint bleed */}
                  <div className="absolute inset-[2px] rounded-[26px] opacity-40 group-hover:opacity-70 transition-opacity duration-500 
                    bg-[conic-gradient(at_30%_0%,rgba(255,255,255,0.28),rgba(255,255,255,0.08),transparent_55%)]" />
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Subtle diagonal lines */}
                  <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                    style={{
                      backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 10px)`
                    }}
                  />

                  {/* Sheen highlight on hover */}
                  <div className="absolute inset-0">
                    <div className="absolute -left-1/3 -top-1/2 w-2/3 h-[200%] rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500" />
                  </div>

                  {/* Corner glows and inner shadow for depth (reduced to avoid white bleed) */}
                  <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-2xl opacity-10" />
                  <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-2xl opacity-6" />
                  <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.4)]" />
                </div>

                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between z-10">
                  {/* Timer when showing details */}
                  {isShowingDetails && <CountdownTimer />}

                  {/* Top Section */}
                  <div className="flex justify-between items-start">
                    <div className={`${isAmexBank ? 'h-12 w-40' : 'h-8 w-28'} opacity-95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]`}>
                      <LogoWithFallback
                        logoName={card.bankName}
                        logoType="bank"
                        className="h-full w-full object-contain object-left"
                      />
                    </div>
                    <div className="text-white/80 text-sm font-medium px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                      {card.cardName}
                    </div>
                  </div>

                  {/* Middle Section - Card Number/Details */}
                  <div className="relative flex flex-col items-center justify-center h-20">
                    {/* Card Number with Reveal & Copy */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3
                      transition-all duration-300 ${
                      isShowingDetails ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                      {/* Card Number Display - Elegant Reveal */}
                      <div className="relative">
                        <div className={`text-base sm:text-lg md:text-xl text-white font-light tracking-wider font-mono text-center whitespace-nowrap overflow-hidden
                          transition-all duration-700 ease-out ${fullCardNumber ? 'opacity-100' : 'opacity-90'}`}>
                          {fullCardNumber 
                            ? fullCardNumber.replace(/(.{4})/g, "$1 ").trim()
                            : `•••• •••• •••• ${card.cardNumberLast4}`
                          }
                        </div>
                      </div>
                      
                      {/* Action Buttons - Icon Only Minimal */}
                      <div className="flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        {/* Reveal/Hide Button - Icon Only */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (revealedNumber) {
                              hideNumber(card.id);
                            } else {
                              await revealNumber(card.id, card);
                            }
                          }}
                          className={`group/btn relative p-2 rounded-md
                            transition-all duration-300 z-20 cursor-pointer
                            backdrop-blur-xl bg-white/5 hover:bg-white/15
                            border border-white/10 hover:border-white/30
                            ${revealedNumber ? 'bg-white/10 border-white/20' : ''}`}
                          style={{ pointerEvents: 'auto' }}
                          title={revealedNumber ? "Hide card number" : "Reveal card number"}
                        >
                          {revealedNumber ? (
                            <svg className="w-4 h-4 text-white/90 transition-transform duration-300 group-hover/btn:scale-110" 
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white/70 transition-transform duration-300 group-hover/btn:scale-110" 
                              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Copy Button - Icon Only with Fast Animation Feedback */}
                        {fullCardNumber && (
                          <button
                            onClick={(e) => handleCopy(e, card, card.id)}
                            className={`group/btn relative p-2 rounded-md
                              backdrop-blur-xl bg-white/5 hover:bg-white/15
                              border border-white/10 hover:border-white/30
                              transition-all duration-200 z-20 cursor-pointer
                              animate-in fade-in slide-in-from-bottom-2 duration-300
                              ${copyFeedback[card.id] ? 'bg-white/15 border-white/30' : ''}`}
                            style={{ pointerEvents: 'auto' }}
                            title="Copy card number"
                          >
                            {copyFeedback[card.id] ? (
                              <svg className="w-4 h-4 text-white/90 transition-all duration-150" 
                                fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white/70 transition-transform duration-300 group-hover/btn:scale-110" 
                                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* CVV/Expiry Section - Elegant Reveal */}
                    <div className={`absolute inset-0 flex items-center justify-center
                      transition-all duration-500 ease-out ${
                      isShowingDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">CVV</span>
                          <span className={`font-mono text-lg transition-all duration-700 ease-out ${
                            details ? 'text-white opacity-100' : 'text-white/70 opacity-90'
                          }`}>
                            {details ? toSafeString(details.cvv, '•••') : '•••'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Expires</span>
                          <span className={`font-mono text-lg transition-all duration-700 ease-out ${
                            details ? 'text-white opacity-100' : 'text-white/70 opacity-90'
                          }`}>
                            {details ? details.expiry : 'MM/YY'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex items-end justify-between">
                    <p className="text-white text-sm font-medium tracking-wide">
                      {card.cardHolder}
                    </p>
                    <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
                      <div className="h-8 w-12">
                        <LogoWithFallback
                          logoName={card.networkName}
                          logoType="network"
                          className="h-full w-full object-contain object-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CVV/Expiry Details Button - Eye Icon with Clear Label */}
                  <button
                    onClick={() => handleViewDetails(card.id, card)}
                    className={`group/details absolute bottom-4 left-1/2 -translate-x-1/2
                      transition-all duration-300 px-3 py-1.5 rounded-md 
                      backdrop-blur-xl border
                      flex items-center gap-1.5
                      text-[10px] font-light tracking-wide
                      md:opacity-0 md:group-hover:opacity-100
                      ${isShowingDetails 
                        ? 'bg-white/10 hover:bg-white/15 border-white/30 text-white/90' 
                        : 'bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30 text-white/70'
                      }`}
                  >
                    {isShowingDetails ? (
                      <>
                        <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/details:scale-110" 
                          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                        <span>Hide CVV/Expiry</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/details:scale-110" 
                          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>CVV/Expiry</span>
                      </>
                    )}
                  </button>
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
    </div>
  );
}

export default ViewCards;
