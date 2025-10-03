import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ValidationAnimation from "./components/ValidationAnimation";
import { securityManager } from "./utils/security";
import LockoutTimer from "./components/LockoutTimer";
import { motion } from 'framer-motion';
import { BiHide, BiShow, BiLogOut, BiSun, BiMoon } from 'react-icons/bi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

function MasterPasswordPrompt({ setMasterPassword, user, setActivePage, mode, toggleMode, onPasswordSubmit }) {
  const [inputValue, setInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [validationSentence, setValidationSentence] = useState("");
  const [masterPass, setMasterPass] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Log user info for debugging
  useEffect(() => {
    console.log("MasterPasswordPrompt: User state:", user ? `User with ID ${user.uid}` : "No user");
  }, [user]);

  useEffect(() => {
    // Only proceed if we have a valid user with uid
    if (user && user.uid) {
      checkFirstTimeUser();
    } else {
      console.warn("MasterPasswordPrompt: User or user.uid is undefined, skipping first-time check");
      // Default to first-time if we can't verify
      setIsFirstTime(true);
    }
  }, [user]);

  const checkFirstTimeUser = async () => {
    try {
      // Guard against null user
      if (!user || !user.uid) {
        console.error("Error checking first time user: User or user.uid is undefined");
        setIsFirstTime(true);
        return;
      }

      const validationRef = doc(db, "validationStrings", user.uid);
      const validationDoc = await getDoc(validationRef);
      setIsFirstTime(!validationDoc.exists());
    } catch (error) {
      console.error("Error checking first time user:", error);
      setIsFirstTime(true);
    }
  };

  const handleFirstTimeStep1 = async (e) => {
    e.preventDefault();
    if (validationSentence.trim().length < 10) {
      setValidationError("Please enter a longer sentence for better security (at least 10 characters).");
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleFirstTimeStep2 = async (e) => {
    e.preventDefault();
    // Temporarily disabled password requirements for development
    // if (masterPass.length < 12 || !/[A-Z]/.test(masterPass) || !/[a-z]/.test(masterPass) || !/[0-9]/.test(masterPass) || !/[^A-Za-z0-9]/.test(masterPass)) {
    //    setValidationError("Password does not meet requirements (12+ chars, upper, lower, number, special).");
    //    return;
    // }
    if (masterPass.trim() === "") {
      setValidationError("Please enter a password.");
      return;
    }
    setIsValidating(true);
    setValidationError(null);

    try {
      // Guard against null user
      if (!user || !user.uid) {
        throw new Error("User not authenticated. Please refresh and try again.");
      }

      const validationString = securityManager.createValidationString(masterPass, validationSentence);
      await setDoc(doc(db, "validationStrings", user.uid), {
        validationString,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setShowSuccess(true);
      await new Promise(r => setTimeout(r, 2000));
      
      // Set master password first
      console.log("MasterPasswordPrompt: Setting master password:", masterPass.substring(0, 1) + "******");
      if (typeof onPasswordSubmit === 'function') {
        onPasswordSubmit(masterPass);
      }
      if (typeof setMasterPassword === 'function') {
        setMasterPassword(masterPass);
      }
      
      // Wait for state to update before navigation
      console.log("MasterPasswordPrompt: Waiting before navigating to viewCards");
      await new Promise(r => setTimeout(r, 300));
      
      // Then navigate
      console.log("MasterPasswordPrompt: First-time setup complete, navigating to viewCards");
      if (typeof setActivePage === 'function') {
        setActivePage('viewCards');
      }
    } catch (error) {
      setValidationError(error.message || "An error occurred during setup.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationError(null);

    try {
      // Guard against null user
      if (!user || !user.uid) {
        throw new Error("User not authenticated. Please refresh and try again.");
      }

      const validationDoc = await getDoc(doc(db, "validationStrings", user.uid));
      if (!validationDoc.exists()) {
        throw new Error("Validation data not found. Setup might be incomplete.");
      }
      
      const validationString = validationDoc.data().validationString;
      const result = await securityManager.validatePassword(validationString, inputValue, user.uid);
      
      setValidationSentence(result.decryptedSentence);
      setShowSuccess(true);
      await new Promise(r => setTimeout(r, 2000));
      
      // Set master password first
      console.log("MasterPasswordPrompt: Setting master password after successful validation:", inputValue.substring(0, 1) + "******");
      if (typeof onPasswordSubmit === 'function') {
        onPasswordSubmit(inputValue);
      }
      if (typeof setMasterPassword === 'function') {
        setMasterPassword(inputValue);
      }
      
      // Wait for state to update before navigation
      console.log("MasterPasswordPrompt: Waiting before navigating to viewCards");
      await new Promise(r => setTimeout(r, 300));
      
      // Then navigate
      console.log("MasterPasswordPrompt: Navigating to viewCards page");
      if (typeof setActivePage === 'function') {
        setActivePage('viewCards');
      }

    } catch (error) {
      let errorMessage = error.message;
      if (errorMessage === "Invalid password" || errorMessage.includes("Could not decrypt")) {
        errorMessage = "The password entered is incorrect. Please try again.";
      } else if (errorMessage.includes("Account locked")) {
        const minutesMatch = errorMessage.match(/\d+/);
        const minutes = minutesMatch ? parseInt(minutesMatch[0]) : 5;
        errorMessage = `Too many failed attempts. Account locked for ${minutes} minutes.`;
        setIsLockedOut(true);
        setLockoutMinutes(minutes);
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
        console.error("Password validation error:", error); 
      }
      setValidationError(errorMessage);
    } finally {
      if (!showSuccess) {
        setIsValidating(false);
      }
    }
  };

  // Add a handleSignOut function that shows confirmation first
  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      console.log("MasterPasswordPrompt: User confirmed sign out");
      await signOut(auth);
    }
  };

  // Style definitions based on mode
  const bgGradient = mode === 'light'
    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
    : 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900';

  const visualShape1 = mode === 'light' ? 'from-purple-300 to-indigo-400 opacity-30 md:opacity-40' : 'from-purple-600 to-indigo-700 opacity-20 md:opacity-30';
  const visualShape2 = mode === 'light' ? 'from-blue-200 to-cyan-300 opacity-30 md:opacity-40' : 'from-blue-600 to-cyan-700 opacity-20 md:opacity-30';
  const visualShape3 = mode === 'light' ? 'from-indigo-300 to-purple-400 opacity-30 md:opacity-40' : 'from-indigo-600 to-purple-700 opacity-20 md:opacity-30';

  const cardBg = mode === 'light' ? 'bg-white/90' : 'bg-gray-900/80';
  const cardBackdropBlur = mode === 'light' ? 'backdrop-blur-md' : 'backdrop-blur-md';
  const cardBorder = mode === 'light' ? 'border-gray-200' : 'border-white/10';
  const cardShadow = mode === 'light' ? 'shadow-xl shadow-gray-300/20' : 'shadow-2xl shadow-purple-900/30';
  
  const primaryTextColor = mode === 'light' ? 'text-gray-900' : 'text-white';
  const secondaryTextColor = mode === 'light' ? 'text-gray-600' : 'text-gray-300';
  const tertiaryTextColor = mode === 'light' ? 'text-gray-500' : 'text-gray-400';
  
  const userCardBg = mode === 'light' ? 'bg-white/90' : 'bg-gray-900/80';
  const userCardBorder = mode === 'light' ? 'border-gray-200' : 'border-white/10';
  
  const inputBg = mode === 'light' ? 'bg-white/70' : 'bg-white/5';
  const inputBorder = mode === 'light' ? 'border-gray-200' : 'border-white/20';
  const inputTextColor = mode === 'light' ? 'text-gray-900' : 'text-white';
  const inputPlaceholder = mode === 'light' ? 'placeholder-gray-400' : 'placeholder-white/40';
  
  const toggleButtonBg = mode === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700/50 hover:bg-gray-600/50 border border-white/10';
  const toggleButtonIconColor = mode === 'light' ? 'text-yellow-500' : 'text-yellow-400';
  const toggleButtonIconColorDark = mode === 'light' ? 'text-indigo-700' : 'text-indigo-400';
  
  const infoCardBg = mode === 'light' ? 'bg-gray-100' : 'bg-black/30';
  const infoCardBorder = mode === 'light' ? 'border-gray-200' : 'border-white/20';
  const infoDotColor = mode === 'light' ? 'bg-indigo-500' : 'bg-indigo-400';
  
  const warningTextColor = mode === 'light' ? 'text-red-600' : 'text-red-400';
  const linkButtonBg = mode === 'light' ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' : 'bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300';
  const linkButtonBorder = mode === 'light' ? 'border-indigo-200' : 'border-indigo-700';

  const renderStep1 = () => (
    <motion.div variants={itemVariants} className="space-y-4 md:space-y-5">
      <h2 className={`text-lg md:text-xl font-bold ${primaryTextColor} text-center mb-2`}>
        Secure Your Account
      </h2>
      <div className={`${infoCardBg} rounded-xl p-4 md:p-5 border ${infoCardBorder} text-xs md:text-sm ${secondaryTextColor} space-y-2 shadow-lg`}>
        <p className={`${primaryTextColor} font-medium`}>Enter a unique sentence below:</p>
        <p className={secondaryTextColor}>This adds an extra layer of security for verifying your password. You won't need to remember it.</p>
        <p className="text-indigo-500 italic">Example: "The quick brown fox jumps over the lazy dog"</p>
      </div>

      <form onSubmit={handleFirstTimeStep1} className="space-y-4">
        <div className="relative">
          <textarea
            value={validationSentence}
            onChange={(e) => setValidationSentence(e.target.value)}
            className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputTextColor} ${inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${cardBackdropBlur} transition-colors duration-200 shadow-inner`}
            placeholder="Type your unique sentence here (min. 10 characters)"
            rows={3}
            required
          />
        </div>
        <button 
          type="submit" 
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-transparent rounded-xl text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transform hover:-translate-y-0.5"
        >
          Continue
        </button>
      </form>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div variants={itemVariants} className="space-y-4 md:space-y-5">
      <h2 className={`text-lg md:text-xl font-bold ${primaryTextColor} text-center mb-2`}>
        Create Master Password
      </h2>
      <div className={`${infoCardBg} rounded-xl p-4 md:p-5 border ${infoCardBorder} text-xs md:text-sm ${secondaryTextColor} space-y-2 shadow-lg`}>
        <p className={`font-medium ${primaryTextColor} mb-1`}>Password requirements:</p>
        <p className="text-yellow-400 mb-2">(Currently Optional)</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 opacity-50">
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 ${infoDotColor} rounded-full mr-2`}></span>
            <span>12+ characters</span>
          </div>
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 ${infoDotColor} rounded-full mr-2`}></span>
            <span>1+ Uppercase</span>
          </div>
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 ${infoDotColor} rounded-full mr-2`}></span>
            <span>1+ Lowercase</span>
          </div>
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 ${infoDotColor} rounded-full mr-2`}></span>
            <span>1+ Number</span>
          </div>
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 ${infoDotColor} rounded-full mr-2`}></span>
            <span>1+ Special</span>
          </div>
        </div>
      </div>
      <p className={`${warningTextColor} text-xs md:text-sm text-center font-medium`}>
        ⚠️ Important: This password cannot be recovered if lost.
      </p>

      <form onSubmit={handleFirstTimeStep2} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={masterPass}
            onChange={(e) => setMasterPass(e.target.value)}
            className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputTextColor} ${inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${cardBackdropBlur} transition-colors duration-200 shadow-inner`}
            placeholder="Create your master password"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${mode === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/40 hover:text-white/70'} focus:outline-none p-1.5`}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <BiHide className="w-5 h-5" /> : <BiShow className="w-5 h-5" />}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isValidating} 
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-transparent rounded-xl text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5"
        >
          {isValidating ? 'Setting up...' : 'Set Master Password & Finish'}
        </button>
      </form>
    </motion.div>
  );

  return (
    <div className={`min-h-screen w-full flex flex-col relative overflow-hidden font-sans ${bgGradient}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleMode}
        className={`absolute top-4 right-4 z-50 p-2 rounded-full ${toggleButtonBg} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        aria-label={mode === 'light' ? "Switch to dark mode" : "Switch to light mode"}
      >
        {mode === 'light' ? (
          <BiMoon className={`w-5 h-5 ${toggleButtonIconColorDark}`} />
        ) : (
          <BiSun className={`w-5 h-5 ${toggleButtonIconColor}`} />
        )}
      </button>
      
      {/* Background decorative elements - positioned absolutely */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-16 md:top-1/4 left-1/4 w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br ${visualShape1} rounded-full filter blur-xl`}
          animate={{ 
            scale: [1, 1.05, 1], 
            rotate: [0, 8, 0], 
            x: [-5, 5, -5], 
            y: [3, -3, 3],
            opacity: [0.5, 0.7, 0.5] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute top-1/3 -right-10 md:right-1/4 w-44 h-44 md:w-72 md:h-72 bg-gradient-to-tl ${visualShape2} rounded-full filter blur-2xl`}
          animate={{ 
            scale: [1, 0.98, 1], 
            rotate: [0, -5, 0], 
            x: [8, -8, 8], 
            y: [-6, 6, -6],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 23, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className={`absolute bottom-20 right-10 md:bottom-1/4 md:right-1/3 w-36 h-36 md:w-60 md:h-60 bg-gradient-to-tr ${visualShape3} rounded-full filter blur-xl`}
          animate={{ 
            scale: [1, 1.05, 1], 
            rotate: [0, 10, 0], 
            x: [0, -10, 0], 
            y: [5, 0, 5],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>
      
      {/* Content */}
      <div className="w-full flex flex-col items-center min-h-screen py-8 z-10 relative">
        {/* Top Logo Section - enhanced with DredLogo component */}
        <motion.div 
          className="relative mb-8 md:mb-12 text-center z-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex justify-center mb-4">
            <img src={require('./assets/logo.png')} alt="Dred Logo" className="h-20 w-20 md:h-28 md:w-28 rounded-3xl" />
          </div>
          <motion.h1 
            className={`text-2xl md:text-3xl font-bold ${primaryTextColor} z-20 relative`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {isFirstTime ? "Account Setup" : "Your Vault"}
          </motion.h1>
        </motion.div>
        
        {/* Main Content */}
        <div className="w-full max-w-md px-4 md:px-0 space-y-4 md:space-y-6 relative z-30">
          {/* User info card */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className={`${userCardBg} ${cardBackdropBlur} rounded-xl border ${userCardBorder} p-3 md:p-4 flex items-center justify-between shadow-lg relative z-20`}
            whileHover={{ y: -2, boxShadow: "0 12px 25px -5px rgba(0, 0, 0, 0.15)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/20 flex-shrink-0 shadow-md"
                />
              )}
              <span className={`${primaryTextColor} text-sm md:text-base font-medium truncate`}>
                {user?.displayName || user?.email || 'User'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className={`${mode === 'light' ? 'text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300' : 'text-white/60 hover:text-white border-white/10 hover:border-white/30'} px-3 py-1.5 rounded-lg border transition-colors duration-200 shadow-md`}
              aria-label="Sign Out"
            >
              <BiLogOut className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Main auth card */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`${cardBg} ${cardBackdropBlur} rounded-2xl border ${cardBorder} ${cardShadow} p-5 md:p-8 relative z-20`}
            whileInView={{
              y: [0, -5, 0],
              boxShadow: [
                `0 10px 30px -5px rgba(0, 0, 0, 0.2)`,
                `0 20px 40px -5px rgba(0, 0, 0, 0.3)`,
                `0 10px 30px -5px rgba(0, 0, 0, 0.2)`
              ]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {isFirstTime ? (
              step === 1 ? renderStep1() : renderStep2()
            ) : ( 
              <motion.div variants={itemVariants} className="space-y-4 md:space-y-5">
                <h2 className={`text-lg md:text-xl font-bold ${primaryTextColor} text-center`}>
                  Enter Master Password
                </h2>
                <p className={`${secondaryTextColor} text-center text-xs md:text-sm pb-2`}>
                  Enter your password to decrypt and access your data.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setValidationError(null);
                      }}
                      className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputTextColor} ${inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${cardBackdropBlur} transition-colors duration-200 shadow-inner`}
                      placeholder="Enter master password"
                      required
                      aria-label="Master Password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${mode === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/40 hover:text-white/70'} focus:outline-none p-1.5`}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                       {showPassword ? <BiHide className="w-5 h-5" /> : <BiShow className="w-5 h-5" />}
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isValidating || isLockedOut} 
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-transparent rounded-xl text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isValidating ? 'Verifying...' : 'Unlock Vault'}
                  </button>
                </form>
                {isLockedOut && ( 
                  <div className="pt-2">
                     <LockoutTimer minutesLeft={lockoutMinutes} onTimerEnd={() => setIsLockedOut(false)}/>
                  </div>
                )}
              </motion.div>
            )}
            <motion.div className="text-center pt-4 md:pt-5" variants={itemVariants}>
              <motion.button 
                onClick={() => {
                  console.log("MasterPasswordPrompt.jsx: 'Learn more about security' clicked. Setting activePage to 'howItWorks'.");
                  if (typeof setActivePage === 'function') {
                    setActivePage('howItWorks');
                  } else {
                    console.error("MasterPasswordPrompt.jsx: setActivePage is not a function");
                  }
                }}
                className={`px-4 py-2 rounded-lg ${linkButtonBg} border ${linkButtonBorder} text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Learn more about security
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Validation animation overlay */}
      {(isValidating || showSuccess || validationError) && (
        <ValidationAnimation 
          isValidating={isValidating}
          isSuccess={showSuccess}
          error={validationError}
          validationSentence={validationSentence}
          isFirstTime={isFirstTime}
        />
      )}
    </div>
  );
}

export default MasterPasswordPrompt;
