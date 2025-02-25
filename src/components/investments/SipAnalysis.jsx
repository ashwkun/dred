import React from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SipAnalysis = ({ insights, isExpanded, toggleSection }) => {
  // Generate SIP projection data
  const generateProjectionData = () => {
    const data = [];
    const monthlyInvestment = insights?.monthlyInvestment || 10000;
    const annualReturn = 0.12; // 12% annual return
    const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
    let totalInvestment = 0;
    let investmentValue = 0;
    
    for (let year = 0; year <= 20; year++) {
      if (year > 0) {
        for (let month = 0; month < 12; month++) {
          totalInvestment += monthlyInvestment;
          investmentValue = (investmentValue + monthlyInvestment) * (1 + monthlyReturn);
        }
      }
      
      data.push({
        year,
        investment: totalInvestment,
        returns: investmentValue - totalInvestment,
        total: investmentValue
      });
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
          <FaChartLine className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">SIP Growth Analysis</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <p className="text-white/70 mb-3">
            Impact of monthly SIP investment over time (₹{insights?.monthlyInvestment?.toLocaleString() || '10,000'}/month)
          </p>
          
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
                  dataKey="total" 
                  name="Total Value"
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="investment" 
                  name="Amount Invested"
                  stroke="#818cf8" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="returns" 
                  name="Returns"
                  stroke="#fb7185" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">After 10 Years</p>
              <p className="text-white font-bold text-xl">₹{Math.round(projectionData[10].total).toLocaleString()}</p>
              <p className="text-green-400 text-sm">
                +₹{Math.round(projectionData[10].returns).toLocaleString()} returns
              </p>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">After 20 Years</p>
              <p className="text-white font-bold text-xl">₹{Math.round(projectionData[20].total).toLocaleString()}</p>
              <p className="text-green-400 text-sm">
                +₹{Math.round(projectionData[20].returns).toLocaleString()} returns
              </p>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-sm">Returns Multiplier</p>
              <p className="text-white font-bold text-xl">
                {(projectionData[20].total / projectionData[20].investment).toFixed(1)}x
              </p>
              <p className="text-white/60 text-sm">
                at 12% estimated annual returns
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SipAnalysis; 