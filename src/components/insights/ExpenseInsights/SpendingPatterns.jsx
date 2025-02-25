import React from 'react';
import { FaChartBar, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const SpendingPatterns = ({ insights, isExpanded, toggleSection }) => {
  // Safe data extraction with fallbacks
  const weekdayTotal = insights?.weekdayWeekendSpending?.weekday || 0;
  const weekendTotal = insights?.weekdayWeekendSpending?.weekend || 0;
  const total = weekdayTotal + weekendTotal;
  const weekdayPercentage = total > 0 ? (weekdayTotal / total) * 100 : 0;
  const weekendPercentage = total > 0 ? (weekendTotal / total) * 100 : 0;
  
  // Safely extract day of week data with fallbacks
  const dayOfWeekData = insights?.dayOfWeekSpending || {};
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Find the maximum value for scaling
  let maxDayAmount = 0;
  days.forEach(day => {
    const amount = dayOfWeekData[day] || 0;
    if (amount > maxDayAmount) maxDayAmount = amount;
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartBar className="text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Spending Patterns</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white/60 text-sm mb-3">Weekday vs Weekend</h4>
              <div className="flex items-stretch h-28">
                <div className="flex flex-col items-center justify-between flex-1">
                  <div className="text-white/80 text-sm">Weekday</div>
                  <div className="w-full bg-white/5 rounded-lg h-16 relative">
                    <div 
                      className="absolute bottom-0 w-full bg-blue-500 rounded-lg"
                      style={{ height: `${weekdayPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-white font-semibold">
                    {Math.round(weekdayPercentage)}%
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-between flex-1">
                  <div className="text-white/80 text-sm">Weekend</div>
                  <div className="w-full bg-white/5 rounded-lg h-16 relative">
                    <div 
                      className="absolute bottom-0 w-full bg-purple-500 rounded-lg"
                      style={{ height: `${weekendPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-white font-semibold">
                    {Math.round(weekendPercentage)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white/60 text-sm mb-3">Spending by Day of Week</h4>
              <div className="grid grid-cols-7 gap-1 h-36">
                {days.map((day, index) => {
                  const dayAmount = dayOfWeekData[day] || 0;
                  const heightPercentage = maxDayAmount > 0 ? (dayAmount / maxDayAmount) * 100 : 0;
                  
                  return (
                    <div key={day} className="flex flex-col items-center justify-end">
                      <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '80%' }}>
                        <div 
                          className={`absolute bottom-0 w-full ${index >= 5 ? 'bg-purple-500' : 'bg-blue-500'} rounded-t-lg`}
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-white/60 text-xs mt-1">{dayLabels[index]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingPatterns; 