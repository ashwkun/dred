import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import binData from "./binData.json";
import CardCustomization from "./CardCustomization";
import { securityManager } from './utils/security';
import { BiAddToQueue } from 'react-icons/bi';
import { LoadingSpinner } from './components/LoadingSpinner';
import CardScannerComponent from './components/CardScanner';
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
  const [status, setStatus] = useState(""); // Track error, success, or loading status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Add authentication check as a separate effect to run only once
  useEffect(() => {
    console.log("AddCard: Initial render with props:", { 
      userExists: !!user, 
      userId: user?.uid, 
      hasMasterPassword: !!masterPassword 
    });
    
    // Only redirect if we've verified auth is missing
    if (authChecked) {
      if (!user) {
        console.error("AddCard: No user after auth check, redirecting to viewCards");
        setActivePage("viewCards");
        return;
      }
      
      if (!masterPassword) {
        console.error("AddCard: No master password after auth check, redirecting to viewCards");
        setActivePage("viewCards");
        return;
      }
    }
  }, [authChecked, user, masterPassword, setActivePage]);
  
  // Separate effect to do token refresh and mark auth as checked
  useEffect(() => {
    if (user && masterPassword) {
      // If we have both user and masterPassword, refresh token
      user.getIdToken(true)
        .then(token => {
          console.log("AddCard: Authentication token refreshed successfully");
          setAuthChecked(true);
        })
        .catch(error => {
          console.error("AddCard: Error refreshing token:", error);
          setAuthChecked(true);
        });
    } else {
      // Still mark auth as checked even if missing credentials
      setAuthChecked(true);
    }
  }, [user, masterPassword]);

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

  const handleScanComplete = (cardData) => {
    // Format card number with spaces
    const formattedNumber = cardData.number.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formattedNumber);
    
    // Format expiry if present (MM/YY)
    if (cardData.expiry) {
      const cleanExpiry = cardData.expiry.replace(/[^\d]/g, '');
      const formattedExpiry = `${cleanExpiry.slice(0,2)}/${cleanExpiry.slice(2)}`;
      setExpiry(formattedExpiry);
    }
    
    // Set name if present
    if (cardData.name) {
      setCardHolder(cardData.name);
    }
    
    // Set card type if detected
    if (cardData.type) {
      setCardType(cardData.type);
    }

    // Auto-detect bank and network based on card number
    detectCardDetails(cardData.number);
  };

  const handleAddCard = async (e) => {
    // Prevent form default submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setIsLoading(true);
    setError(null);
    setStatus(""); // Clear any previous status

    try {
      await retryOperation(async () => {
        // Validate required fields
        if (!cardNumber || !cardHolder || !bankName || !networkName || !expiry || !cvv) {
          setStatus("error");
          throw new Error("Please fill in all required fields");
        }

        // Validate card number format - now allows 15 or 16 digits
        if (!/^\d{15,16}$/.test(cardNumber.replace(/\s/g, ''))) {
          setStatus("error");
          throw new Error("Please enter a valid 15 or 16-digit card number");
        }

        // Validate expiry format (MM/YY)
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) {
          setStatus("error");
          throw new Error("Please enter expiry in MM/YY format");
        }

        // Validate CVV format - now allows 3 or 4 digits
        if (!/^\d{3,4}$/.test(cvv)) {
          setStatus("error");
          throw new Error("Please enter a valid CVV (3 or 4 digits)");
        }

        const encryptedCard = {
          uid: user.uid,
          cardNumber: CryptoJS.AES.encrypt(cardNumber, masterPassword).toString(),
          cardHolder: CryptoJS.AES.encrypt(cardHolder, masterPassword).toString(),
          bankName: CryptoJS.AES.encrypt(bankName, masterPassword).toString(),
          networkName: CryptoJS.AES.encrypt(networkName, masterPassword).toString(),
          expiry: CryptoJS.AES.encrypt(expiry, masterPassword).toString(),
          cvv: CryptoJS.AES.encrypt(cvv, masterPassword).toString(),
          cardType: cardType,
          theme: theme,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "cards"), encryptedCard);
        console.log("Card added successfully to Firestore");
      });
      
      console.log("Card added successfully, showing success message");
      // Only use the App.jsx global success animation
      setShowSuccess(true);
      
      // Reset form after delay but stay on the same page
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        console.log("Form reset after successful card addition");
      }, 2000);

    } catch (error) {
      console.error("Error adding card:", error);
      setStatus("error");
      setError(error.message || "Failed to add card. Please try again.");
    } finally {
      setIsLoading(false);
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
      {/* Error Dialog */}
      {error && status === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setError(null)}></div>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md z-10 border border-red-500/50 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 text-xl">❌</span>
              </div>
              <h3 className="text-lg font-medium text-white">Validation Error</h3>
            </div>
            <p className="text-white/80 mb-6">{error}</p>
            <button 
              className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors"
              onClick={() => {
                setError(null);
                setStatus("");
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Success Dialog is removed */}

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
            
            <form onSubmit={(e) => handleAddCard(e)}>
              <div className="space-y-6">
                <CardScannerComponent onScanComplete={handleScanComplete} />
                
                {/* Form Fields */}
                <div className="space-y-4">
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCardNumber(value);
                        detectCardDetails(value);
                      }}
                      placeholder="•••• •••• •••• ••••"
                      required
                    />
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      required
                    />
                  </div>

                  {/* CVV */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        text-white placeholder-white/30 focus:outline-none focus:ring-2 
                        focus:ring-primary/30 focus:border-transparent backdrop-blur-sm
                        transition-all duration-200"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 px-6 py-4 bg-primary hover:bg-primary/90 
                      rounded-xl text-white font-medium transition-all duration-200 
                      focus:outline-none focus:ring-2 focus:ring-primary/50 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-lg shadow-primary/25"
                    disabled={isLoading}
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
