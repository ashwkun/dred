import React, { useState } from 'react';
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { BiSave, BiX } from 'react-icons/bi';

const GoalForm = ({ existingGoal, onSave, onCancel }) => {
  const [goalAmount, setGoalAmount] = useState(existingGoal?.targetAmount || "");
  const [goalName, setGoalName] = useState(existingGoal?.name || "");
  const [goalDate, setGoalDate] = useState(existingGoal?.targetDate || "");
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
      
      const goalId = existingGoal?.id || `goal_${Date.now()}`;
      const goalRef = doc(db, "investment_goals", goalId);
      
      const goalObject = {
        id: goalId,
        uid: userId,
        name: goalName,
        targetAmount: parseFloat(goalAmount),
        targetDate: goalDate || null,
        currentAmount: existingGoal?.currentAmount || 0,
        createdAt: existingGoal?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeframe: existingGoal?.timeframe || 5, // Default 5 year timeframe if not specified
        monthlyInvestment: parseFloat(goalAmount) / 60 // Simple calculation, can be improved
      };
      
      // Check if document exists
      const docSnap = await getDoc(goalRef);
      
      if (docSnap.exists()) {
        await updateDoc(goalRef, goalObject);
      } else {
        await setDoc(goalRef, goalObject);
      }
      
      // Call the onSave callback to inform parent component
      if (onSave) onSave(goalObject);
      
    } catch (err) {
      console.error("Error setting investment goal:", err);
      setError("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
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
        
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-4 transition-colors"
        >
          <BiX />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default GoalForm; 