import React, { useState, useEffect } from 'react';
import { FaChartLine, FaWallet, FaInfoCircle } from 'react-icons/fa';
import InvestmentDashboard from './InvestmentDashboard';
import InvestmentSection from './InvestmentSection';
import { calculateInsights } from '../../utils/insights';
import { LoadingOverlay } from '../LoadingOverlay';

const InvestmentContainer = ({ investmentData, userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  
  // Normalize the investment data to ensure we have all expected properties
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Make sure investmentData has the expected structure
      // This is to handle potential inconsistencies in data passed from different sources
      const normalizedData = investmentData || {
        totalInvested: 0,
        portfolioDistribution: {},
        monthlyInvestmentTrends: {},
        projections: {
          oneYear: 0,
          threeYear: 0,
          fiveYear: 0,
          tenYear: 0
        },
        sipImpact: {},
        investmentGrowth: 0
      };
      
      setInsights(normalizedData);
    } catch (error) {
      console.error("Error normalizing investment data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [investmentData]);
  
  if (isLoading) {
    return <LoadingOverlay message="Loading investment data" submessage="Analyzing your portfolio..." />;
  }
  
  if (!insights) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">No investment data available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Investment Dashboard</h2>
      
      {/* Investment Analysis Section - Using only a single InvestmentSection component
          which already includes the GoalManager component */}
      <InvestmentSection insights={insights} userId={userId} />
    </div>
  );
};

export default InvestmentContainer; 