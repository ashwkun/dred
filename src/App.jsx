// App.jsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import MasterPasswordPrompt from "./MasterPasswordPrompt";
import ViewCards from "./ViewCards";
import AddCard from "./AddCard";
import Dashboard from "./Dashboard";
import Settings from "./features/settings/Settings";
import logo from "./assets/logo.png";
import { RiDashboardLine, RiAddCircleLine, RiCreditCardLine } from 'react-icons/ri';
import { BiCreditCard, BiAddToQueue, BiBarChartAlt, BiLogOut, BiCog } from 'react-icons/bi';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { collection, getDocs, query, where } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { db } from "./firebase";
import BillPay from "./BillPay";
import TopBar from "./components/TopBar";
import Dialog from "./components/Dialog";

function App() {
  const [user, setUser] = useState(null);
  const [masterPassword, setMasterPassword] = useState(null);
  const [activePage, setActivePage] = useState("viewCards");
  const [showSuccess, setShowSuccess] = useState(false);
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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setMasterPassword(null);
    });
    return () => unsubscribe();
  }, []);

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
    const loadCards = async () => {
      if (!user || !masterPassword) return;
      
      try {
        const q = query(
          collection(db, "cards"),
          where("uid", "==", user.uid)
        );
        
        const snapshot = await getDocs(q);
        const cardsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8)
        }));
        
        setCards(cardsData);
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    };

    loadCards();
  }, [user, masterPassword]);

  const handleSignOutClick = () => {
    setDialog({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        await signOut(auth);
        setDialog(prev => ({ ...prev, isOpen: false }));
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

  // If not signed in → show Auth page
  if (!user) {
    return <Auth setUser={setUser} />;
  }

  // If signed in but master password not set → show Master Password prompt
  if (!masterPassword) {
    return <MasterPasswordPrompt setMasterPassword={setMasterPassword} user={user} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentThemeData.gradient} overflow-hidden`}>
      <TopBar 
        user={user}
        onSignOut={handleSignOutClick}
        onInstall={handleInstallClick}
        isAppInstalled={isAppInstalled}
        deferredPrompt={deferredPrompt}
      />
      
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        cards={cards}
        user={user}
        onSignOut={handleSignOutClick}
        onInstall={handleInstallClick}
        isAppInstalled={isAppInstalled}
        deferredPrompt={deferredPrompt}
      />
      
      <MobileNav 
        activePage={activePage} 
        setActivePage={setActivePage}
        cards={cards}
      />

      {/* Main Content */}
      <main className="md:pl-72 pt-[72px] md:pt-4 min-h-screen z-10">
        <div className="h-[calc(100vh-72px)] md:h-full overflow-y-auto overscroll-none">
          <div className="container mx-auto p-4 pb-32 md:pb-4">
            {activePage === "viewCards" && (
              <ViewCards 
                user={user} 
                masterPassword={masterPassword}
                setActivePage={setActivePage}
              />
            )}
            {activePage === "addCard" && (
              <AddCard 
                user={user} 
                masterPassword={masterPassword} 
                setActivePage={setActivePage}
                setShowSuccess={setShowSuccess}
              />
            )}
            {activePage === "dashboard" && (
              <Dashboard 
                user={user} 
                masterPassword={masterPassword}
              />
            )}
            {activePage === "settings" && <Settings user={user} masterPassword={masterPassword} />}
            {activePage === "billPay" && (
              <BillPay 
                user={user} 
                masterPassword={masterPassword}
              />
            )}
          </div>
        </div>
      </main>

      {/* Success Popup */}
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
          showSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium">Card Added Successfully!</p>
        </div>
      </div>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
      />
    </div>
  );
}

export default App;