import React from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpendingTrends = ({ insights, isExpanded, toggleSection }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartLine className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Spending Trends</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && insights && (
        <div className="mt-4">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={Object.entries(insights.monthlySpending || {}).map(([month, amount]) => ({
                  month,
                  amount
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorUv)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingTrends; 