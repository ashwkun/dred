import React from 'react';
import InvestmentSection from './InvestmentSection';
import { FaCoins } from 'react-icons/fa';

const InvestmentContainer = ({ investmentData, userId }) => {
  if (!investmentData) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
        <FaCoins className="text-white/40 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Investment Data</h3>
        <p className="text-white/60">
          Start tracking your investments to see insights and projections here.
        </p>
      </div>
    );
  }
  
  return (
    <InvestmentSection insights={investmentData} userId={userId} />
  );
};

export default InvestmentContainer; 