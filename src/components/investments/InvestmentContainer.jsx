import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import GoalCard from './Goals/GoalCard';
import { FaSpinner, FaExclamationTriangle, FaPlus, FaTimes, FaChartLine } from 'react-icons/fa';
import InvestmentSection from './InvestmentSection';
import { FaCoins } from 'react-icons/fa';
import { LoadingOverlay } from '../LoadingOverlay';
import GoalForm from './Goals/GoalForm';

const InvestmentContainer = ({ investmentData, userId }) => {
  const [investmentGoals, setInvestmentGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  const loadGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }
      
      const q = query(
        collection(db, "investment_goals"),
        where("uid", "==", userId)
      );
      
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      setInvestmentGoals(goalsData);
    } catch (error) {
      console.error("Error loading investment goals:", error);
      setError("Could not load investment goals. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadGoals();
  }, []);
  
  if (isLoading) {
    return <LoadingOverlay message="Loading investments" submessage="Retrieving your financial goals..." />;
  }
  
  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
        <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Could Not Load Investment Goals</h3>
        <p className="text-white/60 mb-4">
          {error.includes("permissions") ? 
            "You don't have permission to access investment goals." : 
            error}
        </p>
        <button 
          onClick={loadGoals}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!investmentData) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
        <FaCoins className="text-white/40 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Investment Data</h3>
        <p className="text-white/60">
          Start tracking your investments to see insights and projections here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Investment Dashboard</h2>
        
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-white transition-colors"
        >
          <FaPlus />
          <span>Add Goal</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investmentGoals.length > 0 ? (
          investmentGoals.map(goal => (
            <GoalCard 
              key={goal.id}
              goal={goal} 
              refreshGoals={loadGoals} 
            />
          ))
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center col-span-2">
            <FaChartLine className="text-white/40 text-5xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Investment Goals</h3>
            <p className="text-white/60 mb-4">
              Set your first investment goal to track your progress and stay motivated.
            </p>
            <button 
              onClick={() => setShowGoalForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white"
            >
              Set First Goal
            </button>
          </div>
        )}
      </div>
      
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-white/20 rounded-xl p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Set Investment Goal</h3>
              <button 
                onClick={() => setShowGoalForm(false)}
                className="text-white/60 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <GoalForm 
              onSave={(goal) => {
                setShowGoalForm(false);
                loadGoals();
              }}
              onCancel={() => setShowGoalForm(false)}
            />
          </div>
        </div>
      )}
      
      <InvestmentSection insights={investmentData} userId={userId} />
    </div>
  );
};

export default InvestmentContainer; 