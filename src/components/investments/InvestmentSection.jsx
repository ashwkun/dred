import React, { useState, useEffect } from 'react';
import { FaChartLine, FaWallet, FaInfoCircle, FaBullseye } from 'react-icons/fa';
import InvestorPersona from './InvestorPersona';
import GoalManager from './Goals/GoalManager';
import PerformanceSection from './PerformanceSection';
import PortfolioBreakdown from './PortfolioBreakdown';
import ProjectionsSection from './ProjectionsSection';
import InvestmentInsights from './InvestmentInsights';
import SipAnalysis from './SipAnalysis';
import { formatCurrency } from '../../utils/formatting';

const InvestmentSection = ({ insights, userId }) => {
  const [expandedSections, setExpandedSections] = useState({
    goals: true,
    summary: true,
    portfolio: true,
    performance: true,
    projections: true,
    recommendations: true,
    sipImpact: true
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Make sure we have valid insight data
  const safeInsights = insights || {
    totalInvested: 0,
    portfolioDistribution: {},
    monthlyInvestmentTrends: {},
    projections: {
      oneYear: 0,
      threeYear: 0,
      fiveYear: 0,
      tenYear: 0
    }
  };
  
  // Format total invested amount
  const totalInvested = safeInsights.totalInvested || 0;
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalInvested);
  
  return (
    <div className="space-y-6">
      {/* Investment Summary Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Investment Overview</h3>
            <p className="text-white/60 text-sm">Track your investments and growth projections</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[150px]">
              <p className="text-white/60 text-xs mb-1">Total Invested</p>
              <p className="text-xl font-semibold text-white">{formattedTotal}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-[150px]">
              <p className="text-white/60 text-xs mb-1">Monthly SIP</p>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(safeInsights.monthlySIP || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <InvestorPersona insights={safeInsights} />
      
      {/* Unified Goal Manager */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div 
          className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
          onClick={() => toggleSection('goals')}
        >
          <div className="flex items-center gap-2">
            <FaBullseye className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Investment Goals</h3>
          </div>
          <button className="text-white/60">
            {expandedSections.goals ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {expandedSections.goals && (
          <div className="px-4 pb-6">
            <GoalManager userId={userId} />
          </div>
        )}
      </div>
      
      <PerformanceSection 
        insights={safeInsights} 
        isExpanded={expandedSections.summary}
        toggleSection={() => toggleSection('summary')}
      />
      
      <PortfolioBreakdown 
        insights={safeInsights} 
        isExpanded={expandedSections.portfolio}
        toggleSection={() => toggleSection('portfolio')}
      />
      
      <ProjectionsSection 
        insights={safeInsights} 
        isExpanded={expandedSections.projections}
        toggleSection={() => toggleSection('projections')}
      />
      
      <InvestmentInsights 
        insights={safeInsights} 
        isExpanded={expandedSections.recommendations}
        toggleSection={() => toggleSection('recommendations')}
      />
      
      <SipAnalysis 
        insights={safeInsights} 
        isExpanded={expandedSections.sipImpact}
        toggleSection={() => toggleSection('sipImpact')}
      />
    </div>
  );
};

export default InvestmentSection; 