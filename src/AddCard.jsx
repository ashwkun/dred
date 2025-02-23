import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import binData from "./binData.json";
import CardCustomization from "./CardCustomization";
import { securityManager } from './utils/security';

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
    e.preventDefault();
    setIsLoading(true);
    setStatus("");

    try {
      // Get current highest priority
      const q = query(
        collection(db, "cards"),
        where("uid", "==", user.uid),
        orderBy("priority", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      const nextPriority = snapshot.empty ? 0 : (snapshot.docs[0].data().priority || 0) + 1;

      // Clean the data BEFORE encrypting
      const cleanedData = {
        bankName: bankName.trim(),
        networkName: networkName.trim(),
        cardType: cardType.trim(),
        cardHolder: cardHolder.trim(),
        cardNumber: cardNumber.trim(),
        expiry: expiry.trim(),
        cvv: cvv.trim()
      };

      const cardData = {
        uid: user.uid,
        cardHolder: securityManager.encryptData(cleanedData.cardHolder, masterPassword),
        cardNumber: securityManager.encryptData(cleanedData.cardNumber, masterPassword),
        bankName: securityManager.encryptData(cleanedData.bankName, masterPassword),
        networkName: securityManager.encryptData(cleanedData.networkName, masterPassword),
        cardType: securityManager.encryptData(cleanedData.cardType, masterPassword),
        expiry: securityManager.encryptData(cleanedData.expiry, masterPassword),
        cvv: securityManager.encryptData(cleanedData.cvv, masterPassword),
        theme: securityManager.encryptData(theme, masterPassword),
        priority: nextPriority,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "cards"), cardData);

      // Clear sensitive data from memory
      setCardNumber("");
      setCvv("");
      setExpiry("");
      securityManager.clearSensitiveData();

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActivePage("viewCards");
      }, 2000);
    } catch (error) {
      console.error("Error adding card:", error);
      setStatus(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Form */}
        <div className="w-full xl:w-1/2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-6">Card Details</h2>
            
            <form onSubmit={handleAddCard}>
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
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Adding Card...
                    </div>
                  ) : (
                    'Add Card'
                  )}
                </button>
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
