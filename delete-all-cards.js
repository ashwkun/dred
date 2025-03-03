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

// Function to delete all cards from the collection
const deleteAllCards = async () => {
  try {
    console.log('Fetching all cards from the collection...');
    
    // Get all cards
    const querySnapshot = await getDocs(collection(db, 'cards'));
    const totalCards = querySnapshot.size;
    
    console.log(`Found ${totalCards} cards. Deleting...`);
    
    let deletedCount = 0;
    
    // Delete each card
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'cards', docSnapshot.id));
      deletedCount++;
      console.log(`Deleted card ${deletedCount}/${totalCards}: ${docSnapshot.id}`);
    }
    
    console.log(`Successfully deleted all ${deletedCount} cards.`);
  } catch (error) {
    console.error('Error deleting cards:', error);
  }
};

// Run the function
deleteAllCards()
  .then(() => console.log('Operation completed.'))
  .catch(error => console.error('Operation failed:', error)); 