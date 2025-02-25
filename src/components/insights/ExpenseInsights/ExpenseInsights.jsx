import React, { useState } from 'react';
import BudgetOverview from './BudgetOverview';
import CategoryBreakdown from './CategoryBreakdown';
import SpendingTrends from './SpendingTrends';
import SpendingPatterns from './SpendingPatterns';
import RecurringExpenses from './RecurringExpenses';
import SpendingPersona from './SpendingPersona';

const ExpenseInsights = (props) => {
  console.log("ExpenseInsights props:", props);
  const [expandedSections, setExpandedSections] = useState({
    budget: true,
    category: false,
    trends: false,
    patterns: false,
    recurring: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const insights = processTransactions(props.transactions);

  if (!insights) {
    return <div className="text-white/70 text-center py-6">No data available for insights</div>;
  }

  return (
    <div className="space-y-6">
      <SpendingPersona insights={insights} />
      
      <BudgetOverview 
        insights={insights} 
        monthlyBudget={props.monthlyBudget} 
        onSetBudget={props.onSetBudget} 
        userId={props.userId}
        isExpanded={expandedSections.budget}
        toggleSection={() => toggleSection('budget')}
      />
      
      <CategoryBreakdown 
        insights={insights}
        isExpanded={expandedSections.category}
        toggleSection={() => toggleSection('category')}
      />
      
      <SpendingTrends 
        insights={insights}
        isExpanded={expandedSections.trends}
        toggleSection={() => toggleSection('trends')}
      />
      
      <SpendingPatterns 
        insights={insights}
        isExpanded={expandedSections.patterns}
        toggleSection={() => toggleSection('patterns')}
      />
      
      <RecurringExpenses 
        insights={insights}
        isExpanded={expandedSections.recurring}
        toggleSection={() => toggleSection('recurring')}
      />
    </div>
  );
};

export default ExpenseInsights; 