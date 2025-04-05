import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import logo from "../assets/logo.png";
import { BiDownload, BiLogOut, BiSun, BiMoon } from 'react-icons/bi';
import { useTheme } from '../contexts/ThemeContext';

export default function TopBar({ 
  title,
  user, 
  showProfile, 
  setShowProfile, 
  onSignOut, 
  onInstall, 
  isAppInstalled, 
  deferredPrompt,
  mode,
  toggleMode
}) {
  const profileRef = useRef(null);
  const { currentThemeData } = useTheme();

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowProfile]);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-4">
      <motion.div 
        className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Logo and Title */}
            <div className="flex items-center gap-3">
              <motion.img 
                src={logo} 
                alt="Dred" 
                className="h-7"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <div className="flex flex-col">
                <span className="text-white font-medium text-lg">Dred</span>
                {title && (
                  <span className="text-white/60 text-sm hidden sm:inline-block">{title}</span>
                )}
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3" ref={profileRef}>
              {/* Theme Toggle Button */}
              {toggleMode && (
                <motion.button
                  onClick={toggleMode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 
                    border border-white/10 text-white/80 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={mode === 'light' ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {mode === 'light' ? (
                    <BiMoon className="w-5 h-5" />
                  ) : (
                    <BiSun className="w-5 h-5" />
                  )}
                </motion.button>
              )}
              
              {/* Install Button */}
              {deferredPrompt && (
                <motion.button
                  onClick={onInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 
                    bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 
                    text-white/80 hover:text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BiDownload className="text-base" />
                  <span className="text-xs font-medium">Install</span>
                </motion.button>
              )}

              {/* Profile Button */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowProfile(!showProfile)}
                  className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 
                    hover:border-white/40 transition-colors"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(255, 255, 255, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </motion.button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <motion.div 
                    className="absolute right-0 top-full mt-2 w-56 
                      bg-black/30 backdrop-blur-xl rounded-xl border border-white/20
                      shadow-lg overflow-hidden z-50"
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="backdrop-blur-xl">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user.displayName}</p>
                        <p className="text-xs text-white/70 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <motion.button
                          onClick={onSignOut}
                          className="w-full px-4 py-2.5 text-sm text-red-400/90 hover:text-red-400
                            hover:bg-red-400/10 flex items-center gap-2 transition-colors"
                          whileHover={{ backgroundColor: 'rgba(248, 113, 113, 0.1)' }}
                        >
                          <BiLogOut className="text-lg" />
                          Sign Out
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 