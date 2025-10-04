import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import MobileNumberDialog from './components/MobileNumberDialog';
import { BiCreditCard, BiMobile, BiInfoCircle, BiShow, BiHide } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import { securityManager } from './utils/security';
import { toSafeString } from './utils/securePlaintextHelpers';
import { secureWipeString } from './utils/secureCleanup';
import { bankLogos, networkLogos } from './utils/logoMap';
import { SUPPORTED_BILL_PAY_BANKS, hasSupportedBillPayBank } from './utils/bankUtils';
import { motion } from 'framer-motion';
import { usePartialDecrypt } from './hooks/usePartialDecrypt';
import { secureLog } from './utils/secureLogger';

export default function BillPay({ user, masterPassword, showSuccessMessage, cards: encryptedCards = [] }) {
  const [cards, setCards] = useState([]);
  const [supportedCards, setSupportedCards] = useState([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealedUpiIds, setRevealedUpiIds] = useState({}); // Track which UPI IDs are revealed


  // 🔐 TIERED SECURITY: Partial decryption (metadata + last 4 only)
  const { partialCards, isDecrypting } = usePartialDecrypt(encryptedCards, masterPassword);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      secureLog.debug('BillPay: Cleaning up on unmount');

      // Wipe mobile number
      if (mobileNumber) {
        setMobileNumber('');
      }

      // Clear cards
      setCards([]);
      setSupportedCards([]);
    };
  }, []);

  // Load mobile number and set up cards
  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.uid) {
        secureLog.error('BillPay: User or user.uid is undefined');
        setError('User authentication required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        
        // Load mobile number
        let decryptedMobileNumber = '';
        const mobileSnapshot = await getDocs(query(
          collection(db, "mobile_numbers"),
          where("uid", "==", user.uid)
        ));
        
        if (!mobileSnapshot.empty) {
          // Decrypt mobile number
          const encryptedNumber = mobileSnapshot.docs[0].data().number;
          try {
            decryptedMobileNumber = await securityManager.decryptData(encryptedNumber, masterPassword);
            setMobileNumber(decryptedMobileNumber);
          } catch (error) {
            secureLog.error("Failed to decrypt mobile number:", error);
            setError("Failed to decrypt mobile number. Please try again.");
          }
        } else {
        }

        // Use partial-decrypted cards from hook (metadata + last 4)
        const cardsData = Array.isArray(partialCards) ? partialCards : [];
        setCards(cardsData);
        
        // Filter supported cards and pre-compute UPI IDs
        const supported = cardsData.filter(card => {
          if (!card.bankName) return false;
          
          // Normalize bank name by removing spaces and converting to lowercase
          const normalizedCardBank = card.bankName.toLowerCase().replace(/\s+/g, '');
          const normalizedSupportedBanks = SUPPORTED_BILL_PAY_BANKS.map(bank => 
            bank.toLowerCase().replace(/\s+/g, '')
          );
          
          const isSupported = normalizedSupportedBanks.some(supportedBank => 
            normalizedCardBank.includes(supportedBank)
          );
          
          return isSupported;
        });
        
        
        // Don't pre-compute full UPI IDs - generate masked versions only
        const supportedWithMaskedUpi = supported.map((card) => ({
          ...card,
          maskedUpiId: decryptedMobileNumber ? getMaskedUpiId(card, decryptedMobileNumber) : null
        }));
        
        setSupportedCards(supportedWithMaskedUpi);
      } catch (error) {
        secureLog.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, masterPassword, partialCards]);

  // Handle mobile number submission
  const handleMobileSubmit = async (number) => {
    
    if (!user || !user.uid) {
      secureLog.error('BillPay: User or user.uid is undefined');
      setError('User authentication required');
      return;
    }
    
    try {
      // Encrypt mobile number before storing (using strong encryption)
      const encryptedNumber = await securityManager.encryptData(number, masterPassword);
      
      // Save to Firestore
      const docRef = doc(collection(db, "mobile_numbers"));
      await setDoc(docRef, {
        uid: user.uid,
        number: encryptedNumber,
        createdAt: new Date()
      });
      
      setMobileNumber(number); // Store decrypted version in state
      setShowMobileDialog(false);
      showSuccessMessage('Mobile number saved successfully!');
      
    } catch (error) {
      secureLog.error('Error saving mobile number:', error);
      setError('Failed to save mobile number. Please try again.');
    }
  };

  // 🔐 Generate MASKED UPI ID (without decrypting full card number - shows only last 4)
  const getMaskedUpiId = (card, mobile) => {
    if (!mobile) return null;
    
    const last4 = card.cardNumberLast4;
    const bankNormalized = (card.bankName || '').toLowerCase().replace(/\s+/g, '');
    
    // Generate masked card number placeholder (12 or 11 bullets depending on Amex)
    const isAmex = card.isAmex || false;
    const maskedLength = isAmex ? 11 : 12;
    const masked = '•'.repeat(maskedLength);
    
    if (bankNormalized.includes('axis')) {
      return `CC.91${mobile}${last4}@axisbank`;
    } else if (bankNormalized.includes('icici')) {
      return `ccpay${masked}${last4}@icici`;
    } else if (bankNormalized.includes('au') || bankNormalized.includes('smallfinance')) {
      return `AUCC${mobile}${last4}@AUBANK`;
    } else if (bankNormalized.includes('idfc')) {
      return `${masked}${last4}.cc@idfcbank`;
    } else if (bankNormalized.includes('amex') || (bankNormalized.includes('american') && bankNormalized.includes('express'))) {
      return `AEBC${masked}${last4}@SC`;
    }
    
    return null;
  };

  // 🔐 Decrypt full card number on-demand (only when generating full UPI ID)
  // Returns SecurePlaintext that will be auto-zeroed
  const decryptFullCardNumber = async (card) => {
    try {
      if (card.cardNumberFirst && card.cardNumberLast4) {
        // Split format: decrypt both parts
        const firstSecure = await securityManager.decryptData(card.cardNumberFirst, masterPassword, true);
        const last4Secure = await securityManager.decryptData(card.cardNumberLast4, masterPassword, true);
        const first = toSafeString(firstSecure, '');
        const last4 = toSafeString(last4Secure, '');
        // Zero the SecurePlaintext after use
        if (firstSecure && firstSecure.zero) firstSecure.zero();
        if (last4Secure && last4Secure.zero) last4Secure.zero();
        return first + last4;
      } else if (card.cardNumberFull) {
        // Legacy: decrypt full card number
        const fullSecure = await securityManager.decryptData(card.cardNumberFull, masterPassword, true);
        const full = toSafeString(fullSecure, '');
        if (fullSecure && fullSecure.zero) fullSecure.zero();
        return full;
      }
      return '';
    } catch (error) {
      secureLog.error('Error decrypting full card number:', error);
      return null;
    }
  };

  // Generate FULL UPI ID for a card (decrypts card number - only call when revealing/paying)
  const getUpiIdForCard = async (card, mobile) => {
    if (!mobile) {
      return null;
    }
    
    const last4 = card.cardNumberLast4;
    const fullCardNumber = await decryptFullCardNumber(card);
    if (!fullCardNumber) {
      return null;
    }
    
    const cardNumber = fullCardNumber.replace(/\s/g, '');
    
    // Normalize bank name for comparison (remove spaces, lowercase)
    const bankNormalized = (card.bankName || '').toLowerCase().replace(/\s+/g, '');
    
    
    if (bankNormalized.includes('axis')) {
      return `CC.91${mobile}${last4}@axisbank`;
    } else if (bankNormalized.includes('icici')) {
      return `ccpay${cardNumber}@icici`;
    } else if (bankNormalized.includes('au') || bankNormalized.includes('smallfinance')) {
      return `AUCC${mobile}${last4}@AUBANK`;
    } else if (bankNormalized.includes('idfc')) {
      return `${cardNumber}.cc@idfcbank`;
    } else if (bankNormalized.includes('amex') || (bankNormalized.includes('american') && bankNormalized.includes('express'))) {
      return `AEBC${cardNumber}@SC`;
    }
    
    return null;
  };

  // Legacy function for backward compatibility (uses state)
  const getUpiId = async (card) => {
    let upiId = null;
    try {
      upiId = await getUpiIdForCard(card, mobileNumber);
      return upiId;
    } finally {
      // SECURE WIPE
      upiId = secureWipeString(upiId);
    }
  };

  // Toggle UPI ID reveal for a specific card
  const toggleUpiReveal = async (cardId, card) => {
    if (revealedUpiIds[cardId]) {
      // Hide
      setRevealedUpiIds(prev => {
        const updated = { ...prev };
        delete updated[cardId];
        return updated;
      });
    } else {
      // Reveal - decrypt full card number and generate full UPI ID
      const fullUpiId = await getUpiIdForCard(card, mobileNumber);
      if (fullUpiId) {
        setRevealedUpiIds(prev => ({ ...prev, [cardId]: fullUpiId }));
      }
    }
  };

  const handlePayBill = async (card, maskedUpiId) => {
    // If UPI is already revealed, use it; otherwise decrypt on-demand
    let upiId = revealedUpiIds[card.id];
    
    if (!upiId) {
      upiId = await getUpiIdForCard(card, mobileNumber);
    }
    
    if (!upiId) {
      setError('Failed to generate UPI ID. Please try again.');
      return;
    }
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=Credit%20Card%20Bill&tn=Credit%20Card%20Bill%20Payment`;
    window.location.href = upiUrl;
    showSuccessMessage('Redirecting to payment app...');
  };

  const getSupportedBankLogo = (bankName) => {
    const normalized = bankName.toLowerCase();
    
    if (normalized.includes('axis')) return bankLogos.axisbank?.symbolSVG;
    if (normalized.includes('icici')) return bankLogos.icicibank?.symbolSVG;
    if (normalized.includes('au')) return bankLogos.ausmallfinancebank?.symbolSVG;
    if (normalized.includes('idfc')) return bankLogos.idfcfirstbank?.symbolSVG;
    if (normalized.includes('amex')) return networkLogos.amex;
    
    return bankLogos.default?.symbolSVG;
  };

  if (loading || isDecrypting) {
    return <LoadingOverlay message="Loading your cards" />;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
            <BiCreditCard className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pay Credit Card Bills</h1>
            <p className="text-white/60 text-sm md:text-base">Pay your credit card bills instantly using UPI</p>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <div className="space-y-4">
        {/* Mobile Number Status */}
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BiMobile className="text-xl text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Registered Mobile</h3>
                <p className="text-white/60 text-sm">
                  {mobileNumber ? 
                    `+91 ${mobileNumber}` : 
                    'No mobile number registered'
                  }
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowMobileDialog(true)}
              className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 
                rounded-xl text-white text-sm font-medium
                transition-all duration-200"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              {mobileNumber ? 'Update Mobile' : 'Add Mobile'}
            </motion.button>
          </div>
        </motion.div>

        {/* Cards Section */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {supportedCards.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-4 
                  flex items-center justify-center">
                  <BiInfoCircle className="text-3xl text-white/70" />
                </div>
                <p className="text-white/70 text-lg">No supported cards found</p>
                <p className="text-white/50 mt-2">Add a credit card from a supported bank</p>
              </div>
              
              {/* Supported Banks Section - Only showing logos */}
              <div className="mt-8">
                <h3 className="text-white text-center mb-4 font-medium">Supported Banks</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {SUPPORTED_BILL_PAY_BANKS.map((bank, index) => {
                    const logoKey = bank.toLowerCase().replace(/\s+/g, '');
                    let logoSrc;
                    
                    if (logoKey.includes('amex')) {
                      logoSrc = networkLogos.amex;
                    } else {
                      const normalizedKey = logoKey.includes('icici') ? 'icicibank' : 
                                      logoKey.includes('axis') ? 'axisbank' :
                                      logoKey.includes('au') ? 'ausmallfinancebank' :
                                      logoKey.includes('idfc') ? 'idfcfirstbank' : null;
                      
                      logoSrc = normalizedKey && bankLogos[normalizedKey] ? 
                                bankLogos[normalizedKey].symbolSVG : 
                                bankLogos.default.symbolSVG;
                    }
                                        
                    return (
                      <motion.div 
                        key={index} 
                        className="flex flex-col items-center p-4 bg-white/5 rounded-xl"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <img 
                          src={logoSrc} 
                          alt={bank} 
                          className="h-12 w-12 object-contain"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {supportedCards.map((card, idx) => {
                // Use revealed UPI ID if available, otherwise show masked
                const upiId = revealedUpiIds[card.id] || card.maskedUpiId;
                const isRevealed = !!revealedUpiIds[card.id];
                
                // Show the card even if UPI ID can't be generated yet
                const last4 = card.cardNumberLast4;
                
                // Theme is already plain text from partial decryption
                const cardTheme = card.theme || "#6a3de8";

                return (
                  <motion.div 
                    key={card.id} 
                    className="relative overflow-hidden rounded-2xl border border-white/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                  >
                    {/* Theme Layers */}
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        background: cardTheme,
                        opacity: 0.4,
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        background: `linear-gradient(120deg, ${cardTheme}, transparent)`,
                        opacity: 0.3,
                      }}
                    />
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/5" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]" />

                    {/* Card Content */}
                    <div className="relative p-4">
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">
                              {card.bankName}
                            </h3>
                            <span className="text-white/40 text-sm">•••• {last4}</span>
                          </div>
                          
                          <p className="text-white/60 text-sm">{card.networkName}</p>
                          
                          {/* UPI ID or Missing Mobile Number Message */}
                          <div className="flex items-center gap-2">
                            {upiId ? (
                              <>
                                <div className="flex-1 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg">
                                  <p className="text-white/70 text-xs font-mono">{upiId}</p>
                                </div>
                                {/* Eye icon to reveal/hide full UPI ID */}
                                <motion.button
                                  onClick={() => toggleUpiReveal(card.id, card)}
                                  className="p-2 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title={isRevealed ? "Hide full UPI ID" : "Reveal full UPI ID"}
                                >
                                  {isRevealed ? (
                                    <BiHide className="w-4 h-4 text-white/70" />
                                  ) : (
                                    <BiShow className="w-4 h-4 text-white/70" />
                                  )}
                                </motion.button>
                              </>
                            ) : (
                              <div className="px-3 py-1.5 bg-red-500/10 backdrop-blur-sm rounded-lg">
                                <p className="text-red-300/80 text-xs">Add mobile number to enable payments</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Pay Button - Only enable if UPI ID is available */}
                        <motion.button
                          onClick={() => upiId && handlePayBill(card, card.maskedUpiId)}
                          className={`w-full px-4 py-2.5 
                            rounded-xl text-white font-medium flex items-center justify-center gap-2
                            border border-white/10 backdrop-blur-sm
                            ${upiId 
                              ? 'bg-white/10 hover:bg-white/20 transition-all duration-200' 
                              : 'bg-white/5 opacity-50 cursor-not-allowed'
                            }`}
                          whileHover={upiId ? { 
                            scale: 1.02, 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          } : {}}
                          whileTap={upiId ? { scale: 0.98 } : {}}
                        >
                          Pay Bill
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Error message display */}
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-white/90">{error}</p>
          </motion.div>
        )}

        {/* Mobile Number Dialog */}
        <MobileNumberDialog
          isOpen={showMobileDialog}
          onClose={() => setShowMobileDialog(false)}
          onSubmit={handleMobileSubmit}
          initialValue={mobileNumber || ''}
        />
      </div>
    </motion.div>
  );
} 