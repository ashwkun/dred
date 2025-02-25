import React from 'react';
import ModularInsightsView from './insights/InsightsView';

// This is just a wrapper component that uses the modular implementation
const InsightsView = (props) => {
  console.log("Wrapper InsightsView props:", props);
  return <ModularInsightsView 
    transactions={props.transactions} 
    cards={props.cards} 
    monthlyBudget={props.monthlyBudget} 
    onSetBudget={props.onSetBudget} 
    userId={props.userId} 
  />;
};

export default InsightsView; 