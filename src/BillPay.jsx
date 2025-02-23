import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import MobileNumberDialog from './components/MobileNumberDialog';
import CryptoJS from 'crypto-js';
import { BiReceipt, BiCalendar, BiCreditCard } from 'react-icons/bi';

export default function BillPay({ user, masterPassword }) {
  const [cards, setCards] = useState([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [billDetails, setBillDetails] = useState({
    amount: '',
    description: '',
    dueDate: '',
    category: 'utility'
  });

  const categories = [
    { id: 'utility', name: 'Utility Bills', icon: '⚡' },
    { id: 'rent', name: 'Rent/Mortgage', icon: '🏠' },
    { id: 'internet', name: 'Internet/Phone', icon: '📡' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'subscription', name: 'Subscriptions', icon: '📺' },
    { id: 'other', name: 'Other', icon: '📝' }
  ];

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
      <div className="flex items-center gap-3 mb-6">
        <BiReceipt className="text-2xl text-white" />
        <h1 className="text-2xl font-bold text-white">Pay Bills</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Bill Details */}
        <div className="space-y-6">
          {/* Amount & Description */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Bill Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">₹</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                      text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    placeholder="0.00"
                    value={billDetails.amount}
                    onChange={(e) => setBillDetails({ ...billDetails, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                    text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  placeholder="What's this payment for?"
                  value={billDetails.description}
                  onChange={(e) => setBillDetails({ ...billDetails, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setBillDetails({ ...billDetails, category: category.id })}
                  className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3
                    ${billDetails.category === category.id 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-sm text-white font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-medium text-white mb-4">Due Date</h2>
            <div className="flex items-center gap-3">
              <BiCalendar className="text-xl text-white/70" />
              <input
                type="date"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                  text-white focus:outline-none focus:border-white/20"
                value={billDetails.dueDate}
                onChange={(e) => setBillDetails({ ...billDetails, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Payment Method */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BiCreditCard className="text-xl text-white/70" />
              <h2 className="text-lg font-medium text-white">Select Card</h2>
            </div>

            <div className="space-y-3">
              {/* Card selection will go here */}
              <p className="text-white/50 text-center py-8">
                Your saved cards will appear here
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <button
            className="w-full px-6 py-4 bg-primary hover:bg-primary/90 
              rounded-xl text-white font-medium transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-primary/50 
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-primary/25"
            disabled={!selectedCard || !billDetails.amount}
          >
            Pay Bill
          </button>
        </div>
      </div>

      <MobileNumberDialog
        isOpen={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        onSubmit={handleMobileSubmit}
      />
    </div>
  );
} 