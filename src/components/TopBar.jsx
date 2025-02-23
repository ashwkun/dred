import React, { useState, useEffect, useRef } from 'react';
import logo from "../assets/logo.png";
import { BiDownload, BiLogOut } from 'react-icons/bi';

export default function TopBar({ user, onSignOut, onInstall, isAppInstalled, deferredPrompt }) {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Logo */}
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Dred" className="h-7" />
              <span className="text-white font-medium text-lg">Dred</span>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3" ref={profileRef}>
              {/* Install Button */}
              {deferredPrompt && (
                <button
                  onClick={onInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 
                    hover:bg-white/20 rounded-xl border border-white/10 
                    text-white/80 hover:text-white transition-all"
                >
                  <BiDownload className="text-base" />
                  <span className="text-xs font-medium">Install</span>
                </button>
              )}

              {/* Profile Button */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 
                    hover:border-white/40 transition-colors"
                >
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 top-full mt-2 w-48 
                    bg-white/20 backdrop-blur-xl rounded-xl border border-white/20
                    shadow-lg overflow-hidden z-50">
                    <div className="bg-black/40 backdrop-blur-xl">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user.displayName}</p>
                        <p className="text-xs text-white/70 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={onSignOut}
                          className="w-full px-4 py-2 text-sm text-white hover:bg-white/10
                            flex items-center gap-2 transition-colors"
                        >
                          <BiLogOut className="text-lg" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 