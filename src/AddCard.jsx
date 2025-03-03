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
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add authentication check
  useEffect(() => {
    console.log("AddCard: Authentication check", { 
      userExists: !!user, 
      userId: user?.uid, 
      hasMasterPassword: !!masterPassword 
    });
    
    // Redirect to view cards if not authenticated
    if (!user) {
      console.error("AddCard: No user, redirecting to viewCards");
      setActivePage("viewCards");
      return;
    }
    
    if (!masterPassword) {
      console.error("AddCard: No master password, redirecting to viewCards");
      setActivePage("viewCards");
      return;
    }
    
    // If we get here, we have a user and master password, now refresh the token to ensure fresh authentication
    user.getIdToken(true)
      .then(token => {
        console.log("AddCard: Authentication token refreshed successfully");
      })
      .catch(error => {
        console.error("AddCard: Error refreshing token:", error);
        // Don't redirect here, just log the error
      });
  }, [user, masterPassword, setActivePage]);

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

  const handleAddCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await retryOperation(async () => {
        // Validate required fields
        if (!cardNumber || !cardHolder || !bankName || !networkName || !expiry || !cvv) {
          throw new Error("Please fill in all required fields");
        }

        // Validate card number format
        if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
          throw new Error("Please enter a valid 16-digit card number");
        }

        // Validate expiry format (MM/YY)
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) {
          throw new Error("Please enter expiry in MM/YY format");
        }

        // Validate CVV format
        if (!/^\d{3,4}$/.test(cvv)) {
          throw new Error("Please enter a valid CVV");
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
