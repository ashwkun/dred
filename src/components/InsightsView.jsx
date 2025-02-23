import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Line
} from 'recharts';
import { calculateInsights } from '../utils/insights';
import InvestmentSection from './InvestmentSection';
import { db } from '../firebase'; // Correct import for Firestore
import { doc, updateDoc } from "firebase/firestore"; // Import Firestore functions

const C8 = (props) => {
  console.log('C8 is being rendered with props:', props);
  return <MerchantSummary merchantInsights={props.insights?.merchantInsights} />;
};

export const MerchantSummary = ({ merchantInsights }) => {
  if (!merchantInsights || !Array.isArray(merchantInsights.topByFrequency)) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h3 className="text-white/60 text-sm mb-2">Most Frequent Merchants</h3>
        <p className="text-white/50 text-sm">No merchant data available</p>
      </div>
    );
  }

  const topMerchant = merchantInsights.topByFrequency[0];
  if (!topMerchant) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h3 className="text-white/60 text-sm mb-2">Most Frequent Merchants</h3>
        <p className="text-white/50 text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
      <h3 className="text-white/60 text-sm mb-2">Most Frequent Merchants</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white">{topMerchant[0]}</span>
          <span className="text-white/60">{topMerchant[1]} times</span>
        </div>
      </div>
    </div>
  );
};

const InsightsView = ({ transactions, cards, monthlyBudget, onSetBudget }) => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget);
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];

  const insights = calculateInsights(transactions, monthlyBudget);

  // Ensure insights and its properties are defined
  const merchantSpending = insights?.merchantSpending || {};
  const categoryInsights = insights?.categoryInsights || {};
  const weeklyAnalysis = insights?.weeklyAnalysis || {};
  const monthlySpending = insights?.monthlySpending || {};
  const spendingVelocity = insights?.spendingVelocity || {};
  const investmentData = insights?.investmentData || {};

  const handleBudgetChange = async () => {
    try {
      const userDoc = doc(db, 'users', 'user_id');
      await updateDoc(userDoc, {
        monthlyBudget: newBudget
      });
      onSetBudget(newBudget);
      setShowBudgetInput(false);
    } catch (error) {
      console.error("Error updating budget: ", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'expenses' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'investments' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          Investments
        </button>
      </div>

      {/* Budget Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Budget</h3>
        {showBudgetInput ? (
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="bg-white/20 text-white p-2 rounded-lg w-full md:w-auto"
            />
            <button
              onClick={handleBudgetChange}
              className="btn-primary w-full md:w-auto"
            >
              Save
            </button>
            <button
              onClick={() => setShowBudgetInput(false)}
              className="btn-secondary w-full md:w-auto"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-white text-2xl">₹{monthlyBudget.toLocaleString()}</p>
            <button
              onClick={() => setShowBudgetInput(true)}
              className="btn-primary"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'expenses' ? (
        <div className="space-y-6">
          {/* Weekly and Monthly Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyAnalysisCard weeklyAnalysis={weeklyAnalysis} />
            <MonthlyTrendCard monthlySpending={monthlySpending} />
          </div>
          
          {/* Category and Merchant Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryTrendsCard categoryInsights={categoryInsights} />
            <MerchantSummary merchantInsights={insights.merchantInsights} />
          </div>
          
          {/* Spending Velocity */}
          <SpendingVelocityCard 
            spendingVelocity={spendingVelocity} 
            monthlyBudget={monthlyBudget}
          />
          
          {/* Summary Cards */}
          <TopMerchantsCard merchantSpending={merchantSpending} />

          {/* Spending Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpendingPatternsCard insights={insights} />
            <SpendingHeatmapCard insights={insights} />
          </div>

          {/* Spending Analysis */}
          <SpendingRecommendationsCard insights={insights} />
        </div>
      ) : (
        <InvestmentSection insights={investmentData} />
      )}
    </div>
  );
};

