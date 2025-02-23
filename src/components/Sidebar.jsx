import React from 'react';
import { BiCreditCard, BiAddToQueue, BiWallet, BiCog, BiLogOut, BiDownload } from 'react-icons/bi';
import { hasSupportedBillPayBank } from '../utils/bankUtils';
import logo from "../assets/logo.png";

export default function Sidebar({ activePage, setActivePage, cards, user, onSignOut, onInstall, isAppInstalled, deferredPrompt }) {
  const showBillPay = hasSupportedBillPayBank(cards);

  const navItems = [
    { id: 'viewCards', icon: BiCreditCard, label: 'Cards' },
    { id: 'addCard', icon: BiAddToQueue, label: 'Add Card' },
    ...(showBillPay ? [{ id: 'billPay', icon: BiWallet, label: 'Bill Pay' }] : []),
    { id: 'expenses', icon: BiWallet, label: 'Expenses' },
    { id: 'settings', icon: BiCog, label: 'Controls' }
  ];

  return (
    <div className="hidden md:flex flex-col fixed top-0 left-0 h-full p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl 
        h-full w-64 flex flex-col"
      >
        {/* Header - Logo */}
        <div className="p-4 mb-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Dred" className="h-8" />
            <span className="text-white font-medium text-lg">Dred</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                transition-all group mb-1 ${
                activePage === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon className={`text-xl transition-transform group-hover:scale-110 
                ${activePage === item.id ? 'scale-110' : ''}`} 
              />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer - Account & Actions */}
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Install Button */}
          {deferredPrompt && (
            <button
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 
                hover:bg-white/20 rounded-xl text-white/80 hover:text-white 
                transition-all group"
            >
              <BiDownload className="text-xl transition-transform group-hover:scale-110" />
              <span className="font-medium">Install App</span>
            </button>
          )}

          {/* Account Info */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={user.photoURL} 
                alt="" 
                className="w-10 h-10 rounded-xl border border-white/20"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                text-red-400/70 hover:text-red-400 hover:bg-red-400/10 
                transition-colors"
            >
              <BiLogOut className="text-lg" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 