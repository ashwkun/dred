import React from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const InvestmentSummary = ({ transactions, isExpanded, toggleSection }) => {
  // Filter for only investment transactions
  const investmentCategories = ['Investments', 'Stocks', 'Mutual Funds', 'ETF', 'Crypto', 'Investment'];
  const investmentTransactions = transactions.filter(transaction => 
    investmentCategories.includes(transaction.category)
  );
  
  const totalInvested = investmentTransactions.reduce(
    (sum, t) => sum + (parseFloat(t.amount) || 0), 0
  );
  
  // Skip rendering if no investments
  if (investmentTransactions.length === 0) return null;
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartLine className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">Investment Summary</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <p className="text-white/60 text-sm mb-4">
            These transactions are excluded from your expense insights since they represent investments rather than spending.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Total Invested</span>
              <span className="text-white text-xl font-semibold">₹{totalInvested.toLocaleString()}</span>
            </div>
            
            <div className="mt-3 text-sm text-white/60">
              Across {investmentTransactions.length} transactions
            </div>
          </div>
          
          <div className="text-white/60 text-sm mt-4">
            View the Investments tab for detailed analysis of your investment portfolio.
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentSummary; 