const WeeklyAnalysisCard = ({ weeklyAnalysis }) => {
  // Ensure weeklyAnalysis is an object
  const data = Object.entries(weeklyAnalysis || {}).map(([day, amount]) => ({
    day,
    amount
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Weekly Analysis</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis 
              dataKey="day" 
              stroke="#ffffff90"
              tick={{ fill: '#ffffff90', fontSize: 12 }}
            />
            <YAxis 
              stroke="#ffffff90"
              tick={{ fill: '#ffffff90', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
            />
            <Bar dataKey="amount" fill="#4ECDC4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SpendingVelocityCard = ({ spendingVelocity, monthlyBudget }) => {
  const data = [
    { name: 'Current', amount: spendingVelocity.projected },
    { name: 'Budget', amount: monthlyBudget }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Spending Velocity</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Daily Average</p>
            <p className="text-white text-xl">₹{Math.round(spendingVelocity.daily).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Monthly Projection</p>
            <p className="text-white text-xl">₹{Math.round(spendingVelocity.projected).toLocaleString()}</p>
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              spendingVelocity.projected > monthlyBudget 
                ? 'bg-red-500' 
                : 'bg-green-500'
            }`}
            style={{ 
              width: `${Math.min((spendingVelocity.projected / monthlyBudget) * 100, 100)}%` 
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Trend vs Last Month</p>
            <p className={`text-lg ${spendingVelocity.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {spendingVelocity.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(spendingVelocity.trend))}%
            </p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Days Over Budget</p>
            <p className="text-lg text-white">{spendingVelocity.daysOverBudget} days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryTrendsCard = ({ categoryInsights }) => {
  // Ensure categoryInsights and topCategories are defined and are arrays
  const topCategories = Array.isArray(categoryInsights?.topCategories) ? categoryInsights.topCategories : [];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Category Analysis</h3>
      <div className="space-y-4">
        {topCategories.map((category, index) => (
          <div key={category.name} className="bg-white/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white">{category.name}</span>
              <span className="text-white">₹{Math.round(category.amount).toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-white/60">Frequency: </span>
                <span className="text-white">{category.frequency}x</span>
              </div>
              <div>
                <span className="text-white/60">Avg: </span>
                <span className="text-white">₹{Math.round(category.avgTransaction).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        {topCategories.length === 0 && (
          <p className="text-white/60">No category data available</p>
        )}
      </div>
    </div>
  );
};

const MonthlyTrendCard = ({ monthlySpending }) => {
  // Ensure monthlySpending is an object
  const data = Object.entries(monthlySpending || {})
    .reverse()
    .map(([month, amount]) => ({
      month,
      amount,
      avg: Object.values(monthlySpending || {}).reduce((a, b) => a + b, 0) / 6
    }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis 
              dataKey="month" 
              stroke="#ffffff90"
              tick={{ fill: '#ffffff90', fontSize: 12 }}
            />
            <YAxis 
              stroke="#ffffff90"
              tick={{ fill: '#ffffff90', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
            />
            <Bar dataKey="amount" fill="#4ECDC4" />
            <Line type="monotone" dataKey="avg" stroke="#FF6B6B" strokeWidth={2} dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const BudgetAnalysisCard = ({ insights }) => {
  const daysLeft = insights.daysLeft;
  const dailyBudget = insights.dailyBudget;
  const remainingBudget = insights.remainingBudget;
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Budget Analysis</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-white/60 text-sm">Days Left</p>
            <p className="text-2xl font-bold text-white">{daysLeft}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Daily Limit</p>
            <p className="text-2xl font-bold text-white">₹{Math.round(dailyBudget).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Remaining</p>
            <p className="text-2xl font-bold text-white">₹{Math.round(remainingBudget).toLocaleString()}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/60">Budget Utilization</span>
            <span className="text-white">{Math.round(insights.budgetStatus)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                insights.budgetStatus > 80 
                  ? 'bg-red-500' 
                  : insights.budgetStatus > 60 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(insights.budgetStatus, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5">
          <p className="text-white/60 text-sm mb-1">Budget Status</p>
          <p className="text-white">
            {insights.budgetStatus > 100 
              ? '⚠️ Over budget'
              : insights.budgetStatus > 80
              ? '⚠️ Approaching limit'
              : '✅ Within budget'}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {insights.budgetStatus > 100 
              ? `Exceeded by ₹${Math.round(-remainingBudget).toLocaleString()}`
              : `₹${Math.round(remainingBudget).toLocaleString()} remaining for ${daysLeft} days`}
          </p>
        </div>
      </div>
    </div>
  );
};

const SavingsAnalysisCard = ({ insights }) => {
  const savingsData = [
    {
      name: 'Essential',
      value: insights.categoryInsights.topCategories
        .filter(c => ['Food & Dining', 'Bills & Utilities', 'Transportation'].includes(c.name))
        .reduce((sum, c) => sum + c.amount, 0)
    },
    {
      name: 'Discretionary',
      value: insights.categoryInsights.topCategories
        .filter(c => !['Food & Dining', 'Bills & Utilities', 'Transportation', 'Investment'].includes(c.name))
        .reduce((sum, c) => sum + c.amount, 0)
    }
  ];

  const potentialSavings = Math.round(savingsData[1].value * 0.2); // 20% of discretionary spending

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Savings Opportunities</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Essential Expenses</p>
            <p className="text-xl text-white">₹{Math.round(savingsData[0].value).toLocaleString()}</p>
            <p className="text-white/60 text-sm">
              {Math.round((savingsData[0].value / insights.thisMonthTotal) * 100)}% of total
            </p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Discretionary Spending</p>
            <p className="text-xl text-white">₹{Math.round(savingsData[1].value).toLocaleString()}</p>
            <p className="text-white/60 text-sm">
              {Math.round((savingsData[1].value / insights.thisMonthTotal) * 100)}% of total
            </p>
          </div>
        </div>

        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-white/60 text-sm">Potential Monthly Savings</p>
          <p className="text-xl text-green-400">₹{potentialSavings.toLocaleString()}</p>
          <p className="text-white/60 text-sm">by reducing discretionary spending by 20%</p>
        </div>

        <div className="space-y-2">
          <p className="text-white/60 text-sm">Top Areas for Savings:</p>
          {insights.categoryInsights.topCategories
            .filter(c => !['Food & Dining', 'Bills & Utilities', 'Transportation'].includes(c.name))
            .slice(0, 3)
            .map(cat => (
              <div key={cat.name} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-white">{cat.name}</span>
                <span className="text-white/60">₹{Math.round(cat.amount * 0.2).toLocaleString()} potential</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const SpendingHeatmapCard = ({ insights }) => {
  // Ensure insights and its properties are defined
  const heatmapData = insights?.heatmapData || [];

  // Process the heatmap data
  const processedData = heatmapData.map((entry) => {
    // Ensure each entry is an object with expected properties
    const { date, amount } = entry || {};
    return {
      date: date || 'Unknown',
      amount: amount || 0
    };
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Spending Heatmap</h3>
      <div className="space-y-2">
        {processedData.map((entry, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-white">{entry.date}</span>
            <span className="text-white/60">₹{entry.amount.toLocaleString()}</span>
          </div>
        ))}
        {processedData.length === 0 && (
          <p className="text-white/60">No heatmap data available</p>
        )}
      </div>
    </div>
  );
};

const SpendingGoalsCard = ({ insights, monthlyBudget }) => {
  const progress = {
    essential: {
      target: monthlyBudget * 0.5, // 50% for essential spending
      current: insights.categoryInsights.topCategories
        .filter(c => ['Food & Dining', 'Bills & Utilities', 'Transportation'].includes(c.name))
        .reduce((sum, c) => sum + c.amount, 0)
    },
    discretionary: {
      target: monthlyBudget * 0.3, // 30% for discretionary
      current: insights.categoryInsights.topCategories
        .filter(c => !['Food & Dining', 'Bills & Utilities', 'Transportation', 'Investment'].includes(c.name))
        .reduce((sum, c) => sum + c.amount, 0)
    },
    savings: {
      target: monthlyBudget * 0.2, // 20% for savings/investments
      current: insights.investments?.totalInvested || 0
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">50/30/20 Budget Rule</h3>
      <div className="space-y-4">
        {Object.entries(progress).map(([category, data]) => (
          <div key={category} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white capitalize">{category}</span>
              <span className="text-white/60">
                ₹{Math.round(data.current).toLocaleString()} / ₹{Math.round(data.target).toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  data.current > data.target 
                    ? 'bg-red-500' 
                    : data.current > data.target * 0.9
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((data.current / data.target) * 100, 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs">
              {data.current > data.target 
                ? `Exceeded by ₹${Math.round(data.current - data.target).toLocaleString()}`
                : `₹${Math.round(data.target - data.current).toLocaleString()} remaining`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpendingRecommendationsCard = ({ insights }) => {
  const getRecommendations = () => {
    const recs = [];

    // Budget-based recommendations
    if (insights.budgetStatus > 80) {
      recs.push({
        type: 'warning',
        message: 'You\'re close to your budget limit. Consider reducing discretionary spending.'
      });
    }

    // Category-based recommendations
    const topCategory = insights.categoryInsights?.topCategories?.[0];
    if (topCategory && (topCategory.amount / insights.thisMonthTotal) > 0.4) {
      recs.push({
        type: 'info',
        message: `${topCategory.name} makes up ${Math.round(topCategory.amount / insights.thisMonthTotal * 100)}% of your spending. Dyamn brother, too much.`
      });
    }

    // Merchant-based recommendations
    const frequentMerchant = insights.merchantInsights?.topByFrequency?.[0];
    if (frequentMerchant && frequentMerchant[1] > 5) {
      recs.push({
        type: 'tip',
        message: `You frequently shop at ${frequentMerchant[0]}. Look for loyalty programs or bulk purchase discounts.`
      });
    }

    // Weekend spending recommendations
    if (insights.weeklyAnalysis?.weekendAvg > insights.weeklyAnalysis?.weekdayAvg * 1.5) {
      recs.push({
        type: 'warning',
        message: 'Weekend spending is significantly higher. Plan weekend activities in advance to control costs.'
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Smart Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg ${
              rec.type === 'warning' ? 'bg-red-500/10 border-red-500/20' :
              rec.type === 'info' ? 'bg-blue-500/10 border-blue-500/20' :
              'bg-green-500/10 border-green-500/20'
            } border`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-1">
                {rec.type === 'warning' ? '⚠️' : rec.type === 'info' ? 'ℹ️' : '💡'}
              </span>
              <p className="text-white/90">{rec.message}</p>
            </div>
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="text-white/60">No recommendations available</p>
        )}
      </div>
    </div>
  );
};

const SpendingPatternsCard = ({ insights }) => {
  // Helper function to safely format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not available';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not available';
    }
  };

  // Helper function to safely format currency
  const formatCurrency = (amount) => {
    try {
      return `₹${Math.round(Number(amount) || 0).toLocaleString()}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '₹0';
    }
  };

  // Safely get highest spending day info
  const getHighestSpendingDayInfo = () => {
    try {
      if (!insights?.highestSpendingDay || !Array.isArray(insights.highestSpendingDay)) {
        return { date: 'Not available', amount: 0 };
      }
      const [date, amount] = insights.highestSpendingDay;
      return {
        date: formatDate(date),
        amount: Number(amount) || 0
      };
    } catch (error) {
      console.error('Error processing highest spending day:', error);
      return { date: 'Not available', amount: 0 };
    }
  };

  const highestSpendingDay = getHighestSpendingDayInfo();
  const weekendVsWeekday = insights?.weekendSpending > insights?.weekdayAvgSpending;
  const spendingDiff = Math.abs(
    Math.round(
      ((insights?.weekendSpending || 0) / (insights?.weekdayAvgSpending || 1) - 1) * 100
    )
  );

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Spending Patterns</h3>
      <div className="space-y-3">
        <div>
          <p className="text-white/60 text-sm">Highest Spending Day</p>
          <p className="text-white">
            {highestSpendingDay.date}
            <span className="text-white/60 ml-2">
              {formatCurrency(highestSpendingDay.amount)}
            </span>
          </p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Most Frequent Category</p>
          <p className="text-white">
            {insights?.mostFrequentCategory || 'No data available'}
          </p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Largest Single Expense</p>
          <p className="text-white">
            {formatCurrency(insights?.largestExpense || 0)}
          </p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Weekend vs Weekday Spending</p>
          <p className="text-white">
            {weekendVsWeekday ? 'Higher' : 'Lower'} on weekends
            {spendingDiff > 0 && (
              <span className="text-white/60 ml-2">
                ({spendingDiff}% difference)
              </span>
            )}
          </p>
        </div>

        {/* Additional Pattern Insights */}
        {insights?.averageDailySpending && (
          <div>
            <p className="text-white/60 text-sm">Average Daily Spending</p>
            <p className="text-white">
              {formatCurrency(insights.averageDailySpending)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TopMerchantsCard = ({ merchantSpending }) => {
  // Ensure merchantSpending is an object
  const topMerchants = Object.entries(merchantSpending || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Top Merchants</h3>
      <div className="space-y-2">
        {topMerchants.map(([merchant, amount]) => (
          <div
            key={merchant}
            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
          >
            <span className="text-white">{merchant}</span>
            <span className="text-white font-medium">₹{amount.toFixed(2)}</span>
          </div>
        ))}
        {topMerchants.length === 0 && (
          <p className="text-white/60">No merchant data available</p>
        )}
      </div>
    </div>
  );
};

export default InsightsView; 