import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import MobileNumberDialog from './components/MobileNumberDialog';
import CryptoJS from 'crypto-js';
import { BiCreditCard, BiMobile, BiInfoCircle } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SuccessAnimation } from './components/SuccessAnimation';
import { securityManager } from './utils/security';
import { bankLogos, networkLogos } from './utils/logoMap';
import { SUPPORTED_BILL_PAY_BANKS } from './utils/bankUtils';

export default function BillPay({ user, masterPassword }) {
  const [cards, setCards] = useState([]);
  const [supportedCards, setSupportedCards] = useState([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
          cardType: CryptoJS.AES.decrypt(doc.data().cardType, masterPassword).toString(CryptoJS.enc.Utf8),
          theme: doc.data().theme
        }));
        
        setCards(cardsData);
        
        // Filter supported cards
        const supported = cardsData.filter(card => getUpiId(card) !== null);
        setSupportedCards(supported);
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
      setSuccessMessage('Mobile number updated successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
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

  const getSupportedBankLogo = (bankName) => {
    const normalized = bankName.toLowerCase().replace(/\s+/g, '');
    
    if (normalized === 'axisbank') return bankLogos.axisbank.symbolSVG;
    if (normalized === 'icicibank') return bankLogos.icicibank.symbolSVG;
    if (normalized === 'ausmallfinancebank') return bankLogos.ausmallfinancebank.symbolSVG;
    if (normalized === 'idfcbank' || normalized === 'idfcfirstbank') return bankLogos.idfcfirstbank.symbolSVG;
    if (normalized === 'amex') return networkLogos.amex;
    
    return null;
  };

  if (loading) {
    return <LoadingOverlay message="Loading your cards" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section - Now matches other components with mobile optimization */}
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
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
            <button
              onClick={() => setShowMobileDialog(true)}
              className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 
                rounded-xl text-white text-sm font-medium
                transition-all duration-200"
            >
              {mobileNumber ? 'Update' : 'Add Mobile'}
            </button>
          </div>
        </div>

        {/* Cards Section with improved mobile layout */}
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
            
            {/* Supported Banks Section */}
            <div className="mt-8">
              <h3 className="text-white text-center mb-4 font-medium">Supported Banks</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {SUPPORTED_BILL_PAY_BANKS.map((bank, index) => {
                  const logoKey = bank.toLowerCase().replace(/\s+/g, '');
                  let logoSrc;
                  
                  if (logoKey === 'amex') {
                    logoSrc = networkLogos.amex;
                  } else {
                    const normalizedKey = logoKey === 'icicibank' ? 'icicibank' : 
                                      logoKey === 'axisbank' ? 'axisbank' :
                                      logoKey === 'ausmallfinancebank' ? 'ausmallfinancebank' :
                                      logoKey === 'idfcbank' ? 'idfcfirstbank' : null;
                    
                    logoSrc = normalizedKey ? bankLogos[normalizedKey]?.symbolSVG : bankLogos.default.symbolSVG;
                  }
                                      
                  return (
                    <div key={index} className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
                      <img 
                        src={logoSrc} 
                        alt={bank} 
                        className="h-10 w-10 object-contain mb-2"
                      />
                      <span className="text-white/70 text-xs text-center">{bank}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {supportedCards.map(card => {
              const upiId = getUpiId(card);
              if (!upiId) return null;

              const last4 = card.cardNumber.slice(-4);
              const decryptedTheme = securityManager.decryptData(card.theme, masterPassword);

              return (
                <div 
                  key={card.id} 
                  className="relative overflow-hidden rounded-2xl border border-white/20"
                >
                  {/* Theme Layers */}
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: decryptedTheme,
                      opacity: 0.4,
                    }}
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(120deg, ${decryptedTheme}, transparent)`,
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
                        
                        <p className="text-white/60 text-sm">{card.cardType}</p>
                        
                        {/* UPI ID */}
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg">
                            <p className="text-white/70 text-xs font-mono">{upiId}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pay Button */}
                      <button
                        onClick={() => handlePayBill(upiId)}
                        className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 
                          rounded-xl text-white font-medium
                          transition-all duration-200 flex items-center justify-center gap-2
                          border border-white/10 backdrop-blur-sm"
                      >
                        Pay Bill
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Number Dialog */}
      {showMobileDialog && (
        <MobileNumberDialog 
          onClose={() => setShowMobileDialog(false)}
          onSubmit={handleMobileSubmit}
          currentNumber={mobileNumber}
        />
      )}

      {/* Success Animation */}
      {showSuccess && (
        <SuccessAnimation message={successMessage} />
      )}
    </div>
  );
} 