import React, { useState, useEffect, useMemo } from 'react';
import BudgetOverview from './BudgetOverview';
import CategoryBreakdown from './CategoryBreakdown';
import SpendingTrends from './SpendingTrends';
import SpendingPatterns from './SpendingPatterns';
import RecurringExpenses from './RecurringExpenses';
import SpendingPersona from './SpendingPersona';

// Add this function to process transactions into insights
const processTransactions = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalSpent: 0,
      categoryInsights: {
        topCategories: []
      },
      monthlySpending: {},
      weekdayWeekendSpending: {
        weekday: 0,
        weekend: 0
      },
      dayOfWeekSpending: {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0
      },
      recurringExpenses: []
    };
  }

  // Process the transactions to generate insights
  const totalSpent = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  // Category breakdown
  const categories = {};
  transactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category] += parseFloat(t.amount) || 0;
  });
  
  const topCategories = Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  // Monthly spending
  const monthlySpending = {};
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (!isNaN(date.getTime())) {
      const month = date.toLocaleString('default', { month: 'short' });
      if (!monthlySpending[month]) {
        monthlySpending[month] = 0;
      }
      monthlySpending[month] += parseFloat(t.amount) || 0;
    }
  });
  
  // Weekday vs weekend spending
  const weekdayWeekendSpending = { weekday: 0, weekend: 0 };
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (!isNaN(date.getTime())) {
      const day = date.getDay();
      if (day === 0 || day === 6) { // 0 is Sunday, 6 is Saturday
        weekdayWeekendSpending.weekend += parseFloat(t.amount) || 0;
      } else {
        weekdayWeekendSpending.weekday += parseFloat(t.amount) || 0;
      }
    }
  });
  
  // Day of week spending
  const dayOfWeekSpending = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
  };
  
  const dayMapping = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (!isNaN(date.getTime())) {
      const day = date.getDay(); // 0-6
      dayOfWeekSpending[dayMapping[day]] += parseFloat(t.amount) || 0;
    }
  });
  
  // Simple recurring expense detection
  // Group by merchant and find those that occur multiple times with similar amounts
  const merchantTransactions = {};
  transactions.forEach(t => {
    if (t.merchant) {
      if (!merchantTransactions[t.merchant]) {
        merchantTransactions[t.merchant] = [];
      }
      merchantTransactions[t.merchant].push({
        date: new Date(t.date),
        amount: parseFloat(t.amount) || 0,
        category: t.category || 'Uncategorized'
      });
    }
  });
  
  const recurringExpenses = [];
  Object.entries(merchantTransactions).forEach(([merchant, txns]) => {
    if (txns.length >= 2) {
      // Sort by date
      txns.sort((a, b) => a.date - b.date);
      
      // Check if amounts are similar
      const amounts = txns.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      
      // If the transactions are reasonably similar, consider it recurring
      if (txns.length >= 2) {
        recurringExpenses.push({
          merchant,
          amount: avgAmount,
          frequency: txns.length > 3 ? 'Monthly' : 'Occasional',
          category: txns[0].category
        });
      }
    }
  });
  
  // Sort recurring expenses by amount
  recurringExpenses.sort((a, b) => b.amount - a.amount);
  
  return {
    totalSpent,
    categoryInsights: {
      topCategories
    },
    monthlySpending,
    weekdayWeekendSpending,
    dayOfWeekSpending,
    recurringExpenses
  };
};

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

  // Move the processing into a useMemo hook
  const insights = useMemo(() => {
    console.log("Processing transactions:", props.transactions);
    
    if (!props.transactions || props.transactions.length === 0) {
      return {
        totalSpent: 0,
        categoryInsights: {
          topCategories: []
        },
        monthlySpending: {},
        weekdayWeekendSpending: {
          weekday: 0,
          weekend: 0
        },
        dayOfWeekSpending: {
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
        },
        recurringExpenses: []
      };
    }

    // Process the transactions to generate insights
    const totalSpent = props.transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    // Category breakdown
    const categories = {};
    props.transactions.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += parseFloat(t.amount) || 0;
    });
    
    const topCategories = Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Monthly spending
    const monthlySpending = {};
    props.transactions.forEach(t => {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthlySpending[month]) {
          monthlySpending[month] = 0;
        }
        monthlySpending[month] += parseFloat(t.amount) || 0;
      }
    });
    
    // Weekday vs weekend spending
    const weekdayWeekendSpending = { weekday: 0, weekend: 0 };
    props.transactions.forEach(t => {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        const day = date.getDay();
        if (day === 0 || day === 6) { // 0 is Sunday, 6 is Saturday
          weekdayWeekendSpending.weekend += parseFloat(t.amount) || 0;
        } else {
          weekdayWeekendSpending.weekday += parseFloat(t.amount) || 0;
        }
      }
    });
    
    // Day of week spending
    const dayOfWeekSpending = {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
    };
    
    const dayMapping = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    props.transactions.forEach(t => {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        const day = date.getDay(); // 0-6
        dayOfWeekSpending[dayMapping[day]] += parseFloat(t.amount) || 0;
      }
    });
    
    // Find recurring expenses
    const recurringExpenses = [];
    // Simplified version for now
    
    return {
      totalSpent,
      categoryInsights: {
        topCategories
      },
      monthlySpending,
      weekdayWeekendSpending,
      dayOfWeekSpending,
      recurringExpenses
    };
  }, [props.transactions]);

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