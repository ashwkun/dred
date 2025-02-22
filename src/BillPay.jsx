import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import MobileNumberDialog from './components/MobileNumberDialog';
import CryptoJS from 'crypto-js';

export default function BillPay({ user, masterPassword }) {
  const [cards, setCards] = useState([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load mobile number
        const mobileSnapshot = await getDocs(query(
          collection(db, "mobile_numbers"),
          where("uid", "==", user.uid)
        ));
        
        if (!mobileSnapshot.empty) {
          // Decrypt mobile number
          const encryptedNumber = mobileSnapshot.docs[0].data().number;
          const decryptedNumber = CryptoJS.AES.decrypt(encryptedNumber, masterPassword).toString(CryptoJS.enc.Utf8);
          setMobileNumber(decryptedNumber);
        } else {
          setShowMobileDialog(true);
        }

        // Load cards
        const cardsSnapshot = await getDocs(query(
          collection(db, "cards"),
          where("uid", "==", user.uid)
        ));
        
        const cardsData = cardsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8),
          bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
          cardType: CryptoJS.AES.decrypt(doc.data().cardType, masterPassword).toString(CryptoJS.enc.Utf8)
        }));
        
        setCards(cardsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.uid, masterPassword]);

  const handleMobileSubmit = async (number) => {
    try {
      // Encrypt mobile number before storing
      const encryptedNumber = CryptoJS.AES.encrypt(number, masterPassword).toString();
      
      const docRef = doc(collection(db, "mobile_numbers"));
      await setDoc(docRef, {
        uid: user.uid,
        number: encryptedNumber,
        createdAt: new Date()
      });
      
      setMobileNumber(number); // Store decrypted version in state
      setShowMobileDialog(false);
    } catch (error) {
      console.error('Error saving mobile number:', error);
      setError('Failed to save mobile number. Please try again.');
    }
  };

  const getUpiId = (card) => {
    if (!mobileNumber) return null;
    
    const last4 = card.cardNumber.slice(-4);
    const cardNumber = card.cardNumber.replace(/\s/g, '');
    
    switch (card.bankName.toLowerCase()) {
      case 'axis bank':
        return `CC.91${mobileNumber}${last4}@axisbank`;
      case 'icici bank':
        return `ccpay${cardNumber}@icici`;
      case 'au small finance bank':
        return `AUCC${mobileNumber}${last4}@AUBANK`;
      case 'idfc bank':
        return `${cardNumber}.cc@idfcbank`;
      case 'amex':
        return `AEBC${cardNumber}@SC`;
      default:
        return null;
    }
  };

  const handlePayBill = (upiId) => {
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=Credit%20Card%20Bill&tn=Credit%20Card%20Bill%20Payment`;
    window.location.href = upiUrl;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
            <span className="ml-3 text-white/70">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-red-500/20 p-6">
          <div className="text-center text-red-400">
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="text-center text-white/70">
                <p>No supported cards found. Add a credit card to pay bills.</p>
              </div>
            </div>
          ) : (
            cards.map(card => {
              const upiId = getUpiId(card);
              if (!upiId) return null;

              const last4 = card.cardNumber.slice(-4);

              return (
                <div key={card.id} className="bg-white/10 backdrop-blur-lg rounded-xl 
                  border border-white/20 p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-medium">
                      {card.bankName} - {card.cardType}
                    </h3>
                    <p className="text-white/70 text-sm mt-0.5">
                      •••• {last4}
                    </p>
                    <p className="text-white/50 text-xs mt-1.5">
                      UPI: {upiId}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handlePayBill(upiId)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 
                      rounded-xl text-white/80 hover:text-white 
                      transition-all text-sm font-medium"
                  >
                    Pay Bill
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <MobileNumberDialog
        isOpen={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        onSubmit={handleMobileSubmit}
      />
    </div>
  );
} 