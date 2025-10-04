import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { secureLog } from './utils/secureLogger';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-9yZNPFFsjG8JR5t9i6ZbYZ9FnbZegw8",
  authDomain: "dred-e6e59.firebaseapp.com",
  projectId: "dred-e6e59",
  storageBucket: "dred-e6e59.firebasestorage.app",
  messagingSenderId: "901054214672",
  appId: "1:901054214672:web:d29954f1846e1b337d1095"
};

// Initialize Firebase with error handling
let app;
try {
  secureLog.debug("Initializing Firebase with config:", firebaseConfig);
  app = initializeApp(firebaseConfig);
  secureLog.debug("Firebase initialized successfully");
} catch (error) {
  secureLog.error("Error initializing Firebase:", error);
  throw error;
}

// Auth & Provider with error handling
let auth;
try {
  secureLog.debug("Initializing Firebase Auth");
  auth = getAuth(app);
  secureLog.debug("Firebase Auth initialized successfully");
} catch (error) {
  secureLog.error("Error initializing Firebase Auth:", error);
  throw error;
}

export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with error handling
let db;
try {
  secureLog.debug("Initializing Firestore");
  db = getFirestore(app);
  secureLog.debug("Firestore initialized successfully");
} catch (error) {
  secureLog.error("Error initializing Firestore:", error);
  throw error;
}

// Add event listeners for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    secureLog.debug("User is signed in:", user.uid);
  } else {
    secureLog.debug("User is signed out");
  }
});

// For error handling, add a global error handler for Firebase operations
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.code) {
    if (event.reason.code.startsWith('firestore/')) {
      secureLog.error('Firestore error:', event.reason);
      // Prevent the error from crashing the app
      event.preventDefault();
    } else if (event.reason.code.startsWith('auth/')) {
      secureLog.error('Auth error:', event.reason);
      // Prevent the error from crashing the app
      event.preventDefault();
    }
  }
});

export { db, auth };
