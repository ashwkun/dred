import React from 'react';
import { FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const RecurringExpenses = ({ insights, isExpanded, toggleSection }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">Recurring Expenses</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && insights && (
        <div className="mt-4">
          {insights.recurringExpenses && insights.recurringExpenses.length > 0 ? (
            <div className="space-y-3">
              {/* Recurring expenses list */}
              {insights.recurringExpenses.map((expense, index) => (
                <div key={index} className="bg-white/5 p-3 rounded-lg flex justify-between">
                  <div>
                    <p className="text-white">{expense.merchant}</p>
                    <p className="text-white/60 text-sm">{expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">₹{Math.round(expense.amount).toLocaleString()}</p>
                    <p className="text-white/60 text-sm">{expense.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-center py-3">No recurring expenses detected</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses; 