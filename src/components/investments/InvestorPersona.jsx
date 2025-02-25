import React from 'react';
import { motion } from 'framer-motion';
import { FaUserTie, FaSeedling, FaChartLine, FaBalanceScale, FaUniversity } from 'react-icons/fa';

const InvestorPersona = ({ insights }) => {
  const determinePersona = () => {
    if (!insights) return null;
    
    const totalInvested = insights.totalInvested || 0;
    const diversity = Object.keys(insights.portfolioDistribution || {}).length;
    const consistency = insights.investmentTrends?.consistency || 'New';
    
    if (totalInvested > 1000000) {
      return {
        type: 'The Strategic Investor',
        icon: <FaChartLine className="text-blue-400" />,
        description: 'You invest with purpose and have built a substantial portfolio.'
      };
    } else if (diversity >= 4) {
      return {
        type: 'The Diversifier',
        icon: <FaBalanceScale className="text-green-400" />,
        description: 'You spread your investments across multiple instruments to manage risk.'
      };
    } else if (consistency === 'High') {
      return {
        type: 'The Disciplined Investor',
        icon: <FaUniversity className="text-amber-400" />,
        description: 'You invest regularly and consistently, building wealth through discipline.'
      };
    } else {
      return {
        type: 'The Growth Seeker',
        icon: <FaSeedling className="text-emerald-400" />,
        description: 'You\'re building a foundation for financial growth through smart investments.'
      };
    }
  };

  const persona = determinePersona();
  
  if (!persona) return null;

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-800/30 to-cyan-900/30 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 3 }}
        >
          {persona.icon}
        </motion.div>
        <div>
          <p className="text-white/60 text-xs">Your Investor Persona</p>
          <h3 className="text-white font-semibold">{persona.type}</h3>
        </div>
      </div>
      <p className="text-white/80 text-sm mt-2">
        {persona.description}
      </p>
    </motion.div>
  );
};

export default InvestorPersona; 