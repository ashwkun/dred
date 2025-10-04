import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import binData from "./binData.json";
import CardCustomization from "./CardCustomization";
import { securityManager } from './utils/security';
import { BiAddToQueue } from 'react-icons/bi';
import { LoadingSpinner } from './components/LoadingSpinner';
import { retryOperation } from './utils/firestore';
import { motion } from "framer-motion";
import { secureLog } from './utils/secureLogger';

function AddCard({ user, masterPassword, setActivePage, showSuccessMessage }) {
  const [cardHolder, setCardHolder] = useState(user?.displayName || ""); // Editable
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [theme, setTheme] = useState("#6a3de8"); // Default theme
  // Bill tracking (optional)
  const [billTrackingEnabled, setBillTrackingEnabled] = useState(false);
  const [billGenDay, setBillGenDay] = useState(5); // 1-28 recommended
  const [billDueOffsetDays, setBillDueOffsetDays] = useState(15); // default 15
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check form validity
  const isFormValid = () => {
    // Check all required fields are filled
    if (!cardNumber || !cardHolder || !bankName || !networkName || !expiry || !cvv || !cardName) {
      return false;
    }
    
    // Validate card number format (15 or 16 digits for AMEX/others)
    if (!/^\d{15,16}$/.test(cardNumber.replace(/\s/g, ''))) {
      return false;
    }
    
    // Validate expiry format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) {
      return false;
    }
    
    // Validate CVV format (3 or 4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (user?.displayName) {
      setCardHolder(user.displayName); // Auto-fetch Google name but allow editing
    }
  }, [user]);

  const detectCardDetails = (inputNumber) => {
    if (inputNumber.length >= 6) {
      const bin = inputNumber.slice(0, 6);
      const matchedData = binData.find((item) => item?.BIN && String(item.BIN) === bin);
      if (matchedData) {
        setBankName(matchedData.Bank || "Unknown Bank");
        setNetworkName(matchedData.Network || "Unknown Network");
      } else {
        setBankName("");
        setNetworkName("");
      }
    }
  };

  const handleAddCard = async (e) => {
    if (e) e.preventDefault(); // Ensure we prevent default form submission
    setIsLoading(true);
    setError(null);

    // Track user activity - this helps prevent session timeouts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('activity'));
    }

    try {
      await retryOperation(async () => {
        // Validate required fields
        if (!cardNumber || !cardHolder || !bankName || !networkName || !expiry || !cvv) {
          throw new Error("Please fill in all required fields");
        }

        // Validate card number format
        if (!/^\d{15,16}$/.test(cardNumber.replace(/\s/g, ''))) {
          throw new Error("Please enter a valid 15 or 16-digit card number");
        }

        // Validate expiry format (MM/YY)
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) {
          throw new Error("Please enter expiry in MM/YY format");
        }

        // Validate CVV format
        if (!/^\d{3,4}$/.test(cvv)) {
          throw new Error("Please enter a valid CVV");
        }

        // Ensure user is still valid before encrypting
        if (!user || !user.uid) {
          secureLog.error("User is not defined or missing UID");
          throw new Error("Authentication error. Please refresh and try again.");
        }

        // Check if masterPassword is still valid
        if (!masterPassword) {
          secureLog.error("Master password is not defined");
          throw new Error("Session expired. Please refresh and enter your master password again.");
        }

        // 🔐 TIERED SECURITY: Split card number for partial decryption
        const cleanCardNumber = cardNumber.replace(/\s/g, '');

        const encryptedCard = {
          uid: user.uid,
          ...await securityManager.encryptCardNumberSplit(cleanCardNumber, masterPassword),
          isAmex: cleanCardNumber.startsWith('34') || cleanCardNumber.startsWith('37'), // Plain boolean for UI logic
          cardHolder: await securityManager.encryptData(cardHolder, masterPassword),
          bankName: await securityManager.encryptData(bankName, masterPassword),
          networkName: await securityManager.encryptData(networkName, masterPassword),
          expiry: await securityManager.encryptData(expiry, masterPassword),
          cvv: await securityManager.encryptData(cvv, masterPassword),
          cardName: await securityManager.encryptData(cardName, masterPassword),
          theme: theme,
          createdAt: serverTimestamp()
        };

        // Attach bill tracking fields if enabled
        if (billTrackingEnabled) {
          encryptedCard.billGenDay = Number(billGenDay) || 5;
          encryptedCard.billDueOffsetDays = Number(billDueOffsetDays) || 15;
          encryptedCard.lastPaidCycleKey = null;
        }

        secureLog.debug("Adding card for user:", user.uid);
        await addDoc(collection(db, "cards"), encryptedCard);
      });
      
      // Show success message using global function
      showSuccessMessage("Card added successfully!");
      
      // Reset form after delay
      setTimeout(() => {
        resetForm();
      }, 1000);

    } catch (error) {
      secureLog.error("Error adding card:", error);
      setError(error.message || "Failed to add card. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces (4 digits per group)
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    // Special formatting for AMEX (15 digits: 4-6-5)
    if (/^3[47]/.test(digits)) {
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i === 4 || i === 10) formatted += ' ';
        formatted += digits[i];
      }
      return formatted.trim();
    }
    // Standard 16-digit formatting (4-4-4-4)
    else {
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
  };

  const resetForm = () => {
    setCardNumber("");
    setCvv("");
    setExpiry("");
    setBankName("");
    setNetworkName("");
    setTheme("#6a3de8");
    setBillTrackingEnabled(false);
    setBillGenDay(5);
    setBillDueOffsetDays(15);
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <BiAddToQueue className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Card</h1>
          <p className="text-white/60">Securely store your card information</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Form */}
        <div className="w-full xl:w-1/2">
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-medium text-white mb-6">Card Details</h2>
            
            <form onSubmit={handleAddCard}>
              <div className="space-y-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  {error && (
                    <motion.div 
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                  )}
                  {/* Card Holder Name */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name on card"
                      required
                    />
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 bg-white/5 border ${cardNumber && !/^\d{15,16}$/.test(cardNumber.replace(/\s/g, '')) ? 'border-red-400' : 'border-white/10'} rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200`}
                      value={cardNumber}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formattedValue = formatCardNumber(rawValue);
                        setCardNumber(formattedValue);
                        detectCardDetails(rawValue);
                      }}
                      placeholder="•••• •••• •••• ••••"
                      required
                    />
                    {cardNumber && !/^\d{15,16}$/.test(cardNumber.replace(/\s/g, '')) && (
                      <p className="text-red-400 text-xs mt-1">
                        Please enter a valid 15 or 16-digit card number
                      </p>
                    )}
                  </div>

                  {/* Bank */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Bank
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white/50 backdrop-blur-sm cursor-not-allowed"
                      value={bankName}
                      disabled
                    />
                  </div>

                  {/* Network */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Network
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white/50 backdrop-blur-sm cursor-not-allowed"
                      value={networkName}
                      disabled
                    />
                  </div>

                  {/* Card Name */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Card Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Platinum, TATA Neu, My Zone etc"
                      required
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 bg-white/5 border ${expiry && !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry) ? 'border-red-400' : 'border-white/10'} rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200`}
                      value={expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d/]/g, '');
                        if (value.length === 2 && !value.includes('/') && e.nativeEvent.inputType !== 'deleteContentBackward') {
                          value += '/';
                        }
                        setExpiry(value);
                      }}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                    {expiry && !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry) && (
                      <p className="text-red-400 text-xs mt-1">
                        Please enter expiry in MM/YY format
                      </p>
                    )}
                  </div>

                  {/* CVV */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      className={`w-full px-4 py-3 bg-white/5 border ${cvv && !/^\d{3,4}$/.test(cvv) ? 'border-red-400' : 'border-white/10'} rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200`}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      maxLength="4"
                      required
                    />
                    {cvv && !/^\d{3,4}$/.test(cvv) && (
                      <p className="text-red-400 text-xs mt-1">
                        Please enter a valid 3 or 4-digit CVV
                      </p>
                    )}
                  </div>

                  {/* Bill Tracking (Optional) */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-white/80 text-sm font-medium">Enable Bill Tracking</label>
                      <button type="button"
                        onClick={() => setBillTrackingEnabled(!billTrackingEnabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${billTrackingEnabled ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
                      >
                        {billTrackingEnabled ? 'On' : 'Off'}
                      </button>
                    </div>
                    {billTrackingEnabled && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-white/70 text-xs mb-1">Bill Generation Day</label>
                          <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={billGenDay}
                            onChange={(e) => setBillGenDay(Number(e.target.value))}
                          >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-white/70 text-xs mb-1">Due Offset (days)</label>
                          <select
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={billDueOffsetDays}
                            onChange={(e) => setBillDueOffsetDays(Number(e.target.value))}
                          >
                            {Array.from({ length: 16 }, (_, i) => i + 10).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <p className="col-span-2 text-xs text-white/60">Due date will be calculated as: gen day + offset.</p>
                      </div>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full mt-6 px-6 py-4 bg-primary hover:bg-primary/90 
                      rounded-xl text-white font-medium transition-all duration-200 
                      focus:outline-none focus:ring-2 focus:ring-primary/50 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-lg shadow-primary/25"
                    disabled={isLoading || !isFormValid()}
                    whileHover={{ scale: isFormValid() && !isLoading ? 1.02 : 1 }}
                    whileTap={{ scale: isFormValid() && !isLoading ? 0.98 : 1 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="scale-75">
                          <LoadingSpinner size="sm" />
                        </div>
                        <span className="ml-3">Adding Card...</span>
                      </div>
                    ) : (
                      'Add Card'
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right: Preview & Customization */}
        <div className="w-full xl:w-1/2">
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardCustomization
              cardHolder={cardHolder}
              cardNumber={cardNumber}
              bankName={bankName}
              networkName={networkName}
              expiry={expiry}
              cvv={cvv}
              theme={theme}
              setTheme={setTheme}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AddCard;
