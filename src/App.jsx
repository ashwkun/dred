// App.jsx
import React, { useEffect, useState, useRef, lazy, Suspense, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import MasterPasswordPrompt from "./MasterPasswordPrompt";
import logo from "./assets/logo.png";
import { RiAddCircleLine, RiCreditCardLine } from 'react-icons/ri';
import { BiCreditCard, BiAddToQueue, BiWallet as BiBillPay, BiCog, BiLogOut, BiSun, BiMoon } from 'react-icons/bi';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import TopBar from "./components/TopBar";
import Dialog from "./components/Dialog";
import { SuccessAnimation } from "./components/SuccessAnimation";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from 'framer-motion';
import { securityManager } from "./utils/security";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { secureWipeArray } from './utils/secureCleanup';
// Import new theme components
import ThemePatterns from "./components/ThemePatterns";
import { ThemedLoading, ThemedLoadingOverlay } from "./components/LoadingAnimations";
import { secureLog } from './utils/secureLogger';

// 🚀 PERFORMANCE: Lazy load heavy components for code splitting
const ViewCards = lazy(() => import("./ViewCards"));
const AddCard = lazy(() => import("./AddCard"));
const Settings = lazy(() => import("./features/settings/Settings"));
const BillPay = lazy(() => import("./BillPay"));
const SecurityInfo = lazy(() => import("./components/SecurityInfo"));
const TermsAndConditions = lazy(() => import("./components/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));

function App() {
  const [user, loading] = useAuthState(auth);
  const [masterPassword, setMasterPassword] = useState(null);
  
  // Initialize activePage from URL hash if present
  const getInitialPage = () => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash === '/privacy') return 'privacy';
    if (hash === '/terms') return 'terms';
    if (hash === '/security') return 'securityInfo';
    return user ? "viewCards" : "auth";
  };
  
  const [activePage, setActivePage] = useState(getInitialPage());
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

  secureLog.debug(`App.jsx: Current activePage state: ${activePage}`);

  // Sync URL hash with activePage
  useEffect(() => {
    const pageToHash = {
      'privacy': '/privacy',
      'terms': '/terms',
      'securityInfo': '/security'
    };
    
    if (pageToHash[activePage]) {
      window.location.hash = pageToHash[activePage];
    } else if (activePage === 'auth') {
      window.location.hash = '';
    }
  }, [activePage]);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/privacy') setActivePage('privacy');
      else if (hash === '/terms') setActivePage('terms');
      else if (hash === '/security') setActivePage('securityInfo');
      else if (hash === '' && !user) setActivePage('auth');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  // Helper function to show success message
  // 🚀 PERFORMANCE: Memoize success message function
  const showSuccessMessage = useCallback((message = "Success!") => {
    setSuccessMessage(message);
    setShowSuccess(true);
    // Auto-hide after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000);
  }, []); // No dependencies - setSuccessMessage and setShowSuccess are stable

  // Completely rewritten auth state listener using ref and debounce
  useEffect(() => {
    secureLog.debug("App.jsx: Setting up auth state listener");
    
    // Set the initial ref value if not already set
    if (!currentUserIdRef.current) {
      currentUserIdRef.current = user?.uid || null;
      secureLog.debug(`App.jsx: Initial user ID set to: ${currentUserIdRef.current}`);
    }
    
    const handleAuthStateChange = (authUser) => {
      // Clear any pending debounced auth state handler
      if (authDebounceRef.current) {
        secureLog.debug("App.jsx: Clearing previous debounced auth handler");
        clearTimeout(authDebounceRef.current);
      }
      
      // Set a timeout to debounce the auth state change
      authDebounceRef.current = setTimeout(() => {
        const newUserId = authUser?.uid || null;
        const prevUserId = currentUserIdRef.current;
        
        secureLog.debug(`App.jsx: Auth state change (debounced): 
          Previous ID: ${prevUserId}, 
          New ID: ${newUserId}, 
          In grace period: ${Boolean(passwordEntryTimeRef.current)}
        `);
        
        // If this is the first auth state after app load, don't reset the password
        if (!hadInitialAuthRef.current) {
          secureLog.debug("App.jsx: First auth state change, not resetting password");
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
          secureLog.debug("App.jsx: User changed, resetting master password");
          setMasterPassword(null);
        } else {
          secureLog.debug(`App.jsx: No need to reset password - same user: ${prevUserId === newUserId}, 
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
      secureLog.debug("App.jsx: Cleaning up auth state listener");
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }
      unsubscribe();
    };
  }, []); // No dependencies - only run once on mount

  // Add a special handler for master password changes to track them
  useEffect(() => {
    if (masterPassword) {
      secureLog.debug("App.jsx: Master password set, starting grace period");
      passwordEntryTimeRef.current = Date.now();
    }
  }, [masterPassword]);

  // Add detailed user debugging logs
  useEffect(() => {
    if (loading) {
      secureLog.debug("App.jsx: Auth state is still loading...");
    } else if (user) {
      secureLog.debug("App.jsx: User is authenticated:", { uid: user.uid, email: user.email });
    } else {
      secureLog.debug("App.jsx: No authenticated user");
    }
  }, [user, loading]);

  // Add master password timeout handler
  useEffect(() => {
    // Handle master password timeout event (occurs after 5 min inactivity)
    const handleMasterPasswordTimeout = () => {
      secureLog.debug("Master password timeout detected (5 min inactivity)");
      
      // Only clear master password, keep Google session active
      setMasterPassword(null);
      secureLog.debug("Master password cleared. User will need to re-enter password (Google session kept)");
    };
    
    window.addEventListener('master-password-timeout', handleMasterPasswordTimeout);
    
    // Cleanup 
    return () => {
      window.removeEventListener('master-password-timeout', handleMasterPasswordTimeout);
    };
  }, []); // No dependencies needed

  useEffect(() => {
    // Check if app is installed
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSInstalled = window.navigator.standalone === true;
      const isAndroidInstalled = document.referrer.includes('android-app://');

      const currentlyInstalled = isStandalone || isIOSInstalled || isAndroidInstalled;
      secureLog.debug('Install check:', { isStandalone, isIOSInstalled, isAndroidInstalled, currentlyInstalled });

      // Only update if the state actually changed to avoid unnecessary re-renders
      setIsAppInstalled(prev => currentlyInstalled !== prev ? currentlyInstalled : prev);
    };

    // Initial check on load
    checkInstallation();

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      secureLog.debug('Install prompt detected');
      setDeferredPrompt(e);
      setIsAppInstalled(false); // Browser wants to show install, so app can't be installed
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      secureLog.debug('App installed');
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    // Listen for display mode changes (when app is launched from home screen)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      secureLog.debug('Display mode changed:', e.matches);
      setIsAppInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Listen for visibility change to recheck when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInstallation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', () => {});
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add this effect to load cards
  useEffect(() => {
    let unsubscribe = null;
    
    const loadCards = () => {
      if (!user || !masterPassword) {
        secureLog.debug("App.jsx: Not loading cards, user or masterPassword is missing", { 
          hasUser: !!user, 
          hasMasterPassword: !!masterPassword 
        });
        return;
      }
      
      secureLog.debug("App.jsx: Setting up cards listener for user", user.uid);
      try {
        const q = query(
          collection(db, "cards"),
          where("uid", "==", user.uid)
        );
        
        // Use onSnapshot instead of getDocs for real-time updates
        unsubscribe = onSnapshot(q, (snapshot) => {
          secureLog.debug(`App.jsx: Received snapshot with ${snapshot.docs.length} cards from Firestore`);
          
          if (snapshot.empty) {
            secureLog.debug("App.jsx: No cards found for this user");
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
                secureLog.error("Error processing card data:", err);
                return { id: doc.id, error: "Failed to process card data" };
              }
            });
            
            secureLog.debug(`App.jsx: Setting ${cardsData.length} cards to state`);
            setCards(cardsData);
          } catch (error) {
            secureLog.error('Error processing cards snapshot:', error);
          }
        }, (error) => {
          secureLog.error('Error in cards listener:', error);
        });
      } catch (error) {
        secureLog.error('Error setting up cards listener:', error);
      }
    };

    loadCards();
    
    return () => {
      if (unsubscribe) {
        secureLog.debug("App.jsx: Cleaning up cards listener");
        unsubscribe();
      }
      // Clear cards data
      secureWipeArray(cards);
      setCards([]);
    };
  }, [user, masterPassword]); // These are the correct dependencies

  // 🔐 SECURITY: Removed pre-decryption - cards now decrypted on-demand with auto-clearing cache

  const handleSignOutClick = () => {
    secureLog.debug("App.jsx: handleSignOutClick called");
    
    // Show the confirmation dialog
    setDialog({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        secureLog.debug("App.jsx: User confirmed sign out, executing...");
        // Clear sensitive data first
        secureWipeArray(cards);
        setCards([]);
        // Clear the master password
        setMasterPassword(null);
        // Then sign out from Firebase
        try {
          await signOut(auth);
          secureLog.debug("App.jsx: Sign out successful");
        } catch (error) {
          secureLog.error("App.jsx: Error signing out:", error);
        } finally {
          // Always close the dialog
          setDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleInstallClick = () => {
    secureLog.debug('Install clicked, deferredPrompt:', deferredPrompt, 'isAppInstalled:', isAppInstalled);

    if (isAppInstalled) {
      // App is already installed, show a message
      setDialog({
        isOpen: true,
        title: 'App Already Installed',
        message: 'Dred is already installed on your device. You can find it on your home screen or in your app drawer.',
        confirmText: 'OK',
        cancelText: null,
        type: 'default',
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    if (!deferredPrompt) {
      // Browser doesn't support PWA installation
      setDialog({
        isOpen: true,
        title: 'Installation Not Available',
        message: 'Your browser doesn\'t support PWA installation, or installation is not available right now.',
        confirmText: 'OK',
        cancelText: null,
        type: 'default',
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Normal installation flow
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
            secureLog.debug('App installed');
          }
          setDeferredPrompt(null);
          setDialog(prev => ({ ...prev, isOpen: false }));
        });
      }
    });
  };

  // In App.jsx, add extra validation to ensure we always have a user ID
  const safeUserId = user?.uid || null;
    secureLog.debug("App.jsx user ID:", safeUserId);

  // Add more logging for userId
  useEffect(() => {
    secureLog.debug("App.jsx: User changed:", user);
    secureLog.debug("App.jsx: User ID is:", user?.uid);
  }, [user]);

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    // Persist the mode in localStorage for future sessions
    localStorage.setItem('dred-color-mode', newMode);
    secureLog.debug(`App.jsx: Theme mode toggled to ${newMode}`);
  };

  // Load saved mode preference on initial render
  useEffect(() => {
    const savedMode = localStorage.getItem('dred-color-mode');
    if (savedMode) {
      setMode(savedMode);
      secureLog.debug(`App.jsx: Loaded saved theme mode: ${savedMode}`);
    }
  }, []);

  // 🚀 PERFORMANCE: Memoize page change function to prevent re-creating on every render
  const changeActivePage = useCallback((page) => {
    secureLog.debug(`App.jsx: Changing active page to ${page}`);
    setActivePage(page);
  }, []); // No dependencies - setActivePage is stable

  // 🚀 PERFORMANCE: Idle prefetch ViewCards chunk when app is idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        import(/* webpackPrefetch: true */ './ViewCards');
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        import('./ViewCards');
      }, 1500);
    }
  }, []);

  // Add an effect to log masterPassword changes
  useEffect(() => {
    secureLog.debug("App.jsx: masterPassword state changed:", masterPassword ? "Password is set" : "Password is NOT set");
  }, [masterPassword]);

  // Add an effect to log when the dialog state changes
  useEffect(() => {
    secureLog.debug("App.jsx: Dialog state changed:", { 
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
      case "securityInfo":
        return "Security Information";
      case "terms":
        return "Terms of Service";
      case "privacy":
        return "Privacy Policy";
      default:
        return "Dashboard";
    }
  };

  const renderContent = () => {
    // Special case: Allow viewing SecurityInfo without authentication
    if (activePage === "securityInfo") {
      return (
        <Suspense fallback={<LoadingOverlay message="Loading..." />}>
          <SecurityInfo setActivePage={(page) => {
            // If user is not logged in, always go back to auth
            if (!user) {
              secureLog.debug("App.jsx: SecurityInfo - User not logged in, returning to auth page");
              setActivePage("auth");
            } else {
              secureLog.debug(`App.jsx: SecurityInfo - Going to ${page}`);
              setActivePage(page);
            }
          }} />
        </Suspense>
      );
    }

    // Special case: Allow viewing Terms without authentication
    if (activePage === "terms") {
      return (
        <Suspense fallback={<LoadingOverlay message="Loading..." />}>
          <TermsAndConditions setActivePage={(page) => {
            secureLog.debug(`App.jsx: TermsAndConditions - Going to ${page}`);
            setActivePage(page);
          }} />
        </Suspense>
      );
    }

    // Special case: Allow viewing Privacy Policy without authentication
    if (activePage === "privacy") {
      return (
        <Suspense fallback={<LoadingOverlay message="Loading..." />}>
          <PrivacyPolicy setActivePage={(page) => {
            secureLog.debug(`App.jsx: PrivacyPolicy - Going to ${page}`);
            setActivePage(page);
          }} />
        </Suspense>
      );
    }
    
    // If user is not logged in OR email not verified, show Auth screen
    if (!user || !user.emailVerified) {
      return (
        <Auth 
          setUser={() => {}} // This is handled by firebase hook now
          setActivePage={changeActivePage} 
          mode={mode} 
          toggleMode={toggleMode}
          deferredPrompt={deferredPrompt}
          isAppInstalled={isAppInstalled}
          onInstall={handleInstallClick}
          setDialog={setDialog}
        />
      );
    }

    // If user is logged in but master password not set, show prompt
    if (!masterPassword) {
      return (
        <MasterPasswordPrompt
          setMasterPassword={setMasterPassword}
          user={user}
          setActivePage={changeActivePage}
          mode={mode}
          toggleMode={toggleMode}
          deferredPrompt={deferredPrompt}
          isAppInstalled={isAppInstalled}
          onInstall={handleInstallClick}
          setDialog={setDialog}
          onPasswordSubmit={(password) => {
            secureLog.debug("App.jsx: Password submitted in MasterPasswordPrompt");
            setMasterPassword(password);
          }}
        />
      );
    }

    return (
      <div className={`min-h-screen ${getBgGradient()} ${currentThemeData.font.body}`}>
        {/* Background pattern based on theme */}
        <ThemePatterns />
        
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
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
        </div>
        
        {/* Content Area */}
        <div className="md:ml-64 min-h-screen flex flex-col">
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
          
          <main className="flex-1 p-4 pt-20 pb-24 md:pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }} // 🚀 PERFORMANCE: Reduced from 0.2s for snappier navigation
                className="h-full"
              >
                {activePage === "viewCards" && (
                  <Suspense fallback={<LoadingOverlay message="Loading Your Cards..." />}>
                    <ViewCards 
                      user={user}
                      masterPassword={masterPassword}
                      setActivePage={changeActivePage}
                      setDialog={setDialog}
                      showSuccessMessage={showSuccessMessage}
                      cards={cards}
                      setCards={setCards}
                    />
                  </Suspense>
                )}
                {activePage === "addCard" && (
                  <Suspense fallback={<LoadingOverlay message="Loading Add Card..." />}>
                    <AddCard 
                      user={user} 
                      masterPassword={masterPassword} 
                      setActivePage={changeActivePage}
                      showSuccessMessage={showSuccessMessage}
                    />
                  </Suspense>
                )}
                {activePage === "billPay" && (
                  <Suspense fallback={<LoadingOverlay message="Loading Bill Pay..." />}>
                    <BillPay 
                      user={user} 
                      masterPassword={masterPassword}
                      setActivePage={changeActivePage}
                      showSuccessMessage={showSuccessMessage}
                      cards={cards}
                    />
                  </Suspense>
                )}
                {activePage === "settings" && (
                  <Suspense fallback={<LoadingOverlay message="Loading Settings..." />}>
                    <Settings 
                      user={user} 
                      masterPassword={masterPassword} 
                      setDialog={setDialog}
                      showSuccessMessage={showSuccessMessage}
                      cards={cards}
                      setActivePage={changeActivePage}
                    />
                  </Suspense>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <div className="md:hidden">
            <MobileNav activePage={activePage} setActivePage={changeActivePage} />
          </div>
        </div>
        
        {/* Shared UI Elements */}
        {showSuccess && <SuccessAnimation message={successMessage} />}
      </div>
    );
  };

  // Render dialog component if open
  const renderDialog = () => {
    if (dialog.isOpen) {
      secureLog.debug("App.jsx: Rendering dialog:", dialog.title);
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
    <>
      {renderContent()}
      {renderDialog()}
    </>
  );
}

export default App;