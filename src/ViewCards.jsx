// ViewCards.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import LogoWithFallback from "./LogoWithFallback";
import { securityManager } from "./utils/security";

function ViewCards({ user, masterPassword, setActivePage }) {
  const [cards, setCards] = useState([]);
  const [showDetails, setShowDetails] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "cards"),
        where("uid", "==", user.uid)
      );
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          try {
            let newCards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            
            // Sort cards with fallback
            newCards.sort((a, b) => {
              if (a.priority !== undefined && b.priority !== undefined) {
                return a.priority - b.priority;
              }
              if (a.createdAt && b.createdAt) {
                return b.createdAt.seconds - a.createdAt.seconds;
              }
              return 0;
            });

            setCards(newCards);
            setLoading(false);
          } catch (error) {
            console.error("Error processing cards:", error);
            setError("Error loading cards. Please try refreshing.");
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error loading cards:", error);
          setError("Error loading cards. Please try refreshing.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up cards listener:", error);
      setError("Error loading cards. Please try refreshing.");
      setLoading(false);
    }
  }, [user?.uid]);

  const decryptField = (encryptedValue) => {
    try {
      if (!encryptedValue) return '';
      return securityManager.decryptData(encryptedValue, masterPassword);
    } catch (error) {
      console.error('Error decrypting field:', error);
      return '';
    }
  };

  const handleViewDetails = (cardId) => {
    setShowDetails(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleAddCard = () => {
    if (setActivePage) {
      setActivePage("addCard");
    }
  };

  // Timer countdown component
  const CountdownTimer = ({ duration = 5000 }) => {
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
      }, 50);

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
      </div>
    );
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => {
          const decryptedTheme = decryptField(card.theme);
          const decryptedBankName = decryptField(card.bankName);
          const decryptedNetworkName = decryptField(card.networkName);
          const decryptedCardType = decryptField(card.cardType);
          const decryptedCardNumber = decryptField(card.cardNumber);
          const decryptedCardHolder = decryptField(card.cardHolder);
          const decryptedCVV = decryptField(card.cvv);
          const decryptedExpiry = decryptField(card.expiry);
          const isShowingDetails = showDetails[card.id];

          return (
            <div key={card.id} className="group">
              <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden">
                {/* Theme Background with reduced opacity */}
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{ 
                    background: decryptedTheme,
                    opacity: 0.15,
                  }}
                />

                {/* Glassmorphic Layers */}
                <div className="absolute inset-0 backdrop-blur-md bg-white/5" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]" />

                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  {/* Timer when showing details */}
                  {isShowingDetails && <CountdownTimer />}

                  {/* Top Section */}
                  <div className="flex justify-between items-start">
                    <div className="h-8 w-32 opacity-90">
                      <LogoWithFallback
                        logoName={decryptedBankName}
                        logoType="bank"
                        className="h-full w-full object-contain object-left"
                      />
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      {decryptedCardType}
                    </div>
                  </div>

                  {/* Middle Section - Card Number/Details */}
                  <div className="relative flex items-center justify-center h-16">
                    <div className={`absolute inset-0 flex items-center justify-center
                      transition-all duration-300 ${
                      isShowingDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                    }`}>
                      <div className="text-xl md:text-2xl text-white font-light tracking-wider font-mono">
                        {decryptedCardNumber.replace(/(.{4})/g, "$1 ").trim()}
                      </div>
                    </div>
                    
                    {/* CVV/Expiry with Fade Animation */}
                    <div className={`absolute inset-0 flex items-center justify-center
                      transition-all duration-300 ${
                      isShowingDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">CVV</span>
                          <span className="font-mono text-lg text-white/90">{decryptedCVV}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Expires</span>
                          <span className="font-mono text-lg text-white/90">{decryptedExpiry}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex items-end justify-between">
                    <p className="text-white text-sm font-medium tracking-wide">
                      {decryptedCardHolder}
                    </p>
                    <div className="h-10 w-16">
                      <LogoWithFallback
                        logoName={decryptedNetworkName}
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
            group"
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
