import React from 'react';
import { motion } from 'framer-motion';
import { BiCreditCard, BiAddToQueue, BiWallet as BiBillPay, BiCog, BiLogOut, BiDownload } from 'react-icons/bi';
import logo from "../assets/logo.png";
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ activePage, setActivePage, cards, user, onSignOut, onInstall, isAppInstalled, deferredPrompt }) {
  const { currentThemeData } = useTheme();
  
  const navItems = [
    { id: 'viewCards', icon: BiCreditCard, label: 'Cards' },
    { id: 'addCard', icon: BiAddToQueue, label: 'Add Card' },
    { id: 'billPay', icon: BiBillPay, label: 'Bill Pay' },
    { id: 'settings', icon: BiCog, label: 'Controls' }
  ];

  // Sidebar animation variants
  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="hidden md:flex flex-col fixed top-0 left-0 h-screen p-4 pt-24 z-30"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div 
        className={`${currentThemeData.surfaces.primary} border border-white/20 ${currentThemeData.radius} 
          h-[calc(100vh-7rem)] w-64 flex flex-col ${currentThemeData.shadows} overflow-hidden`}
      >
        {/* Logo is now hidden since we have the logo in topbar */}
        <div className="pt-2"></div>

        {/* Navigation */}
        <div className="flex-1 px-3">
          {navItems.map(item => (
            <motion.button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 ${currentThemeData.radius} 
                transition-all group mb-2 ${
                activePage === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              variants={itemVariants}
              whileHover={{ 
                backgroundColor: activePage === item.id ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                initial={false}
              >
                <item.icon className={`text-xl transition-transform 
                  ${activePage === item.id ? 'scale-110' : ''}`} 
                />
              </motion.div>
              <span className={`${currentThemeData.font.heading}`}>{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Footer - Account & Actions */}
        <motion.div 
          className="p-4 border-t border-white/10 space-y-4"
          variants={itemVariants}
        >
          {/* Install Button */}
          {deferredPrompt && (
            <motion.button
              onClick={onInstall}
              className={`w-full flex items-center gap-3 px-4 py-3 ${currentThemeData.surfaces.secondary} 
                hover:bg-white/20 ${currentThemeData.radius} text-white/80 hover:text-white 
                transition-all group border border-white/10`}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                initial={false}
              >
                <BiDownload className="text-xl" />
              </motion.div>
              <span className={`${currentThemeData.font.heading}`}>Install App</span>
            </motion.button>
          )}

          {/* Account Info */}
          <motion.div 
            className={`p-3 ${currentThemeData.radius} ${currentThemeData.surfaces.secondary} 
              border border-white/10 ${currentThemeData.shadows}`}
            whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.img 
                src={user.photoURL} 
                alt="" 
                className={`w-10 h-10 ${currentThemeData.radius} border border-white/20`}
                whileHover={{ scale: 1.05, borderColor: 'rgba(255, 255, 255, 0.3)' }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${currentThemeData.font.heading} text-white truncate`}>
                  {user.displayName}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <motion.button
              onClick={onSignOut}
              className={`w-full flex items-center gap-2 px-3 py-2 ${currentThemeData.radius}
                text-red-400/80 hover:text-red-400 hover:bg-red-400/10 
                transition-colors`}
              whileHover={{ backgroundColor: 'rgba(248, 113, 113, 0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              <BiLogOut className="text-lg" />
              <span className={`text-sm ${currentThemeData.font.heading}`}>Sign Out</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 