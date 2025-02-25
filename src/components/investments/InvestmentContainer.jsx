import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import GoalCard from './Goals/GoalCard';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import InvestmentSection from './InvestmentSection';
import { FaCoins } from 'react-icons/fa';
import { LoadingOverlay } from '../LoadingOverlay';

const InvestmentContainer = ({ investmentData, userId }) => {
  const [investmentGoals, setInvestmentGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
      <h2 className="text-2xl font-bold text-white mb-6">Investment Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary goal card - don't auto-show the form */}
        <GoalCard 
          goal={investmentGoals[0]} 
          refreshGoals={loadGoals} 
        />
        
        {/* If there's already a primary goal, show option for secondary goal */}
        {investmentGoals.length > 0 && (
          <GoalCard 
            goal={investmentGoals[1]} 
            refreshGoals={loadGoals} 
          />
        )}
      </div>
      
      {/* Add more investment-related components here */}
      <InvestmentSection insights={investmentData} userId={userId} />
    </div>
  );
};

export default InvestmentContainer; 