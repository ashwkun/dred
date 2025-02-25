import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import InvestmentSection from './InvestmentSection';
import { FaCoins } from 'react-icons/fa';
import { LoadingOverlay } from '../LoadingOverlay';
import InvestmentDashboard from './InvestmentDashboard';

const InvestmentContainer = ({ investmentData, userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (isLoading) {
    return <LoadingOverlay message="Loading investments" submessage="Retrieving your financial data..." />;
  }
  
  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
        <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Could Not Load Investment Data</h3>
        <p className="text-white/60 mb-4">
          {error.includes("permissions") ? 
            "You don't have permission to access investment data." : 
            error}
        </p>
        <button 
          onClick={() => window.location.reload()}
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Investment Dashboard</h2>
      
      {/* Investment Goals Section */}
      <InvestmentDashboard />
      
      {/* Investment Analysis Section */}
      <InvestmentSection insights={investmentData} userId={userId} />
    </div>
  );
};

export default InvestmentContainer; 