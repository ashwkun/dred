import React, { useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import CryptoJS from 'crypto-js';
import CardCustomization from './CardCustomization';
import { BiCreditCard, BiChevronRight } from 'react-icons/bi';

export default function AddCard({ user, masterPassword, setActivePage, setShowSuccess }) {
  const [step, setStep] = useState(1);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
    bankName: '',
    networkName: '',
    cardType: '',
    theme: 'default'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Card number formatting and validation
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Expiry date formatting
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value);
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    setError('');
  };

  const validateCard = () => {
    if (!cardDetails.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardDetails.cardHolder) {
      setError('Please enter the card holder name');
      return false;
    }
    if (!cardDetails.expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
      setError('Please enter a valid CVV');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCard()) {
      setStep(2);
    }
  };

  const handleSubmit = async (customization) => {
    try {
      setLoading(true);
      setError('');

      // Encrypt sensitive data
      const encryptedCard = {
        cardNumber: CryptoJS.AES.encrypt(cardDetails.cardNumber, masterPassword).toString(),
        cardHolder: CryptoJS.AES.encrypt(cardDetails.cardHolder, masterPassword).toString(),
        expiry: CryptoJS.AES.encrypt(cardDetails.expiry, masterPassword).toString(),
        cvv: CryptoJS.AES.encrypt(cardDetails.cvv, masterPassword).toString(),
        bankName: CryptoJS.AES.encrypt(customization.bankName, masterPassword).toString(),
        networkName: customization.networkName,
        cardType: CryptoJS.AES.encrypt(customization.cardType, masterPassword).toString(),
        theme: customization.theme,
        uid: user.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, "cards"), encryptedCard);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActivePage("viewCards");
      }, 2000);
    } catch (error) {
      console.error('Error adding card:', error);
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <CardCustomization 
        onBack={() => setStep(1)}
        onSubmit={handleSubmit}
        cardNumber={cardDetails.cardNumber}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 text-white mb-6">
        <BiCreditCard className="text-2xl" />
        <h1 className="text-2xl font-bold">Add New Card</h1>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={cardDetails.cardNumber}
              onChange={handleInputChange}
              maxLength="19"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                text-white placeholder-white/50 focus:outline-none focus:border-white/20"
              placeholder="1234 5678 9012 3456"
            />
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Card Holder Name
            </label>
            <input
              type="text"
              name="cardHolder"
              value={cardDetails.cardHolder}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                text-white placeholder-white/50 focus:outline-none focus:border-white/20"
              placeholder="JOHN DOE"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                name="expiry"
                value={cardDetails.expiry}
                onChange={handleInputChange}
                maxLength="5"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white placeholder-white/50 focus:outline-none focus:border-white/20"
                placeholder="MM/YY"
              />
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                CVV
              </label>
              <input
                type="password"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                maxLength="4"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white placeholder-white/50 focus:outline-none focus:border-white/20"
                placeholder="123"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}

          <button
            onClick={handleNext}
            className="w-full mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 
              rounded-xl text-white font-medium transition-all flex items-center 
              justify-center gap-2"
          >
            Continue to Customization
            <BiChevronRight className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
