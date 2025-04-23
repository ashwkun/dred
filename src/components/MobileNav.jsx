import React from 'react';
import { motion } from 'framer-motion';
import { BiCreditCard, BiAddToQueue, BiWallet as BiBillPay, BiCog } from 'react-icons/bi';
import { useTheme } from '../contexts/ThemeContext';

export default function MobileNav({ activePage, setActivePage, cards, onSignOut }) {
  const { currentThemeData } = useTheme();
  
  const navItems = [
    {
      id: 'viewCards',
      icon: BiCreditCard,
      label: 'Cards'
    },
    {
      id: 'addCard',
      icon: BiAddToQueue,
      label: 'Add'
    },
    {
      id: 'billPay',
      icon: BiBillPay,
      label: 'Bill Pay'
    },
    {
      id: 'settings',
      icon: BiCog,
      label: 'Control'
    }
  ];

  // Animation variants
  const navVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
        delay: 0.2
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none p-4 pb-5">
      <motion.div 
        className="mx-auto max-w-[300px] pointer-events-auto"
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <div className={`${currentThemeData.surfaces.primary} border border-white/20 ${currentThemeData.radius} p-1.5 
          flex justify-around items-center ${currentThemeData.shadows}`}
        >
          {navItems.map(item => (
            <motion.button 
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center py-2 px-3 ${currentThemeData.radius} transition-all ${
                activePage === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10'
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              animate={activePage === item.id ? { y: -2 } : { y: 0 }}
            >
              <item.icon className={`text-lg ${activePage === item.id ? 'scale-110' : ''}`} />
              <span className={`text-[10px] mt-1 ${currentThemeData.font.heading}`}>{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 