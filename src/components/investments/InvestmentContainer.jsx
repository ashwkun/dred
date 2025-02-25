import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import GoalCard from './Goals/GoalCard';
import { FaSpinner } from 'react-icons/fa';
import InvestmentSection from './InvestmentSection';
import { FaCoins } from 'react-icons/fa';

const InvestmentContainer = ({ investmentData, userId }) => {
  const [investmentGoals, setInvestmentGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
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
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadGoals();
  }, []);
  
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
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <FaSpinner className="text-white/60 text-2xl animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary goal card */}
          <GoalCard 
            goalData={investmentGoals[0]} 
            refreshGoals={loadGoals} 
          />
          
          {/* If there's already a primary goal, show option for secondary goal */}
          {investmentGoals.length > 0 && (
            <GoalCard 
              goalData={investmentGoals[1]} 
              refreshGoals={loadGoals} 
            />
          )}
        </div>
      )}
      
      {/* Add more investment-related components here */}
      <InvestmentSection insights={investmentData} userId={userId} />
    </div>
  );
};

export default InvestmentContainer; 