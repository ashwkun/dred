import React, { useState } from 'react';
import { FaChartLine, FaWallet, FaInfoCircle } from 'react-icons/fa';
import InvestorPersona from './InvestorPersona';
import GoalManager from './Goals/GoalManager';
import PerformanceSection from './PerformanceSection';
import PortfolioBreakdown from './PortfolioBreakdown';
import ProjectionsSection from './ProjectionsSection';
import InvestmentInsights from './InvestmentInsights';
import SipAnalysis from './SipAnalysis';

const InvestmentSection = ({ insights, userId }) => {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    goals: true, 
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
  
  return (
    <div className="space-y-6">
      <InvestorPersona insights={insights} />
      
      <GoalManager userId={userId} />
      
      <PerformanceSection 
        insights={insights} 
        isExpanded={expandedSections.summary}
        toggleSection={() => toggleSection('summary')}
      />
      
      <PortfolioBreakdown 
        insights={insights} 
        isExpanded={expandedSections.portfolio}
        toggleSection={() => toggleSection('portfolio')}
      />
      
      <ProjectionsSection 
        insights={insights} 
        isExpanded={expandedSections.projections}
        toggleSection={() => toggleSection('projections')}
      />
      
      <InvestmentInsights 
        insights={insights} 
        isExpanded={expandedSections.recommendations}
        toggleSection={() => toggleSection('recommendations')}
      />
      
      <SipAnalysis 
        insights={insights} 
        isExpanded={expandedSections.sipImpact}
        toggleSection={() => toggleSection('sipImpact')}
      />
    </div>
  );
};

export default InvestmentSection; 