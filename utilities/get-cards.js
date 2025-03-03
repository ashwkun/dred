const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const CryptoJS = require('crypto-js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB33k0x03bNqiYP-cUAaWZ4KH3_s_gQoAg",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "dred-6de63.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "dred-e6e59",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dred-6de63.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "514327436507",
  appId: process.env.FIREBASE_APP_ID || "1:514327436507:web:4a3c9d65f6d59d7e65e09f",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-HBLQNTL5PE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Decrypt function
const decryptData = (encryptedData, password) => {
  try {
    return CryptoJS.AES.decrypt(encryptedData, password).toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return "Error decrypting";
  }
};

async function getDecryptedCards() {
  try {
    const masterPassword = 's'; // Encryption key
    const querySnapshot = await getDocs(collection(db, 'cards'));
    const cards = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      try {
        const decryptedBankName = decryptData(data.bankName, masterPassword);
        const decryptedCardNumber = decryptData(data.cardNumber, masterPassword);
        const last4 = decryptedCardNumber.slice(-4);
        
        cards.push({
          id: doc.id,
          bankName: decryptedBankName,
          cardNumber: decryptedCardNumber,
          last4: last4
        });
      } catch (error) {
        console.error(`Error decrypting card ${doc.id}:`, error);
      }
    });
    
    console.log('Decrypted Cards:');
    console.log(JSON.stringify(cards, null, 2));
    
    // Filter for specific banks we need
    const axisCard = cards.find(card => card.bankName === 'Axis Bank');
    const hdfcCard = cards.find(card => card.bankName === 'HDFC Bank');
    const iciciCard = cards.find(card => card.bankName === 'ICICI Bank');
    const amexCard = cards.find(card => card.bankName === 'AMEX');
    
    console.log('\nCards to use for transactions:');
    console.log('Axis Bank:', axisCard ? `${axisCard.id} (${axisCard.last4})` : 'Not found');
    console.log('HDFC Bank:', hdfcCard ? `${hdfcCard.id} (${hdfcCard.last4})` : 'Not found');
    console.log('ICICI Bank:', iciciCard ? `${iciciCard.id} (${iciciCard.last4})` : 'Not found');
    console.log('AMEX:', amexCard ? `${amexCard.id} (${amexCard.last4})` : 'Not found');
    
    return {
      axis: axisCard,
      hdfc: hdfcCard,
      icici: iciciCard,
      amex: amexCard
    };
  } catch (error) {
    console.error('Error getting cards:', error);
    return {};
  }
}

getDecryptedCards(); 