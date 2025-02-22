import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyB-9yZNPFFsjG8JR5t9i6ZbYZ9FnbZegw8",
  authDomain: "dred-e6e59.firebaseapp.com",
  databaseURL: "https://dred-e6e59-default-rtdb.firebaseio.com",
  projectId: "dred-e6e59",
  storageBucket: "dred-e6e59.firebasestorage.app",
  messagingSenderId: "901054214672",
  appId: "1:901054214672:web:d29954f1846e1b337d1095",
  measurementId: "G-EF02PJPN5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize App Check only in production
if (process.env.NODE_ENV === 'production') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LctO98qAAAAAAWtEZkaC-BL_xqYUrt83JDwN_bI'), // reCAPTCHA v3 site key
    isTokenAutoRefreshEnabled: true
  });
} else {
  console.log('App Check disabled in development');
}

// Auth & Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Auth with persistence and security settings
auth.settings = {
  appVerificationDisabledForTesting: process.env.NODE_ENV === 'development'
};

// Initialize Firestore with cache enabled
const db = initializeFirestore(app, {
  cache: {
    sizeBytes: 100 * 1024 * 1024 // 100MB cache size
  }
});

export { app, analytics, auth, googleProvider, db };
