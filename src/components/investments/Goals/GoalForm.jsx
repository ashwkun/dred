import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { FaSpinner } from 'react-icons/fa';

const GoalForm = ({ initialGoal = null, onClose, onSuccess }) => {
  const [goalName, setGoalName] = useState(initialGoal?.name || "");
  const [targetAmount, setTargetAmount] = useState(initialGoal?.targetAmount || "");
  const [targetDate, setTargetDate] = useState(initialGoal?.targetDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!goalName.trim()) {
      setError("Please enter a goal name");
      return;
    }
    
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      setError("Please enter a valid target amount");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const goalData = {
        name: goalName.trim(),
        targetAmount: parseFloat(targetAmount),
        uid: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentAmount: initialGoal?.currentAmount || 0,
        targetDate: targetDate || null,
        timeframe: initialGoal?.timeframe || 5, // Default to 5 years if not specified
        monthlyInvestment: initialGoal?.monthlyInvestment || Math.round(parseFloat(targetAmount) / 60) // Simple calculation
      };
      
      // Check if we're updating or creating
      if (initialGoal?.id) {
        // Update existing goal
        const goalRef = doc(db, "investment_goals", initialGoal.id);
        await updateDoc(goalRef, goalData);
      } else {
        // Create new goal
        await addDoc(collection(db, "investment_goals"), goalData);
      }
      
      // Clear form
      setGoalName("");
      setTargetAmount("");
      setTargetDate("");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close form if needed
      if (onClose) {
        onClose();
      }
      
    } catch (err) {
      console.error("Error saving goal:", err);
      setError("Failed to save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-4">
        {initialGoal ? "Edit Investment Goal" : "Set Investment Goal"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-1">Goal Name</label>
          <input
            type="text"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="Retirement, House, Education..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-white/70 text-sm mb-1">Target Amount (₹)</label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="1000000"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        
        <div>
          <label className="block text-white/70 text-sm mb-1">Target Date (Optional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg py-2 px-4 flex-1 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </span>
            ) : (
              <>
                <span>Save Goal</span>
              </>
            )}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-4 transition-colors"
            >
              <span>Cancel</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GoalForm; 