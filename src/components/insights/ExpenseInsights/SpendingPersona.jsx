import React from 'react';
import { motion } from 'framer-motion';
import { FaBalanceScale, FaHandHoldingUsd, FaRegCreditCard, FaShoppingBag, 
  FaChartBar, FaCoffee, FaGem } from 'react-icons/fa';

const SpendingPersona = ({ insights }) => {
  // This function is extracted from the original component
  const determinePersona = () => {
    if (!insights) return null;
    
    const categoryDistribution = Object.entries(insights.categorySpending || {});
    const budgetAdherence = insights.budgetStatus;
    const weekendRatio = insights.weeklyAnalysis?.weekendAvg / insights.weeklyAnalysis?.weekdayAvg || 1;
    
    // Categories we're interested in
    const foodPercentage = (insights.categorySpending?.['Food & Dining'] || 0) / insights.thisMonthTotal || 0;
    const entertainmentPercentage = (insights.categorySpending?.['Entertainment'] || 0) / insights.thisMonthTotal || 0; 
    const shoppingPercentage = (insights.categorySpending?.['Shopping'] || 0) / insights.thisMonthTotal || 0;
    const billsPercentage = (insights.categorySpending?.['Bills & Utilities'] || 0) / insights.thisMonthTotal || 0;
    
    // Determine persona based on spending patterns
    if (budgetAdherence > 95) {
      return {
        type: 'The Maxed Out',
        icon: <FaRegCreditCard className="text-red-400" />,
        description: 'You tend to use all available budget, consider setting aside savings first'
      };
    } else if (budgetAdherence < 70 && insights.thisMonthTotal < insights.lastMonthTotal * 0.8) {
      return {
        type: 'The Saver',
        icon: <FaHandHoldingUsd className="text-green-400" />,
        description: 'You consistently spend under budget and save money'
      };
    } else if (foodPercentage > 0.3) {
      return {
        type: 'The Foodie',
        icon: <FaCoffee className="text-yellow-400" />,
        description: 'A significant portion of your budget goes to food & dining'
      };
    }
    
    // Add other persona types...
    
    return {
      type: 'The Balanced',
      icon: <FaBalanceScale className="text-blue-400" />,
      description: 'Your spending is well-distributed across different categories'
    };
  };

  const persona = determinePersona();
  
  if (!persona) return null;

  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-800/30 to-indigo-900/30 backdrop-blur-lg rounded-xl p-4 border border-purple-500/20"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
          initial={{ rotate: -10 }}
          animate={{ rotate: 10 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          {persona.icon}
        </motion.div>
        <div>
          <p className="text-white/60 text-xs">Your Spending Persona</p>
          <h3 className="text-white font-semibold">{persona.type}</h3>
        </div>
      </div>
      <p className="text-white/80 text-sm mt-2">
        {persona.description}
      </p>
    </motion.div>
  );
};

export default SpendingPersona; 