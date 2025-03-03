import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

// Initialize Firestore
const db = getFirestore(app);

// Diagnose Firebase connection
export const checkFirebaseConnection = async (userId) => {
  if (!userId) {
    console.error("No user ID provided to check connection");
    return { success: false, error: "No user ID provided" };
  }
  
  try {
    console.log("Checking Firebase connection for user:", userId);
    
    // First check authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No authenticated user found");
      return { success: false, error: "Not authenticated" };
    }
    
    // Refresh token
    try {
      const token = await currentUser.getIdToken(true);
      console.log("Authentication token refreshed successfully");
    } catch (tokenError) {
      console.error("Failed to refresh token:", tokenError);
      return { success: false, error: "Token refresh failed" };
    }
    
    // Try accessing a document
    try {
      const docRef = doc(db, "user_settings", userId);
      const docSnap = await getDoc(docRef);
      console.log("Database access result:", docSnap.exists() ? "Document exists" : "No document");
      return { 
        success: true, 
        docExists: docSnap.exists(),
        userId: userId,
        currentAuthUserId: currentUser.uid
      };
    } catch (dbError) {
      console.error("Database access error:", dbError);
      return { success: false, error: dbError.message };
    }
  } catch (error) {
    console.error("General Firebase connection error:", error);
    return { success: false, error: error.message };
  }
};

export { db };
