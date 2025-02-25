// Main container component
import React, { useState, useEffect } from 'react';
import { calculateInsights } from '../../utils/insights';
import TabNavigation from './TabNavigation';
import ExpenseInsights from './ExpenseInsights/ExpenseInsights';
import InvestmentContainer from '../investments/InvestmentContainer';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { LoadingOverlay } from '../LoadingOverlay';

const ModularInsightsView = (props) => {
  console.log("ModularInsightsView props:", props, "userId specifically:", props.userId);
  const [activeTab, setActiveTab] = useState('expenses');
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const calculatedInsights = calculateInsights(props.transactions, props.monthlyBudget);
    setInsights(calculatedInsights);
    setIsLoading(false);
  }, [props.transactions, props.monthlyBudget]);

  if (isLoading) {
    return <LoadingOverlay message="Processing insights" submessage="Analyzing your financial data..." />;
  }

  return (
    <div className="space-y-6">
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {activeTab === 'expenses' ? (
        <ExpenseInsights 
          transactions={props.transactions} 
          monthlyBudget={props.monthlyBudget} 
          onSetBudget={props.onSetBudget} 
          userId={props.userId}
        />
      ) : (
        <InvestmentContainer 
          investmentData={insights?.investments || insights?.investmentData} 
          userId={props.userId} 
        />
      )}
    </div>
  );
};

export default ModularInsightsView; 