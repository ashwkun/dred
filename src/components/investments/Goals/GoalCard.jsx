import React, { useState } from 'react';
import { FaEdit, FaTrash, FaStar, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { BiEdit, BiSave, BiX } from 'react-icons/bi';
import { FaCheck } from 'react-icons/fa';
import UpdateGoalProgress from './UpdateGoalProgress';

const GoalCard = ({ goal, onEdit, onDelete, onUpdateProgress, refreshGoals }) => {
  const [isEditing, setIsEditing] = useState(!goal); // Start in edit mode if no goal exists
  const [goalAmount, setGoalAmount] = useState(goal?.targetAmount || "");
  const [goalName, setGoalName] = useState(goal?.name || "");
  const [goalDate, setGoalDate] = useState(goal?.targetDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSetGoal = async () => {
    if (!goalName || !goalAmount) {
      setError("Please set both a goal name and amount");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const goalId = goal?.id || `goal_${Date.now()}`;
      const goalRef = doc(db, "investment_goals", goalId);
      
      const goalObject = {
        id: goalId,
        uid: userId,
        name: goalName,
        targetAmount: parseFloat(goalAmount),
        targetDate: goalDate || null,
        currentAmount: goal?.currentAmount || 0,
        createdAt: goal?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check if document exists
      const docSnap = await getDoc(goalRef);
      
      if (docSnap.exists()) {
        await updateDoc(goalRef, goalObject);
      } else {
        await setDoc(goalRef, goalObject);
      }
      
      setIsEditing(false);
      if (refreshGoals) refreshGoals(); // Refresh parent component data
      
    } catch (err) {
      console.error("Error setting investment goal:", err);
      setError("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const progressPercentage = goal?.currentAmount / goal?.targetAmount * 100;
  const timeElapsedMonths = Math.floor((new Date() - new Date(goal?.createdAt.seconds * 1000)) / (1000 * 60 * 60 * 24 * 30));
  const totalMonths = goal?.timeframe * 12;
  const timePercentage = Math.min(100, (timeElapsedMonths / totalMonths) * 100);
  
  // Determine if goal is on track
  const isOnTrack = progressPercentage >= timePercentage;
  
  if (isEditing) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 h-full">
        <h3 className="text-lg font-semibold text-white mb-4">
          {goal ? "Edit Investment Goal" : "Set Investment Goal"}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1">Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Retirement, House, Education..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-white/70 text-sm mb-1">Target Amount (₹)</label>
            <input
              type="number"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="1000000"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-white/70 text-sm mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSetGoal}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg py-2 px-4 flex-1 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <BiSave />
                  <span>Save Goal</span>
                </>
              )}
            </button>
            
            {goal && (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-4 transition-colors"
              >
                <BiX />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Display mode
  if (goal) {
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
        {goal && (
          <UpdateGoalProgress 
            goalId={goal.id}
            currentAmount={goal.currentAmount}
            refreshGoals={refreshGoals}
          />
        )}
      </div>
    );
  }
  
  // Empty state / no goal set yet
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 h-full flex flex-col items-center justify-center text-center">
      <FaChartLine className="text-purple-400 text-4xl mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">Set an Investment Goal</h3>
      <p className="text-white/60 text-sm mb-4">
        Define your financial targets and track your progress over time.
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg py-2 px-4 hover:opacity-90 transition-opacity"
      >
        <span>Set Goal</span>
      </button>
    </div>
  );
};

export default GoalCard; 