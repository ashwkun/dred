import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase";
import { BiLogoGoogle, BiShieldQuarter, BiEnvelope, BiLockAlt, BiChevronDown, BiChevronUp, BiUser, BiDownload } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';

const descriptorWords = ["Secure", "Simple", "Private"];

export default function Auth({ setUser = () => {}, setActivePage, mode, toggleMode, deferredPrompt, isAppInstalled, onInstall, setDialog }) {
  const [isLoading, setIsLoading] = useState(false);
  const [descriptorIndex, setDescriptorIndex] = useState(0);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDescriptorIndex((prevIndex) => (prevIndex + 1) % descriptorWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);


  // Poll for email verification
  useEffect(() => {
    let interval;
    if (waitingForVerification && auth.currentUser) {
      interval = setInterval(async () => {
        try {
          // Reload current user to get latest verification status
          await auth.currentUser.reload();
          
          if (auth.currentUser.emailVerified) {
            // Email is verified! Force a proper refresh
            clearInterval(interval);
            
            // Get a fresh token to trigger auth state update
            await auth.currentUser.getIdToken(true);
            
            // Sign out and sign back in to ensure App.jsx detects the verified status
            const email = auth.currentUser.email;
            const currentPassword = password; // We have this from signup
            
            await auth.signOut();
            await signInWithEmailAndPassword(auth, email, currentPassword);
            
            // Clear the waiting state
            setWaitingForVerification(false);
            // User will now proceed to app with verified email
          }
        } catch (error) {
          // Keep waiting
          secureLog.debug('Waiting for verification...', error);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [waitingForVerification, password]);

  // Handle mobile keyboard - scroll input into view
  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Small delay to let keyboard appear
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      secureLog.error("Error signing in:", error);
      let errorMessage = '';
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups for this website.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        errorMessage = "Error signing in: " + error.message;
      }
      
      if (errorMessage && setDialog) {
        setDialog({
          isOpen: true,
          title: 'Sign In Error',
          message: errorMessage,
          confirmText: 'OK',
          cancelText: null,
          type: 'danger',
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setEmailError('');
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (!displayName.trim()) {
          setEmailError('Please enter your name');
          setIsLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set display name and default photo
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.trim())}&background=4f46e5&color=fff&size=200`
        });
        
        await sendEmailVerification(userCredential.user);
        
        // Keep user signed in and show waiting screen
        setWaitingForVerification(true);
        setIsLoading(false);
      } else {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          setEmailError('Please verify your email before signing in. Check your inbox for the verification link.');
          setIsLoading(false);
          return;
        }
        
        // Ensure user has a photoURL - set one if missing
        if (!userCredential.user.photoURL) {
          const name = userCredential.user.displayName || userCredential.user.email.split('@')[0];
          await updateProfile(userCredential.user, {
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=200`
          });
        }
        
        // If verified, user will be signed in automatically
      }
    } catch (error) {
      secureLog.error("Error with email auth:", error);
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('Email already in use. Try signing in.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setEmailError('Password should be at least 6 characters.');
      } else if (error.code === 'auth/user-not-found') {
        setEmailError('No account found. Try signing up.');
      } else if (error.code === 'auth/wrong-password') {
        setEmailError('Incorrect password.');
      } else if (error.code === 'auth/invalid-credential') {
        setEmailError('Invalid email or password.');
      } else {
        setEmailError(error.message);
      }
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      // Try to sign in to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        setWaitingForVerification(true);
        setEmailError('');
      }
    } catch (error) {
      setEmailError('Unable to resend verification. Please check your credentials.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      if (setDialog) {
        setDialog({
          isOpen: true,
          title: 'Email Required',
          message: 'Please enter your email address first.',
          confirmText: 'OK',
          cancelText: null,
          type: 'default',
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      if (setDialog) {
        setDialog({
          isOpen: true,
          title: 'Email Sent',
          message: 'Password reset email sent! Check your inbox.',
          confirmText: 'OK',
          cancelText: null,
          type: 'success',
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      if (setDialog) {
        setDialog({
          isOpen: true,
          title: 'Error',
          message: 'Error: ' + error.message,
          confirmText: 'OK',
          cancelText: null,
          type: 'danger',
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
    }
  };


  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
              scale: [1, 1.1, 1],
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Main Content - Single Column, Mobile-First */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* Logo & Branding */}
            <div className="text-center space-y-3 -mt-8">
              <div className="flex items-center justify-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-40"></div>
                  <img 
                    src={require('./assets/logo.png')} 
                    alt="Dred" 
                    className="relative h-12 w-12 rounded-xl"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-white">Dred</h1>
                  <p className="text-[10px] text-indigo-300">Digital Card Wallet</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                Keep your cards{' '}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={descriptorIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-purple-400 font-semibold"
                  >
                    {descriptorWords[descriptorIndex]}
                  </motion.span>
                </AnimatePresence>
              </p>
            </div>

            {/* Auth Card - Enhanced */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl" />
              
              {/* Card Content */}
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4 shadow-2xl">
              {waitingForVerification ? (
                /* Verification Waiting Screen - Compact */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="flex justify-center">
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <BiEnvelope className="absolute inset-0 m-auto text-2xl text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Check Your Email</h3>
                    <p className="text-gray-300 text-xs">
                      Verification link sent to
                    </p>
                    <p className="text-indigo-300 font-semibold text-sm">
                      {auth.currentUser?.email}
                    </p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 space-y-1.5">
                    <p className="text-yellow-200 text-[9px] leading-relaxed">
                      📧 Click the link to verify. Page will auto-refresh.
                    </p>
                    <p className="text-orange-200 text-[8px] leading-relaxed">
                      💡 Check spam/junk if not in inbox!
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                    <motion.div
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span>Waiting...</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          if (auth.currentUser && !auth.currentUser.emailVerified) {
                            await sendEmailVerification(auth.currentUser);
                            if (setDialog) {
                              setDialog({
                                isOpen: true,
                                title: 'Email Sent',
                                message: 'Verification email resent! Check your inbox.',
                                confirmText: 'OK',
                                cancelText: null,
                                type: 'success',
                                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                              });
                            }
                          }
                        } catch (error) {
                          if (setDialog) {
                            setDialog({
                              isOpen: true,
                              title: 'Error',
                              message: 'Error sending email. Try again.',
                              confirmText: 'OK',
                              cancelText: null,
                              type: 'danger',
                              onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                            });
                          }
                        }
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-indigo-300 transition-colors"
                    >
                      Resend
                    </button>
                    <button
                      onClick={async () => {
                        setWaitingForVerification(false);
                        await auth.signOut();
                        setEmail('');
                        setPassword('');
                        setDisplayName('');
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
              <>
                {/* Welcome Message */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Hi There!</h3>
                </div>

                {/* Google Sign In - Primary with Badge */}
                <div className="space-y-2">
                  <motion.button
                    onClick={signInWithGoogle}
                    disabled={isLoading}
                    className="w-full group relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-2.5 py-3 text-white font-semibold text-sm">
                      {isLoading && !showOtherMethods ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <BiLogoGoogle className="text-xl" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </div>
                  </motion.button>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] text-green-400 font-medium">✓ Recommended</span>
                    <span className="text-[10px] text-gray-500">•</span>
                    <span className="text-[10px] text-gray-400">Fast & Secure</span>
                  </div>
                </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <button
                    onClick={() => setShowOtherMethods(!showOtherMethods)}
                    className="px-3 py-1 bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 text-gray-300 text-[10px] rounded-full hover:bg-gray-800 transition-all inline-flex items-center gap-1.5 border border-white/20 shadow-lg"
                  >
                    <BiEnvelope className="text-xs" />
                    <span>Sign in with Email</span>
                    {showOtherMethods ? <BiChevronUp className="text-xs" /> : <BiChevronDown className="text-xs" />}
                  </button>
                </div>
              </div>

              {/* Email Auth */}
              <AnimatePresence>
                {showOtherMethods && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Warning - Compact */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                      <p className="text-[9px] text-yellow-300 text-center">
                        ⚠️ Email requires verification. Google is faster.
                      </p>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-2">
                          <div className="space-y-2">
                            {authMode === 'signup' && (
                              <div className="relative">
                                <BiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
                                  required
                                />
                              </div>
                            )}
                            <div className="relative">
                              <BiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                              <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
                                required
                              />
                            </div>
                            <div className="relative">
                              <BiLockAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                              <input
                                type="password"
                                placeholder="Password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
                                required
                                minLength={6}
                              />
                            </div>
                          </div>

                          {emailError && (
                            <p className="text-[10px] text-red-400 text-center">{emailError}</p>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="submit"
                              onClick={() => setAuthMode('signin')}
                              disabled={isLoading}
                              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                authMode === 'signin' 
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              Sign In
                            </button>
                            <button
                              type="submit"
                              onClick={() => setAuthMode('signup')}
                              disabled={isLoading}
                              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                authMode === 'signup' 
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              Sign Up
                            </button>
                          </div>

                          {authMode === 'signin' && (
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="w-full text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}

                          {authMode === 'signup' && (
                            <p className="text-[9px] text-yellow-200 text-center">
                              📧 You'll need to verify your email
                            </p>
                          )}
                        </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="text-center space-y-2 pt-1">
                <p className="text-[9px] text-gray-400 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <button onClick={() => setActivePage('terms')} className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
                    Terms
                  </button>
                  {' '}and{' '}
                  <button onClick={() => setActivePage('privacy')} className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
                    Privacy Policy
                  </button>
                </p>
                <button 
                  onClick={() => setActivePage('securityInfo')} 
                  className="text-[10px] text-indigo-300 hover:text-indigo-200 transition-colors inline-flex items-center gap-1"
                >
                  <BiShieldQuarter className="text-xs" />
                  <span>Learn about security</span>
                </button>
              </div>
              </>
              )}
            </div>
            </div>

            {/* Install PWA - Always show based on installation status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-4"
            >
              {!isAppInstalled ? (
                /* Full install button when not installed */
                <motion.button
                  onClick={onInstall}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 hover:border-indigo-400/50 rounded-xl text-white/80 hover:text-white transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BiDownload className="text-base" />
                  <span className="text-xs font-medium">Install App</span>
                </motion.button>
              ) : (
                /* Just icon in top right when installed */
                <div className="flex justify-end">
                  <motion.button
                    onClick={onInstall}
                    className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 hover:border-indigo-400/50 rounded-full text-white/80 hover:text-white transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="App Installed - Click to reinstall"
                  >
                    <BiDownload className="text-lg" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
