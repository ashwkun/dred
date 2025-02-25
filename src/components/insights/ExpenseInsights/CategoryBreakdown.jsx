import React from 'react';
import { FaChartPie, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CategoryBreakdown = ({ insights, isExpanded, toggleSection }) => {
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartPie className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Category Analysis</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && insights && (
        <div className="mt-4">
          {/* Add category breakdown visualization from original component */}
          <div className="h-80 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights.categoryInsights?.topCategories || []}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(insights.categoryInsights?.topCategories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown; 