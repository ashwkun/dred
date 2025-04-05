import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import binData from "./binData.json";
import CardCustomization from "./CardCustomization";
import { securityManager } from './utils/security';
import { BiAddToQueue } from 'react-icons/bi';
import { LoadingSpinner } from './components/LoadingSpinner';
import { retryOperation } from './utils/firestore';

function AddCard({ user, masterPassword, setActivePage, setShowSuccess }) {
  const [cardHolder, setCardHolder] = useState(user?.displayName || ""); // Editable
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [cardType, setCardType] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [theme, setTheme] = useState("#6a3de8"); // Default theme
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check form validity
  const isFormValid = () => {
    // Check all required fields are filled
    if (!cardNumber || !cardHolder || !bankName || !networkName || !expiry || !cvv || !cardType) {
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
          console.error("User is not defined or missing UID");
          throw new Error("Authentication error. Please refresh and try again.");
        }

        // Check if masterPassword is still valid
        if (!masterPassword) {
          console.error("Master password is not defined");
          throw new Error("Session expired. Please refresh and enter your master password again.");
        }

        const encryptedCard = {
          uid: user.uid,
          cardNumber: CryptoJS.AES.encrypt(cardNumber.replace(/\s/g, ''), masterPassword).toString(),
          cardHolder: CryptoJS.AES.encrypt(cardHolder, masterPassword).toString(),
          bankName: CryptoJS.AES.encrypt(bankName, masterPassword).toString(),
          networkName: CryptoJS.AES.encrypt(networkName, masterPassword).toString(),
          expiry: CryptoJS.AES.encrypt(expiry, masterPassword).toString(),
          cvv: CryptoJS.AES.encrypt(cvv, masterPassword).toString(),
          cardType: cardType,
          theme: theme,
          createdAt: serverTimestamp()
        };

        console.log("Adding card for user:", user.uid);
        await addDoc(collection(db, "cards"), encryptedCard);
      });
      
      setShowSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 2000);

    } catch (error) {
      console.error("Error adding card:", error);
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
    setCardType("");
    setTheme("#6a3de8");
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-6">Card Details</h2>
            
            <form onSubmit={handleAddCard}>
              <div className="space-y-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
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

                  {/* Card Type */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Card Type
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      placeholder="Credit, Debit, Prepaid"
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

                  <button
                    type="submit"
                    className="w-full mt-6 px-6 py-4 bg-primary hover:bg-primary/90 
                      rounded-xl text-white font-medium transition-all duration-200 
                      focus:outline-none focus:ring-2 focus:ring-primary/50 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-lg shadow-primary/25"
                    disabled={isLoading || !isFormValid()}
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
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Preview & Customization */}
        <div className="w-full xl:w-1/2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCard;
