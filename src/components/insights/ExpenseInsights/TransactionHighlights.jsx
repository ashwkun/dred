import React from 'react';
import { FaRegLightbulb, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { BiRightArrowAlt } from 'react-icons/bi';
import { formatCurrency } from '../../../utils/formatting';

const TransactionHighlights = ({ insights, isExpanded, toggleSection }) => {
  const { recentTransactions = [] } = insights;
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaRegLightbulb className="text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Transaction Highlights</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Recent Transactions Section */}
          <div>
            <h4 className="text-white/70 text-sm mb-3">Recent Transactions</h4>
            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{transaction.merchant}</span>
                        <span className="text-white/50 text-xs">{transaction.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-sm">{formatDate(transaction.date)}</span>
                      <span className="text-white font-medium">₹{parseFloat(transaction.amount).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                
                {recentTransactions.length > 5 && (
                  <div className="flex justify-center mt-2">
                    <button className="text-white/60 text-sm flex items-center hover:text-white transition-colors">
                      View all {recentTransactions.length} recent transactions
                      <BiRightArrowAlt className="ml-1" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-white/50">
                No recent transactions found
              </div>
            )}
          </div>
          
          {/* Transaction Insights & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Largest Transaction */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-white/70 text-sm mb-2">Largest Transaction</h4>
              {insights.largestTransaction ? (
                <div>
                  <p className="text-xl font-semibold text-white">
                    ₹{parseFloat(insights.largestTransaction.amount).toFixed(2)}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {insights.largestTransaction.merchant} • {formatDate(insights.largestTransaction.date)}
                  </p>
                </div>
              ) : (
                <p className="text-white/50">No data available</p>
              )}
            </div>
            
            {/* Most Frequent Merchant */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-white/70 text-sm mb-2">Most Frequent Merchant</h4>
              {insights.topMerchant ? (
                <div>
                  <p className="text-xl font-semibold text-white">
                    {insights.topMerchant.name}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {insights.topMerchant.count} transactions • ₹{insights.topMerchant.amount.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-white/50">No data available</p>
              )}
            </div>
          </div>
          
          {/* Transaction Patterns */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 mt-4">
            <h4 className="text-white/70 text-sm mb-3">Transaction Patterns</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <span className="text-white/50 text-xs">Average Transaction</span>
                <span className="text-white font-medium">
                  ₹{insights.avgTransactionSize ? insights.avgTransactionSize.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/50 text-xs">Transaction Frequency</span>
                <span className="text-white font-medium">
                  {insights.transactionFrequency || 'No data'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/50 text-xs">Most Active Time</span>
                <span className="text-white font-medium">
                  {insights.mostActiveTime || 'No data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHighlights; 