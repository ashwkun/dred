import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { FaPlus, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import GoalCard from './Goals/GoalCard';
import GoalForm from './Goals/GoalForm';
import { toast } from 'react-hot-toast';

const InvestmentDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const q = query(
        collection(db, "investment_goals"),
        where("uid", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const goalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setGoals(goalsData);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load investment goals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGoals();
  }, []);
  
  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowAddGoalForm(true);
  };
  
  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowAddGoalForm(true);
  };
  
  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteDoc(doc(db, "investment_goals", goalId));
      toast.success("Goal deleted successfully");
      fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      toast.error("Failed to delete goal");
    }
  };
  
  const handleGoalSuccess = () => {
    toast.success(editingGoal ? "Goal updated successfully" : "Goal created successfully");
    fetchGoals();
    setShowAddGoalForm(false);
    setEditingGoal(null);
  };
  
  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-white text-2xl" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
        <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Could Not Load Investment Goals</h3>
        <p className="text-white/60 mb-4">{error}</p>
        <button 
          onClick={fetchGoals}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Financial Goals</h2>
        <button 
          onClick={handleAddGoal}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <FaPlus className="text-white" />
        </button>
      </div>
      
      {goals.length === 0 && !showAddGoalForm ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
          <p className="text-white/80 mb-4">You haven't set any financial goals yet.</p>
          <p className="text-white/60 mb-6">Set goals to track your progress towards big purchases, savings, or investments.</p>
          <button
            onClick={handleAddGoal}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg py-2 px-4 hover:opacity-90 transition-opacity"
          >
            Set Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {showAddGoalForm && (
            <GoalForm 
              initialGoal={editingGoal} 
              onClose={() => {
                setShowAddGoalForm(false);
                setEditingGoal(null);
              }}
              onSuccess={handleGoalSuccess}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={() => handleEditGoal(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentDashboard; 