import React from 'react';
import { FaChartPie, FaChartLine } from 'react-icons/fa';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
      <button
        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
          activeTab === 'expenses'
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/5'
        } transition-all`}
        onClick={() => setActiveTab('expenses')}
      >
        <FaChartPie />
        <span>Expenses</span>
      </button>
      <button
        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
          activeTab === 'investments'
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-white/70 hover:text-white hover:bg-white/5'
        } transition-all`}
        onClick={() => setActiveTab('investments')}
      >
        <FaChartLine />
        <span>Investments</span>
      </button>
    </div>
  );
};

export default TabNavigation; 