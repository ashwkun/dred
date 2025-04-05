import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-9yZNPFFsjG8JR5t9i6ZbYZ9FnbZegw8",
  authDomain: "dred-e6e59.firebaseapp.com",
  projectId: "dred-e6e59",
  storageBucket: "dred-e6e59.firebasestorage.app",
  messagingSenderId: "901054214672",
  appId: "1:901054214672:web:d29954f1846e1b337d1095"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth & Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with error handling
const db = getFirestore(app);

// For error handling, add a global error handler for Firebase operations
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.code && event.reason.code.startsWith('firestore/')) {
    console.error('Firestore error:', event.reason);
    // Prevent the error from crashing the app
    event.preventDefault();
  }
});

export { db };
