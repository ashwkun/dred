// ViewCards.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import LogoWithFallback from "./LogoWithFallback";
import { securityManager } from "./utils/security";

const styleConfig = {
  // Container for each card - add position relative for hover context
  cardWrapper: {
    position: 'relative',
    width: 'fit-content',
    margin: '16px',
    zIndex: 10, // Lower than the header/footer
  },
  cardContainer: {
    width: '100%',
    maxWidth: '384px',
    height: '224px',
    margin: '0 auto',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  // Bank logo position & size
  bankLogoStyle: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    width: '84px',
    height: '36px',
  },
  // Card name (top right)
  cardNameStyle: {
    position: 'absolute',
    top: '10px',
    right: '16px',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: '0.025em',
  },
  // Middle container for card number or CVV/expiry
  middleContainerStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '0 16px',
  },
  cardNumberTextStyle: {
    fontSize: '22px',
    letterSpacing: '0.1em',
    textAlign: 'center',
    fontWeight: '500',
  },
  cvvExpiryTextStyle: {
    fontSize: '18px',
    letterSpacing: '0.05em',
    textAlign: 'center',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  cardHolderStyle: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    letterSpacing: '0.025em',
  },
  buttonStyle: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'white',
    cursor: 'pointer',
    textAlign: 'center',
  },
  networkLogoStyle: {
    position: 'absolute',
    bottom: '5px',
    right: '16px',
    width: '70px',
    height: '50px',
  },
};

// Grid container for the cards
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '24px',
  width: '100%',
  maxWidth: '1200px',
  margin: '24px auto',
  padding: '0 8px',
};

function ViewCards({ user, masterPassword }) {
  const [cards, setCards] = useState([]);
  const [showDetails, setShowDetails] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="md:pb-0 mb-16 md:mb-0">
      <div style={gridContainerStyle}>
        {cards.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'gray' }}>No saved cards yet.</p>
        ) : (
          cards.map((card) => {
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
              <div 
                key={card.id} 
                className="card-wrapper"
              >
                <div style={{ ...styleConfig.cardContainer }}>
                  {/* Base theme color with reduced opacity */}
                  <div 
                    style={{ 
                      position: 'absolute',
                      inset: 0,
                      background: decryptedTheme,
                      opacity: 0.3,
                    }} 
                  />

                  {/* Glass overlay */}
                  <div 
                    style={{ 
                      position: 'absolute',
                      inset: 0,
                      backdropFilter: 'blur(8px)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                    }} 
                  />

                  {/* Card content */}
                  <div style={{ 
                    position: 'relative', 
                    height: '100%',
                  }}>
                    <div style={styleConfig.bankLogoStyle}>
                      <LogoWithFallback
                        logoName={decryptedBankName}
                        logoType="bank"
                        style={{
                          width: styleConfig.bankLogoStyle.width,
                          height: styleConfig.bankLogoStyle.height,
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    <div style={styleConfig.cardNameStyle}>{decryptedCardType}</div>

                    <div style={styleConfig.middleContainerStyle}>
                      {isShowingDetails ? (
                        <div style={styleConfig.cvvExpiryTextStyle}>
                          <p>CVV: {decryptedCVV}</p>
                          <p>Expiry: {decryptedExpiry}</p>
                        </div>
                      ) : (
                        <div style={styleConfig.cardNumberTextStyle}>
                          {decryptedCardNumber.replace(/(.{4})/g, "$1 ").trim()}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={styleConfig.cardHolderStyle}>
                        <span style={{ fontSize: '14px' }}>{decryptedCardHolder}</span>
                      </div>

                      <button
                        onClick={() => setShowDetails((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                        style={styleConfig.buttonStyle}
                      >
                        {isShowingDetails ? "Hide Details" : "Show CVV/Expiry"}
                      </button>

                      <div style={styleConfig.networkLogoStyle}>
                        <LogoWithFallback
                          logoName={decryptedNetworkName}
                          logoType="network"
                          style={{
                            width: styleConfig.networkLogoStyle.width,
                            height: styleConfig.networkLogoStyle.height,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ViewCards;
