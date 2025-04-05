// App.jsx
import React, { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import MasterPasswordPrompt from "./MasterPasswordPrompt";
import ViewCards from "./ViewCards";
import AddCard from "./AddCard";
import Settings from "./features/settings/Settings";
import logo from "./assets/logo.png";
import { RiAddCircleLine, RiCreditCardLine } from 'react-icons/ri';
import { BiCreditCard, BiAddToQueue, BiWallet as BiBillPay, BiCog, BiLogOut, BiSun, BiMoon } from 'react-icons/bi';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import HowItWorks from "./components/HowItWorks";
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import BillPay from "./BillPay";
import TopBar from "./components/TopBar";
import Dialog from "./components/Dialog";
import { SuccessAnimation } from "./components/SuccessAnimation";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingOverlay } from "./components/LoadingOverlay";

function App() {
  const [user, loading] = useAuthState(auth);
  const [masterPassword, setMasterPassword] = useState(null);
  const [activePage, setActivePage] = useState("viewCards");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Success!");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { currentThemeData } = useTheme();
  const [cards, setCards] = useState([]);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const [mode, setMode] = useState('dark');
  
  // Use useRef instead of closure variable to track current user ID
  const currentUserIdRef = useRef(null);
  // Add a flag to track password entry grace period
  const passwordEntryTimeRef = useRef(null);
  // Add a debounce timeout ref
  const authDebounceRef = useRef(null);
  // Track if we've had at least one auth state
  const hadInitialAuthRef = useRef(false);

  console.log(`App.jsx: Current activePage state: ${activePage}`);

  // Helper function to show success message
  const showSuccessMessage = (message = "Success!") => {
    setSuccessMessage(message);
    setShowSuccess(true);
    // Auto-hide after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Completely rewritten auth state listener using ref and debounce
  useEffect(() => {
    console.log("App.jsx: Setting up auth state listener");
    
    // Set the initial ref value if not already set
    if (!currentUserIdRef.current) {
      currentUserIdRef.current = user?.uid || null;
      console.log(`App.jsx: Initial user ID set to: ${currentUserIdRef.current}`);
    }
    
    const handleAuthStateChange = (authUser) => {
      // Clear any pending debounced auth state handler
      if (authDebounceRef.current) {
        console.log("App.jsx: Clearing previous debounced auth handler");
        clearTimeout(authDebounceRef.current);
      }
      
      // Set a timeout to debounce the auth state change
      authDebounceRef.current = setTimeout(() => {
        const newUserId = authUser?.uid || null;
        const prevUserId = currentUserIdRef.current;
        
        console.log(`App.jsx: Auth state change (debounced): 
          Previous ID: ${prevUserId}, 
          New ID: ${newUserId}, 
          In grace period: ${Boolean(passwordEntryTimeRef.current)}
        `);
        
        // If this is the first auth state after app load, don't reset the password
        if (!hadInitialAuthRef.current) {
          console.log("App.jsx: First auth state change, not resetting password");
          hadInitialAuthRef.current = true;
          currentUserIdRef.current = newUserId;
          return;
        }
        
        // Check if we're in the grace period after password entry (10 seconds)
        const inGracePeriod = passwordEntryTimeRef.current && 
          (Date.now() - passwordEntryTimeRef.current < 10000);
        
        // Only reset password if:
        // 1. The user is changing (not a refresh/reauth of same user)
        // 2. We're not in the grace period after setting a password
        // 3. We're not going from null to a user (initial auth)
        if (prevUserId !== newUserId && 
            !inGracePeriod && 
            prevUserId !== null && 
            newUserId !== prevUserId) {
          console.log("App.jsx: User changed, resetting master password");
          setMasterPassword(null);
        } else {
          console.log(`App.jsx: No need to reset password - same user: ${prevUserId === newUserId}, 
            in grace period: ${inGracePeriod}, 
            initial auth: ${prevUserId === null}`);
        }
        
        // Always update the ref to the current user
        currentUserIdRef.current = newUserId;
      }, 500); // 500ms debounce delay
    };
    
    // Set up the Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    
    // Cleanup function
    return () => {
      console.log("App.jsx: Cleaning up auth state listener");
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }
      unsubscribe();
    };
  }, []); // No dependencies - only run once on mount

  // Add a special handler for master password changes to track them
  useEffect(() => {
    if (masterPassword) {
      console.log("App.jsx: Master password set, starting grace period");
      passwordEntryTimeRef.current = Date.now();
    }
  }, [masterPassword]);

  // Add detailed user debugging logs
  useEffect(() => {
    if (loading) {
      console.log("App.jsx: Auth state is still loading...");
    } else if (user) {
      console.log("App.jsx: User is authenticated:", { uid: user.uid, email: user.email });
    } else {
      console.log("App.jsx: No authenticated user");
    }
  }, [user, loading]);

  // Add session timeout handler
  useEffect(() => {
    // Handle session timeout event (occurs after inactivity)
    const handleSessionTimeout = (e) => {
      console.log("Session timeout detected");
      // Don't sign out immediately if the user is active in the app
      // Instead, check if they've been inactive or are in the middle of an operation
      if (activePage === "addCard" || activePage === "viewCards") {
        console.log("User is active in app, preventing auto-logout");
        // Prevent auto-logout
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Otherwise proceed with signing out
      signOut(auth).then(() => {
        console.log("User signed out due to inactivity");
      });
    };
    
    window.addEventListener('session-timeout', handleSessionTimeout);
    
    // Cleanup 
    return () => {
      window.removeEventListener('session-timeout', handleSessionTimeout);
    };
  }, [activePage]);

  useEffect(() => {
    // Check if app is installed
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSInstalled = window.navigator.standalone === true;
      const isAndroidInstalled = document.referrer.includes('android-app://');
      
      console.log('Install check:', { isStandalone, isIOSInstalled, isAndroidInstalled });
      setIsAppInstalled(isStandalone || isIOSInstalled || isAndroidInstalled);
    };

    checkInstallation();

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      console.log('Install prompt detected');
      setDeferredPrompt(e);
      setIsAppInstalled(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      console.log('Display mode changed:', e.matches);
      setIsAppInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', () => {});
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Add this effect to load cards
  useEffect(() => {
    let unsubscribe = null;
    
    const loadCards = () => {
      if (!user || !masterPassword) {
        console.log("App.jsx: Not loading cards, user or masterPassword is missing", { 
          hasUser: !!user, 
          hasMasterPassword: !!masterPassword 
        });
        return;
      }
      
      console.log("App.jsx: Setting up cards listener for user", user.uid);
      try {
        const q = query(
          collection(db, "cards"),
          where("uid", "==", user.uid)
        );
        
        // Use onSnapshot instead of getDocs for real-time updates
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`App.jsx: Received snapshot with ${snapshot.docs.length} cards from Firestore`);
          
          if (snapshot.empty) {
            console.log("App.jsx: No cards found for this user");
            setCards([]);
            return;
          }
          
          try {
            const cardsData = snapshot.docs.map(doc => {
              try {
                return {
                  ...doc.data(),
                  id: doc.id
                };
              } catch (err) {
                console.error("Error processing card data:", err);
                return { id: doc.id, error: "Failed to process card data" };
              }
            });
            
            console.log(`App.jsx: Setting ${cardsData.length} cards to state`);
            setCards(cardsData);
          } catch (error) {
            console.error('Error processing cards snapshot:', error);
          }
        }, (error) => {
          console.error('Error in cards listener:', error);
        });
      } catch (error) {
        console.error('Error setting up cards listener:', error);
      }
    };

    loadCards();
    
    return () => {
      if (unsubscribe) {
        console.log("App.jsx: Cleaning up cards listener");
        unsubscribe();
      }
    };
  }, [user, masterPassword]); // These are the correct dependencies

  const handleSignOutClick = () => {
    console.log("App.jsx: handleSignOutClick called");
    
    // Show the confirmation dialog
    setDialog({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        console.log("App.jsx: User confirmed sign out, executing...");
        // Clear the master password first
        setMasterPassword(null);
        // Then sign out from Firebase
        try {
          await signOut(auth);
          console.log("App.jsx: Sign out successful");
        } catch (error) {
          console.error("App.jsx: Error signing out:", error);
        } finally {
          // Always close the dialog
          setDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleInstallClick = () => {
    console.log('Install clicked, deferredPrompt:', deferredPrompt);
    if (!deferredPrompt) return;
    setDialog({
      isOpen: true,
      title: 'Install Dred',
      message: 'Install Dred on your device for a better experience and quick access to your cards.',
      confirmText: 'Install',
      cancelText: 'Not Now',
      type: 'default',
      onConfirm: () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('App installed');
          }
          setDeferredPrompt(null);
          setDialog(prev => ({ ...prev, isOpen: false }));
        });
      }
    });
  };

  // In App.jsx, add extra validation to ensure we always have a user ID
  const safeUserId = user?.uid || null;
  console.log("App.jsx user ID:", safeUserId);

  // Add more logging for userId
  useEffect(() => {
    console.log("App.jsx: User changed:", user);
    console.log("App.jsx: User ID is:", user?.uid);
  }, [user]);

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Add an effect to log masterPassword changes
  useEffect(() => {
    console.log("App.jsx: masterPassword state changed:", masterPassword ? "Password is set" : "Password is NOT set");
  }, [masterPassword]);

  // Debug setActivePage
  const changeActivePage = (page) => {
    console.log("App.jsx: Changing active page to:", page);
    setActivePage(page);
  };

  // Add an effect to log when the dialog state changes
  useEffect(() => {
    console.log("App.jsx: Dialog state changed:", { 
      isOpen: dialog.isOpen, 
      title: dialog.title,
      hasConfirmFn: !!dialog.onConfirm 
    });
  }, [dialog]);

  // Get the current gradient based on theme
  const getBgGradient = () => {
    if (currentThemeData) {
      return `bg-gradient-to-br ${currentThemeData.gradient}`;
    }
    return 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900';
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "viewCards":
        return "Your Cards";
      case "addCard":
        return "Add Card";
      case "billPay":
        return "Bill Pay";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingOverlay message="Authenticating..." />;
    }

    if (!user) {
      return <Auth />;
    }

    if (!masterPassword) {
      return <MasterPasswordPrompt onPasswordSubmit={setMasterPassword} />;
    }

    return (
      <>
        {/* TopBar */}
        <TopBar
          title={getPageTitle()}
          user={user}
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          onSignOut={handleSignOutClick}
          onInstall={handleInstallClick}
          isAppInstalled={isAppInstalled}
          deferredPrompt={deferredPrompt}
          mode={mode}
          toggleMode={toggleMode}
        />

        {/* Sidebar (desktop) */}
        <Sidebar
          activePage={activePage}
          setActivePage={changeActivePage}
          cards={cards}
          user={user}
          onSignOut={handleSignOutClick}
          onInstall={handleInstallClick}
          isAppInstalled={isAppInstalled}
          deferredPrompt={deferredPrompt}
        />

        {/* Main Content */}
        <main className="md:pl-72 pt-20 pb-20 min-h-screen">
          {activePage === "viewCards" && (
            <ViewCards
              user={user}
              masterPassword={masterPassword}
              setActivePage={setActivePage}
              setDialog={setDialog}
              showSuccessMessage={showSuccessMessage}
            />
          )}
          {activePage === "addCard" && (
            <AddCard 
              user={user} 
              masterPassword={masterPassword} 
              setActivePage={setActivePage}
              showSuccessMessage={showSuccessMessage}
            />
          )}
          {activePage === "billPay" && (
            <BillPay 
              user={user} 
              masterPassword={masterPassword}
              showSuccessMessage={showSuccessMessage}
            />
          )}
          {activePage === "settings" && (
            <Settings 
              user={user} 
              masterPassword={masterPassword} 
              setDialog={setDialog}
              showSuccessMessage={showSuccessMessage}
            />
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav activePage={activePage} setActivePage={changeActivePage} />
      </>
    );
  };

  // Log dialog renders in the JSX
  const renderDialog = () => {
    if (dialog.isOpen) {
      console.log("App.jsx: Rendering dialog:", dialog.title);
      return (
        <Dialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          onConfirm={dialog.onConfirm}
          onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
          type={dialog.type}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: getBgGradient() }}>
      {/* Render the main app flow */}
      {renderContent()}
      
      {/* Global success animation */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation message={successMessage} />
        )}
      </AnimatePresence>
      
      {/* Dialog component */}
      {renderDialog()}
    </div>
  );
}

export default App;