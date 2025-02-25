import React from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceSection = ({ insights, isExpanded, toggleSection }) => {
  // Generate sample performance data if missing from insights
  const performanceData = insights?.performanceData || [
    { name: 'Jan', returns: 2.3 },
    { name: 'Feb', returns: -1.2 },
    { name: 'Mar', returns: 3.5 },
    { name: 'Apr', returns: 1.8 },
    { name: 'May', returns: -0.6 },
    { name: 'Jun', returns: 2.1 }
  ];
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartLine className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Performance Summary</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">Total Invested</p>
              <p className="text-white font-bold text-xl">₹{(insights?.totalInvested || 0).toLocaleString()}</p>
              <p className="text-green-400 text-sm">
                +₹{((insights?.monthlyInvestment || 0) * 3).toLocaleString()} last 3 months
              </p>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">Current Value</p>
              <p className="text-white font-bold text-xl">₹{(insights?.currentValue || 0).toLocaleString()}</p>
              <p className="text-green-400 text-sm">
                +{insights?.overallReturns || 12}% overall returns
              </p>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">Monthly Investment</p>
              <p className="text-white font-bold text-xl">₹{(insights?.monthlyInvestment || 0).toLocaleString()}</p>
              <p className="text-white/60 text-sm">
                across {Object.keys(insights?.portfolioDistribution || {}).length || 0} instruments
              </p>
            </div>
          </div>
          
          <h4 className="text-white/60 text-sm mb-2">Monthly Performance</h4>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Returns']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="returns" 
                  fill={(data) => data.returns >= 0 ? '#4ade80' : '#fb7185'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceSection; 