// ViewCards.jsx
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import LogoWithFallback from "./LogoWithFallback";
import { securityManager } from "./utils/security";
import { BiCreditCard, BiCopy } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';

// Add default values for all props to make component more robust
function ViewCards({ 
  user, 
  masterPassword, 
  setActivePage = () => console.log("Default setActivePage called"), 
  cards: externalCards = [], 
  setCards: externalSetCards = () => console.log("Default setCards called"),
  decryptedCards: preDecrypted = null
}) {
  console.log('ViewCards COMPONENT RENDERED - CRITICAL DEBUG LOG');
  console.log('ViewCards props check:', {
    hasUser: !!user,
    userValue: user,
    hasMasterPassword: !!masterPassword,
    masterPasswordValue: masterPassword ? 'exists (not showing actual value)' : null,
    setActivePage: typeof setActivePage,
    externalCardsLength: externalCards.length
  });
  
  // 🚀 PERFORMANCE FIX: Always use external cards from App.jsx (single source of truth)
  // App.jsx manages the real-time Firestore listener - we just display the data
  const cards = externalCards || [];
  const setCards = externalSetCards || (() => {});

  const [showDetails, setShowDetails] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState({});

  // Detailed props debugging - ADD THIS
  console.log('ViewCards: Component rendered with props:', {
    user: user ? { uid: user.uid, email: user.email } : 'null/undefined',
    hasMasterPassword: !!masterPassword,
    hasSetActivePage: typeof setActivePage === 'function',
    hasExternalCards: externalCards.length > 0,
    hasExternalSetCards: typeof externalSetCards === 'function',
    usingInternalState: externalCards.length === 0
  });

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

  // Add console.log to debug
  useEffect(() => {
    console.log('ViewCards: setActivePage prop is:', 
      typeof setActivePage === 'function' ? 'a function' : typeof setActivePage);
  }, [setActivePage]);

  const handleViewDetails = useCallback((cardId) => {
    setShowDetails(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  }, []);

  // Make the handleAddCard function more robust
  const handleAddCard = useCallback((e) => {
    e.preventDefault(); // Add this to prevent any default behavior
    console.log('Add Card clicked'); // Debug log
    
    // Safe fallback if setActivePage is not a function
    if (typeof setActivePage !== 'function') {
      console.error('setActivePage is not a function, trying to navigate manually');
      try {
        // Try to manually change the URL or set state
        window.history.pushState({}, "", "/#addCard");
        window.dispatchEvent(new CustomEvent('urlchange', { detail: { page: 'addCard' } }));
        return;
      } catch (err) {
        console.error('Failed to navigate manually:', err);
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
    console.log('Changing page to addCard using setActivePage');
    setActivePage("addCard");
  }, [setActivePage]);

  const handleCopy = useCallback((e, cardNumber, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
      .then(() => {
        setCopyFeedback(prev => ({ ...prev, [cardId]: true }));
        setTimeout(() => {
          setCopyFeedback(prev => ({ ...prev, [cardId]: false }));
        }, 1500);
      });
  }, []);

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


  // 🚀 PERFORMANCE: Prefer pre-decrypted data from App.jsx if available
  const decryptedCards = useMemo(() => {
    if (Array.isArray(preDecrypted)) {
      return preDecrypted;
    }
    // Fallback: minimal mapping without decryption (should rarely happen)
    return (cards || []).map((card) => ({
      id: card.id,
      theme: card.theme || "#6a3de8",
      cardName: 'Card',
      bankName: 'Bank',
      networkName: 'Card',
      cardNumber: '••••••••••••••••',
      cardHolder: 'Card Holder',
      cvv: '•••',
      expiry: 'MM/YY',
    }));
  }, [preDecrypted, cards]);

  if (loading) {
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
        {decryptedCards.map((card) => {
          const isShowingDetails = showDetails[card.id];

          return (
            <div key={card.id} className="group">
              <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden">
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
                <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                
                {/* Subtle Pattern Overlay */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between z-10">
                  {/* Timer when showing details */}
                  {isShowingDetails && <CountdownTimer />}

                  {/* Top Section */}
                  <div className="flex justify-between items-start">
                    <div className="h-6 w-24 opacity-90">
                      <LogoWithFallback
                        logoName={card.bankName}
                        logoType="bank"
                        className="h-full w-full object-contain object-left"
                      />
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      {card.cardName}
                    </div>
                  </div>

                  {/* Middle Section - Card Number/Details */}
                  <div className="relative flex flex-col items-center justify-center h-20">
                    {/* Card Number with Copy */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2
                      transition-all duration-300 ${
                      isShowingDetails ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
                    }`}>
                      <div className="text-base sm:text-lg md:text-xl text-white font-light tracking-wider font-mono text-center whitespace-nowrap overflow-hidden">
                        {card.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
                      </div>
                      <button
                        onClick={(e) => handleCopy(e, card.cardNumber, card.id)}
                        className="bg-white/5 hover:bg-white/10 p-2 rounded-lg
                          transition-colors relative z-20 cursor-pointer
                          md:opacity-0 md:group-hover:opacity-100"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <BiCopy className="w-4 h-4 text-white/70 hover:text-white" />
                        {copyFeedback[card.id] && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 
                            bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/90
                            border border-white/10 whitespace-nowrap z-30"
                          >
                            Copied!
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {/* CVV/Expiry Section */}
                    <div className={`absolute inset-0 flex items-center justify-center
                      transition-all duration-300 ${
                      isShowingDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">CVV</span>
                          <span className="font-mono text-lg text-white/90">{card.cvv}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Expires</span>
                          <span className="font-mono text-lg text-white/90">{card.expiry}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex items-end justify-between">
                    <p className="text-white text-sm font-medium tracking-wide">
                      {card.cardHolder}
                    </p>
                    <div className="h-10 w-16">
                      <LogoWithFallback
                        logoName={card.networkName}
                        logoType="network"
                        className="h-full w-full object-contain object-right"
                      />
                    </div>
                  </div>

                  {/* Smaller Toggle Button */}
                  <button
                    onClick={() => setShowDetails(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2
                      transition-all duration-200 px-3 py-1.5 rounded-lg 
                      bg-white/10 backdrop-blur-md border border-white/20 
                      text-white text-xs font-medium hover:bg-white/20
                      md:opacity-0 md:group-hover:opacity-100"
                  >
                    {isShowingDetails ? 'Hide' : 'Show Details'}
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
