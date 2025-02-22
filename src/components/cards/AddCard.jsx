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
    <div className="relative mb-16 md:mb-0">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
        </div>
      )}

      <div className="min-h-screen py-12 px-4">
        <div className="flex flex-col sm:flex-row gap-8 max-w-5xl mx-auto">
          {/* Left: Form Section */}
          <div className="w-full sm:w-1/2">
            <div className="bg-[#1E1E2F] p-8 rounded-lg shadow-lg text-white">
              <h2 className="section-title">Add New Card</h2>

              {status && (
                <p className={`text-center mb-6 body-text ${status.includes("✅") ? "text-green-400" : "text-red-400"}`}>
                  {status}
                </p>
              )}

              <form onSubmit={handleAddCard} className="w-full space-y-6">
                <div>
                  <label className="label-text">Cardholder Name</label>
                  <input
                    type="text"
                    className="input-style"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                {/* Credit Card Number */}
                <div>
                  <label className="label-text">Credit Card Number</label>
                  <input
                    type="text"
                    className="input-style"
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

                {/* Bank Name & Network (Auto-filled) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Bank Name</label>
                    <input type="text" className="input-style bg-white/10" value={bankName} disabled />
                  </div>
                  <div>
                    <label className="label-text">Network</label>
                    <input type="text" className="input-style bg-white/10" value={networkName} disabled />
                  </div>
                </div>

                {/* Card Type */}
                <div>
                  <label className="label-text">Card Type</label>
                  <input
                    type="text"
                    className="input-style"
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    placeholder="Credit, Debit, Prepaid"
                    required
                  />
                </div>

                {/* Expiry Date & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Expiry Date</label>
                    <input
                      type="text"
                      className="input-style"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">CVV</label>
                    <input
                      type="password"
                      className="input-style"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  Add Card
                </button>
              </form>
            </div>
          </div>

          {/* Right: Live Card Preview & Customization */}
          <div className="w-full sm:w-1/2">
            <CardCustomization
              cardHolder={cardHolder}
              setCardHolder={setCardHolder}
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
