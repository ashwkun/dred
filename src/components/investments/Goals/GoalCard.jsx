import React, { useState } from 'react';
import { FaEdit, FaTrash, FaStar, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { BiEdit, BiSave, BiX } from 'react-icons/bi';
import { FaCheck } from 'react-icons/fa';
import UpdateGoalProgress from './UpdateGoalProgress';
import { SuccessAnimation } from '../../SuccessAnimation';
import { toast } from 'react-hot-toast';

const GoalCard = ({ goal, onEdit, onDelete, onUpdateProgress, refreshGoals }) => {
  const [isEditing, setIsEditing] = useState(false); // Changed to false by default
  const [goalAmount, setGoalAmount] = useState(goal?.targetAmount || "");
  const [goalName, setGoalName] = useState(goal?.name || "");
  const [goalDate, setGoalDate] = useState(goal?.targetDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
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
      
      if (refreshGoals) refreshGoals();
      setIsEditing(false);
      
      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
      
    } catch (err) {
      console.error("Error setting investment goal:", err);
      setError("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate completion percentage
  const progressPercentage = goal ? Math.min(100, (goal.currentAmount / goal.targetAmount * 100)) : 0;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate remaining amount
  const remainingAmount = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0;
  
  // Function to update progress
  const handleUpdateProgress = async (newAmount) => {
    try {
      const goalRef = doc(db, "investment_goals", goal.id);
      await updateDoc(goalRef, {
        currentAmount: parseFloat(newAmount),
        updatedAt: new Date().toISOString()
      });
      toast.success("Progress updated successfully");
      if (onEdit) {
        onEdit(goal); // This will refresh the goal data
      }
    } catch (err) {
      console.error("Error updating progress:", err);
      toast.error("Failed to update progress");
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
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
      <div className="flex-shrink-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <div className="bg-white/10 p-2 rounded-lg mr-3">
              <FaStar className="text-yellow-400" />
            </div>
            <h4 className="text-white font-medium">{goal.name}</h4>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
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
                className={`h-full ${progressPercentage >= 75 ? 'bg-green-500' : progressPercentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/60 text-xs">Target</p>
              <p className="text-white font-semibold">{formatCurrency(goal.targetAmount)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/60 text-xs">Current</p>
              <p className="text-white font-semibold">{formatCurrency(goal.currentAmount)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            {goal.targetDate && (
              <>
                <FaCalendarAlt className="text-white/60" />
                <span className="text-white/80">{formatDate(goal.targetDate)}</span>
                <span className="text-white/40">|</span>
              </>
            )}
            <FaChartLine className={progressPercentage >= 50 ? 'text-green-400' : 'text-yellow-400'} />
            <span className={progressPercentage >= 50 ? 'text-green-400' : 'text-yellow-400'}>
              {progressPercentage >= 50 ? 'On track' : 'More effort needed'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-white/70 text-sm">Remaining</div>
            <div className="text-white font-semibold">{formatCurrency(remainingAmount)}</div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Update Progress</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Current amount"
                defaultValue={goal.currentAmount}
                min="0"
                max={goal.targetAmount}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  handleUpdateProgress(input.value);
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-lg text-sm"
              >
                Update
              </button>
            </div>
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