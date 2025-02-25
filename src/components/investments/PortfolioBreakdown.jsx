import React from 'react';
import { FaChartPie, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PortfolioBreakdown = ({ insights, isExpanded, toggleSection }) => {
  const COLORS = ['#4ade80', '#818cf8', '#fb7185', '#facc15', '#38bdf8', '#a78bfa'];
  
  const portfolioData = insights && insights.portfolioDistribution 
    ? Object.entries(insights.portfolioDistribution).map(([name, value]) => ({
        name,
        value
      }))
    : [
        { name: 'Mutual Funds', value: 45 },
        { name: 'Stocks', value: 30 },
        { name: 'Fixed Deposits', value: 15 },
        { name: 'Gold', value: 10 }
      ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartPie className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Portfolio Breakdown</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Allocation']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {portfolioData.map((item, index) => (
              <div key={index} className="bg-white/5 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <p className="text-white/80 text-sm truncate">{item.name}</p>
                </div>
                <p className="text-white font-medium ml-5">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioBreakdown; 