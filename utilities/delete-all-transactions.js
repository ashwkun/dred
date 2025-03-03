const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function deleteAllTransactions() {
  try {
    // Get all transactions 
    console.log("Fetching all transactions...");
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const transactionsCount = querySnapshot.docs.length;
    
    if (transactionsCount === 0) {
      console.log("No transactions found to delete.");
      return;
    }
    
    console.log(`Found ${transactionsCount} transactions. Starting deletion...`);
    
    let deletedCount = 0;
    
    // Delete each transaction
    for (const document of querySnapshot.docs) {
      try {
        await deleteDoc(doc(db, "transactions", document.id));
        deletedCount++;
        
        if (deletedCount % 100 === 0 || deletedCount === transactionsCount) {
          console.log(`Deleted ${deletedCount}/${transactionsCount} transactions...`);
        }
      } catch (error) {
        console.error(`Error deleting transaction ${document.id}:`, error);
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} out of ${transactionsCount} transactions.`);
  } catch (error) {
    console.error("Error in deleteAllTransactions:", error);
  }
}

// Execute the function
deleteAllTransactions(); 