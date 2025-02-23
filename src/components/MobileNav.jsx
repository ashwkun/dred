import React from 'react';
import { BiCreditCard, BiAddToQueue, BiWallet, BiCog } from 'react-icons/bi';
import { hasSupportedBillPayBank } from '../utils/bankUtils';

export default function MobileNav({ activePage, setActivePage, cards }) {
  const showBillPay = hasSupportedBillPayBank(cards);

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
    ...(showBillPay ? [{
      id: 'billPay',
      icon: BiWallet,
      label: 'Bill Pay'
    }] : []),
    {
      id: 'expenses',
      icon: BiWallet,
      label: 'Expenses'
    },
    {
      id: 'settings',
      icon: BiCog,
      label: 'Control'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none p-4 pb-5">
      <div className="mx-auto max-w-[300px] pointer-events-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-1 
          flex justify-around items-center shadow-xl"
        >
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center p-1 rounded-lg transition-colors ${
                activePage === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <item.icon className="text-base" />
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 