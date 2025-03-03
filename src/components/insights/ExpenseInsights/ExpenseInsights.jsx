import React, { useState, useEffect, useMemo } from 'react';
import BudgetOverview from './BudgetOverview';
import CategoryBreakdown from './CategoryBreakdown';
import SpendingTrends from './SpendingTrends';
import SpendingPatterns from './SpendingPatterns';
import RecurringExpenses from './RecurringExpenses';
import SpendingPersona from './SpendingPersona';
import CategoryBudgetAnalysis from './CategoryBudgetAnalysis';
import InvestmentSummary from './InvestmentSummary';
import { FiFilter, FiX } from 'react-icons/fi';
import TransactionHighlights from './TransactionHighlights';

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
      recurringExpenses: [],
      recentTransactions: []
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
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize all months with zero to ensure consistent data for charts
  monthNames.forEach(month => {
    monthlySpending[month] = 0;
  });
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (!isNaN(date.getTime())) {
      const month = monthNames[date.getMonth()];
      monthlySpending[month] += parseFloat(t.amount) || 0;
    }
  });
  
  // Recent transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = transactions
    .filter(t => new Date(t.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
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
  
  // Enhanced recurring expense detection
  // Group by merchant and find those that occur in at least 2 consecutive months
  const merchantTransactionsByMonth = {};
  
  transactions.forEach(t => {
    if (!t.merchant) return;
    
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return;
    
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
    
    if (!merchantTransactionsByMonth[t.merchant]) {
      merchantTransactionsByMonth[t.merchant] = {};
    }
    
    if (!merchantTransactionsByMonth[t.merchant][yearMonth]) {
      merchantTransactionsByMonth[t.merchant][yearMonth] = [];
    }
    
    merchantTransactionsByMonth[t.merchant][yearMonth].push({
      date,
      amount: parseFloat(t.amount) || 0,
      category: t.category || 'Uncategorized'
    });
  });
  
  const recurringExpenses = [];
  Object.entries(merchantTransactionsByMonth).forEach(([merchant, monthData]) => {
    const monthKeys = Object.keys(monthData).sort();
    
    // Check if merchant appears in at least 2 months
    if (monthKeys.length >= 2) {
      // Check if amounts are similar
      const allAmounts = [].concat(...Object.values(monthData).map(txns => txns.map(t => t.amount)));
      const avgAmount = allAmounts.reduce((sum, amt) => sum + amt, 0) / allAmounts.length;
      const amountVariance = Math.max(...allAmounts) - Math.min(...allAmounts);
      const category = monthData[monthKeys[0]][0].category;
      
      // If amounts are within 20% of each other, consider it recurring
      if (amountVariance / avgAmount < 0.2) {
        // Check frequency
        let frequency = 'Occasional';
        
        if (monthKeys.length >= 3) {
          // Check if transactions occur in consecutive months
          let consecutiveMonths = 0;
          for (let i = 1; i < monthKeys.length; i++) {
            const [prevYear, prevMonth] = monthKeys[i-1].split('-').map(Number);
            const [currYear, currMonth] = monthKeys[i].split('-').map(Number);
            
            if ((prevYear === currYear && currMonth - prevMonth === 1) || 
                (currYear - prevYear === 1 && prevMonth === 12 && currMonth === 1)) {
              consecutiveMonths++;
            }
          }
          
          if (consecutiveMonths >= 2) {
            frequency = 'Monthly';
          }
        }
        
        recurringExpenses.push({
          merchant,
          amount: avgAmount,
          frequency,
          category
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
    recurringExpenses,
    recentTransactions
  };
};

const ExpenseInsights = (props) => {
  const [expandedSections, setExpandedSections] = useState({
    budget: true,
    category: true,
    trends: true,
    patterns: true,
    recurring: true,
    highlights: true,
    budgetAnalysis: false,
    investments: false
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', 'thisMonth', 'lastMonth', '3months', '6months'
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (!props.transactions || props.transactions.length === 0) {
      return [];
    }
    
    if (selectedPeriod === 'all') {
      return props.transactions;
    }
    
    const now = new Date();
    let startDate;
    
    if (selectedPeriod === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedPeriod === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return props.transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
      });
    } else if (selectedPeriod === '3months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (selectedPeriod === '6months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }
    
    return props.transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate;
    });
  }, [props.transactions, selectedPeriod]);

  // Move the processing into a useMemo hook
  const insights = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
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
        recurringExpenses: [],
        recentTransactions: []
      };
    }

    // Filter out investment transactions
    const investmentCategories = ['Investments', 'Stocks', 'Mutual Funds', 'ETF', 'Crypto', 'Investment'];
    const expenseTransactions = filteredTransactions.filter(transaction => 
      !investmentCategories.includes(transaction.category)
    );
    
    return processTransactions(expenseTransactions);
  }, [filteredTransactions]);

  if (!insights) {
    return <div className="text-white/70 text-center py-6">No data available for insights</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <FiFilter className="text-white/70" />
          <h3 className="text-lg font-semibold text-white">Filter Insights</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedPeriod === 'all' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setSelectedPeriod('thisMonth')}
            className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedPeriod === 'thisMonth' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedPeriod('lastMonth')}
            className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedPeriod === 'lastMonth' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setSelectedPeriod('3months')}
            className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedPeriod === '3months' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setSelectedPeriod('6months')}
            className={`py-2 px-3 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedPeriod === '6months' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            6 Months
          </button>
        </div>
      </div>
      
      <SpendingPersona insights={insights} />
      
      <BudgetOverview 
        insights={insights} 
        monthlyBudget={props.monthlyBudget} 
        onSetBudget={props.onSetBudget} 
        userId={props.userId}
        isExpanded={expandedSections.budget}
        toggleSection={() => toggleSection('budget')}
      />
      
      <TransactionHighlights
        insights={insights}
        isExpanded={expandedSections.highlights}
        toggleSection={() => toggleSection('highlights')}
      />
      
      <CategoryBreakdown 
        insights={insights}
        isExpanded={expandedSections.category}
        toggleSection={() => toggleSection('category')}
      />
      
      <CategoryBudgetAnalysis 
        insights={insights}
        monthlyBudget={props.monthlyBudget}
        isExpanded={expandedSections.budgetAnalysis}
        toggleSection={() => toggleSection('budgetAnalysis')}
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
      
      <InvestmentSummary
        transactions={props.transactions}
        isExpanded={expandedSections.investments}
        toggleSection={() => toggleSection('investments')}
      />
    </div>
  );
};

export default ExpenseInsights; 