import React from 'react';
import { FaEdit, FaTrash, FaStar, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const GoalCard = ({ goal, onEdit, onDelete, onUpdateProgress }) => {
  const progressPercentage = goal.currentAmount / goal.targetAmount * 100;
  const timeElapsedMonths = Math.floor((new Date() - new Date(goal.createdAt.seconds * 1000)) / (1000 * 60 * 60 * 24 * 30));
  const totalMonths = goal.timeframe * 12;
  const timePercentage = Math.min(100, (timeElapsedMonths / totalMonths) * 100);
  
  // Determine if goal is on track
  const isOnTrack = progressPercentage >= timePercentage;
  
  return (
    <div className="flex-shrink-0 w-72 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20 mr-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="bg-white/10 p-2 rounded-lg mr-3">
            <FaStar className="text-yellow-400" />
          </div>
          <h4 className="text-white font-medium">{goal.name}</h4>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onEdit}
            className="text-white/60 hover:text-white p-1"
          >
            <FaEdit />
          </button>
          <button 
            onClick={onDelete}
            className="text-white/60 hover:text-red-400 p-1"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <div>Progress</div>
            <div>{Math.round(progressPercentage)}%</div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/60 text-xs">Target</p>
            <p className="text-white font-semibold">₹{goal.targetAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/60 text-xs">Current</p>
            <p className="text-white font-semibold">₹{goal.currentAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <FaCalendarAlt className="text-white/60" />
          <span className="text-white/80">{goal.timeframe} years</span>
          <span className="text-white/40">|</span>
          <FaChartLine className={isOnTrack ? 'text-green-400' : 'text-yellow-400'} />
          <span className={isOnTrack ? 'text-green-400' : 'text-yellow-400'}>
            {isOnTrack ? 'On track' : 'Falling behind'}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-white/70 text-sm">Monthly investment</div>
          <div className="text-white font-semibold">₹{goal.monthlyInvestment.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default GoalCard; 