import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";
import { BiLogoGoogle, BiSun, BiMoon } from 'react-icons/bi';
import logo from "./assets/logo.png";
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      duration: 0.5
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const buttonVariants = {
  hover: { scale: 1.03, transition: { duration: 0.2, ease: "easeOut" } },
  tap: { scale: 0.97 }
};

// Word cycling animation sequence
const descriptorWords = ["Simple", "Secure", "Smart"];

// Correctly receives setActivePage as a prop, setUser is now optional
export default function Auth({ setUser = () => {}, setActivePage, mode, toggleMode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [descriptorIndex, setDescriptorIndex] = useState(0);

  // Effect to cycle through descriptor words
  useEffect(() => {
    const interval = setInterval(() => {
      setDescriptorIndex((prevIndex) => (prevIndex + 1) % descriptorWords.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Add scopes and customization to the provider
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      console.log("Attempting Google sign in...");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign in successful:", result.user);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Please allow popups for this website.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup was closed by the user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request was cancelled.");
      } else if (error.code === 'auth/network-request-failed') {
        alert("Network error. Please check your internet connection.");
      } else {
        alert("Error signing in: " + error.message);
      }
      
      setIsLoading(false);
    }
  };

  // Style definitions based on mode
  const bgGradient = mode === 'light'
    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
    : 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900';

  const visualTextColor = mode === 'light' ? 'text-indigo-900/80' : 'text-indigo-200/80';
  const visualShape1 = mode === 'light' ? 'from-purple-300 to-indigo-400 opacity-30 md:opacity-40' : 'from-purple-600 to-indigo-700 opacity-20 md:opacity-30';
  const visualShape2 = mode === 'light' ? 'from-blue-200 to-cyan-300 opacity-30 md:opacity-40' : 'from-blue-600 to-cyan-700 opacity-20 md:opacity-30';
  const visualShape3 = mode === 'light' ? 'from-indigo-300 to-purple-400 opacity-30 md:opacity-40' : 'from-indigo-600 to-purple-700 opacity-20 md:opacity-30';

  const cardBg = mode === 'light' ? 'bg-white' : 'bg-black/30';
  const cardBackdropBlur = mode === 'light' ? 'backdrop-blur-sm' : 'backdrop-blur-lg';
  const cardBorder = mode === 'light' ? 'border-gray-200' : 'border-white/10';
  const cardShadow = mode === 'light' ? 'shadow-xl' : 'shadow-2xl shadow-purple-900/20';
  const primaryTextColor = mode === 'light' ? 'text-gray-900' : 'text-white';
  const secondaryTextColor = mode === 'light' ? 'text-gray-600' : 'text-gray-300';
  const tertiaryTextColor = mode === 'light' ? 'text-gray-500' : 'text-gray-400';
  const featureTextColor = mode === 'light' ? 'text-gray-700' : 'text-gray-300';

  const toggleButtonBg = mode === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700/50 hover:bg-gray-600/50 border border-white/10';
  const toggleButtonIconColor = mode === 'light' ? 'text-yellow-500' : 'text-yellow-400';
  const toggleButtonIconColorDark = mode === 'light' ? 'text-indigo-700' : 'text-indigo-400';

  const linkButtonBg = mode === 'light' ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' : 'bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300';
  const linkButtonBorder = mode === 'light' ? 'border-indigo-200' : 'border-indigo-700';
  
  const highlightColor = mode === 'light' ? 'text-indigo-600' : 'text-indigo-400';

  return (
    <div className={`relative min-h-screen w-full flex flex-col md:flex-row ${bgGradient} overflow-hidden font-sans`}>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleMode}
        className={`absolute top-4 right-4 z-20 p-2 rounded-full ${toggleButtonBg} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        aria-label={mode === 'light' ? "Switch to dark mode" : "Switch to light mode"}
      >
        {mode === 'light' ? (
          <BiMoon className={`w-5 h-5 ${toggleButtonIconColorDark}`} />
        ) : (
          <BiSun className={`w-5 h-5 ${toggleButtonIconColor}`} />
        )}
      </button>

      {/* Left Side - Visuals */}
      <div className="relative w-full md:w-1/2 h-64 md:h-screen flex items-center justify-center overflow-hidden p-6 md:p-12">
        {/* Background animations - reduced prominence */}
        <motion.div
          className={`absolute w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br ${visualShape1} rounded-full filter blur-xl`}
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
          className={`absolute w-44 h-44 md:w-72 md:h-72 bg-gradient-to-tl ${visualShape2} rounded-full filter blur-xl`}
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
          className={`absolute w-36 h-36 md:w-60 md:h-60 bg-gradient-to-tr ${visualShape3} rounded-full filter blur-xl`}
          animate={{ 
            scale: [1, 1.05, 1], 
            rotate: [0, 10, 0], 
            x: [0, -10, 0], 
            y: [5, 0, 5],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        
        {/* Logo with enhanced animation */}
        <motion.div 
          className="relative z-10 text-center space-y-3 md:space-y-4" 
          initial={{ y: -20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { duration: 1, ease: "easeOut" }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ 
              scale: [0.98, 1.02, 0.98], 
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={logo} alt="Dred Logo" className="h-16 md:h-24 mx-auto mb-4 drop-shadow-lg" />
          </motion.div>
          <motion.h2 
            className={`text-xl md:text-2xl font-semibold ${visualTextColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Secure. Simple. Smart.
          </motion.h2>
        </motion.div>
      </div>

      {/* Right Side - Authentication Card */}
      <motion.div
        className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className={`w-full max-w-sm space-y-6 ${cardBg} ${cardBackdropBlur} rounded-2xl p-8 border ${cardBorder} ${cardShadow} z-10 relative`}
          initial={{ y: 10 }}
          animate={{ 
            y: [0, -5, 0],
            boxShadow: [
              `0 10px 30px -5px rgba(0, 0, 0, 0.1)`,
              `0 20px 40px -5px rgba(0, 0, 0, 0.15)`,
              `0 10px 30px -5px rgba(0, 0, 0, 0.1)`
            ]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <motion.h1
            className={`text-2xl md:text-3xl font-bold ${primaryTextColor} text-center`}
            variants={itemVariants}
          >
            Sign in to Dred
          </motion.h1>
          
          {/* Description with animated word */}
          <motion.div 
            className="pt-2 pb-4 text-center" 
            variants={itemVariants}
          >
            <p className={`${featureTextColor} text-sm md:text-base`}>
              A{" "}
              <motion.span
                key={descriptorIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`inline-block font-medium ${highlightColor}`}
              >
                {descriptorWords[descriptorIndex]}
              </motion.span>
              {" "}digital card wallet
            </p>
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3
                        bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                        text-white font-semibold rounded-xl shadow-md hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        transition-all duration-200 ease-in-out
                        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            variants={buttonVariants}
            whileHover={!isLoading ? "hover" : ""}
            whileTap={!isLoading ? "tap" : ""}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <BiLogoGoogle className="w-6 h-6" />
                Continue with Google
              </>
            )}
          </motion.button>

          {/* Terms Text */}
          <motion.p
            className={`text-xs ${tertiaryTextColor} text-center pt-2`}
            variants={itemVariants}
          >
            By continuing, you agree to our Terms of Service.
          </motion.p>

          {/* Link to How It Works - Enhanced styling */}
          <motion.div className="text-center pt-4" variants={itemVariants}>
            <motion.button 
              onClick={() => {
                console.log("Auth.jsx: 'Learn more about security' clicked. Setting activePage to 'howItWorks'.");
                if (typeof setActivePage === 'function') {
                  setActivePage('howItWorks');
                } else {
                  console.error("Auth.jsx: setActivePage is not a function");
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
      </motion.div>

    </div>
  );
}
