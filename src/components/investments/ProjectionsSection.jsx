import React from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectionsSection = ({ insights, isExpanded, toggleSection }) => {
  // Generate projection data
  const generateProjectionData = () => {
    const data = [];
    const currentValue = insights?.totalInvested || 100000;
    const monthlyAddition = insights?.monthlyInvestment || 10000;
    const growthRates = [0.08, 0.12, 0.15]; // 8%, 12%, 15% annual returns
    
    for (let year = 0; year <= 10; year++) {
      const yearData = { year };
      
      growthRates.forEach((rate, index) => {
        const rateKey = `growth${index}`;
        if (year === 0) {
          yearData[rateKey] = currentValue;
        } else {
          const prevValue = data[year-1][rateKey];
          yearData[rateKey] = (prevValue + (monthlyAddition * 12)) * (1 + rate);
        }
      });
      
      data.push(yearData);
    }
    
    return data;
  };

  const projectionData = generateProjectionData();
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartLine className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Investment Projections</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <p className="text-white/70 mb-3">Portfolio growth over the next 10 years:</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={projectionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Years', position: 'insideBottomRight', offset: -5 }}
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                  tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="growth0" 
                  name="Conservative (8%)"
                  stroke="#818cf8" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="growth1" 
                  name="Moderate (12%)"
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="growth2" 
                  name="Aggressive (15%)"
                  stroke="#fb7185" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
              <p className="text-white/60 text-sm">Conservative (8%)</p>
              <p className="text-white font-bold text-xl">₹{Math.round(projectionData[10].growth0).toLocaleString()}</p>
              <p className="text-blue-400 text-sm">
                {((projectionData[10].growth0 / projectionData[0].growth0 - 1) * 100).toFixed(0)}% growth
              </p>
            </div>
            
            <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/20">
              <p className="text-white/60 text-sm">Moderate (12%)</p>
              <p className="text-white font-bold text-xl">₹{Math.round(projectionData[10].growth1).toLocaleString()}</p>
              <p className="text-green-400 text-sm">
                {((projectionData[10].growth1 / projectionData[0].growth1 - 1) * 100).toFixed(0)}% growth
              </p>
            </div>
            
            <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20">
              <p className="text-white/60 text-sm">Aggressive (15%)</p>
              <p className="text-white font-bold text-xl">₹{Math.round(projectionData[10].growth2).toLocaleString()}</p>
              <p className="text-red-400 text-sm">
                {((projectionData[10].growth2 / projectionData[0].growth2 - 1) * 100).toFixed(0)}% growth
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionsSection; 