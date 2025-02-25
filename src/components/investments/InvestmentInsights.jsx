import React from 'react';
import { FaRegLightbulb, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const InvestmentInsights = ({ insights, isExpanded, toggleSection }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaRegLightbulb className="text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Investment Insights</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-2">
              <span className="mt-1">💡</span>
              <div>
                <p className="text-white font-medium">Diversification</p>
                <p className="text-white/90">
                  {insights && insights.portfolioDistribution && Object.keys(insights.portfolioDistribution).length <= 2 
                    ? "Consider adding more investment types to diversify your portfolio and reduce risk."
                    : "Your portfolio shows good diversification across different investment types."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg border bg-purple-500/10 border-purple-500/20">
            <div className="flex items-start gap-2">
              <span className="mt-1">📊</span>
              <div>
                <p className="text-white font-medium">Regular Investing</p>
                <p className="text-white/90">
                  Setting up systematic investment plans (SIPs) can help you build wealth consistently over time.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/20">
            <div className="flex items-start gap-2">
              <span className="mt-1">🎯</span>
              <div>
                <p className="text-white font-medium">Tax Efficiency</p>
                <p className="text-white/90">
                  Consider tax-efficient investment options like ELSS funds or PPF to optimize your returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentInsights; 