import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { calculateInsights } from '../utils/insights';
import { InvestmentSection } from './InvestmentSection';

const InsightsView = ({ transactions, cards, monthlyBudget, onSetBudget }) => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget);
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];

  const insights = calculateInsights(transactions, monthlyBudget);

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

      {/* Content */}
      {activeTab === 'expenses' ? (
        <div className="space-y-6">
          {/* Budget Section */}
          <BudgetAnalysisCard insights={insights} />
          
          {/* Weekly and Monthly Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyAnalysisCard weeklyAnalysis={insights.weeklyAnalysis} />
            <MonthlyTrendCard monthlySpending={insights.monthlySpending} />
          </div>
          
          {/* Category and Merchant Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryTrendsCard categoryInsights={insights.categoryInsights} />
            <MerchantAnalysisCard merchantInsights={insights.merchantInsights} />
          </div>
          
          {/* Spending Velocity */}
          <SpendingVelocityCard 
            spendingVelocity={insights.spendingVelocity} 
            monthlyBudget={monthlyBudget}
          />
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-white/60 text-sm">This Month</h3>
              <p className="text-2xl font-bold text-white">₹{insights.thisMonthTotal.toFixed(2)}</p>
              <p className="text-white/60 text-sm">
                {insights.thisMonthTotal > insights.lastMonthTotal ? '↑' : '↓'}
                ₹{Math.abs(insights.thisMonthTotal - insights.lastMonthTotal).toFixed(2)} vs last month
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-white/60 text-sm">Daily Average</h3>
              <p className="text-2xl font-bold text-white">
                ₹{(insights.thisMonthTotal / new Date().getDate()).toFixed(2)}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-white/60 text-sm">Avg Transaction</h3>
              <p className="text-2xl font-bold text-white">
                ₹{insights.avgTransactionSize.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Spending Trends */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Spending Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Object.entries(insights.dailySpending).map(([date, amount]) => ({
                    date,
                    amount
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="date" 
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
                    formatter={(value, name) => [
                      `₹${Math.round(value).toLocaleString()}`,
                      name
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#4ECDC4"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category and Account Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Category Split</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(insights.categorySpending)
                        .filter(([category]) => category !== 'Investment')
                        .map(([name, value]) => ({
                          name,
                          value
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({
                        cx, cy, midAngle, innerRadius, outerRadius, value, name, percent
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius * 1.2;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#ffffff"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize="12"
                          >
                            {`${name} (₹${Math.round(value).toLocaleString()}, ${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                    >
                      {Object.entries(insights.categorySpending)
                        .filter(([category]) => category !== 'Investment')
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20, 20, 20, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                      formatter={(value, name) => [
                        `₹${Math.round(value).toLocaleString()}`,
                        name
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                      wrapperStyle={{ outline: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Top Merchants</h3>
              <div className="space-y-2">
                {Object.entries(insights.merchantSpending)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([merchant, amount]) => (
                    <div
                      key={merchant}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <span className="text-white">{merchant}</span>
                      <span className="text-white font-medium">₹{amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Spending Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Spending Patterns</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/60 text-sm">Highest Spending Day</p>
                  <p className="text-white">
                    {new Date(insights.highestSpendingDay[0]).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                    <span className="text-white/60 ml-2">
                      ₹{Math.round(insights.highestSpendingDay[1]).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Most Frequent Category</p>
                  <p className="text-white">{insights.mostFrequentCategory}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Largest Single Expense</p>
                  <p className="text-white">₹{Math.round(insights.largestExpense).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Weekend vs Weekday Spending</p>
                  <p className="text-white">
                    {insights.weekendSpending > insights.weekdayAvgSpending ? 'Higher' : 'Lower'} on weekends
                    <span className="text-white/60 ml-2">
                      ({Math.abs(Math.round(((insights.weekendSpending / insights.weekdayAvgSpending) - 1) * 100))}% difference)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Spending Analysis */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Spending Analysis</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/60 text-sm">Monthly Trend</p>
                  <p className="text-white">
                    {insights.thisMonthTotal > insights.lastMonthTotal ? 'Increased' : 'Decreased'} by
                    <span className="text-white/60 ml-2">
                      {Math.abs(Math.round(((insights.thisMonthTotal / insights.lastMonthTotal) - 1) * 100))}%
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Top 3 Categories</p>
                  <div className="space-y-1">
                    {insights.topCategories.map((cat, idx) => (
                      <p key={cat.name} className="text-white flex justify-between">
                        <span>{cat.name}</span>
                        <span className="text-white/60">₹{Math.round(cat.amount).toLocaleString()}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Budget Utilization</p>
                  <p className="text-white">
                    {Math.round(insights.budgetStatus)}% used
                    <span className="text-white/60 ml-2">
                      (₹{Math.round(insights.remainingBudget).toLocaleString()} remaining)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Forecast */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Spending Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/60 text-sm">Projected Monthly</p>
                <p className="text-white text-xl">₹{Math.round(insights.projectedMonthly).toLocaleString()}</p>
                <p className="text-white/60 text-sm">based on current trend</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Daily Budget</p>
                <p className="text-white text-xl">₹{Math.round(insights.dailyBudget).toLocaleString()}</p>
                <p className="text-white/60 text-sm">to stay within budget</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Savings Potential</p>
                <p className="text-white text-xl">₹{Math.round(insights.savingsPotential).toLocaleString()}</p>
                <p className="text-white/60 text-sm">if following budget</p>
              </div>
            </div>
          </div>

          {/* Savings Analysis */}
          <SavingsAnalysisCard insights={insights} />

          {/* New Analysis Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SavingsAnalysisCard insights={insights} />
            <SpendingHeatmapCard insights={insights} />
          </div>
        </div>
      ) : (
        <InvestmentSection investments={insights.investments} />
      )}
    </div>
  );
};

const WeeklyAnalysisCard = ({ weeklyAnalysis }) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = dayNames.map((day, index) => ({
    name: day,
    amount: weeklyAnalysis.dayWiseSpending[index] || 0
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Weekly Spending Pattern</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis 
              dataKey="name" 
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
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-white/60 text-sm">Weekend vs Weekday</p>
          <p className="text-white">
            {Math.round(weeklyAnalysis.weekendAvg) > Math.round(weeklyAnalysis.weekdayAvg) 
              ? '↑ Higher weekend spending' 
              : '↓ Lower weekend spending'}
          </p>
          <p className="text-white/60 text-sm">
            ₹{Math.round(Math.abs(weeklyAnalysis.weekendAvg - weeklyAnalysis.weekdayAvg)).toLocaleString()} difference
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Most Expensive Day</p>
          <p className="text-white">{dayNames[weeklyAnalysis.mostExpensiveDay[0]]}</p>
          <p className="text-white/60 text-sm">
            ₹{Math.round(weeklyAnalysis.mostExpensiveDay[1]).toLocaleString()}
          </p>
        </div>
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
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Category Analysis</h3>
      <div className="space-y-4">
        {categoryInsights.topCategories.map((category, index) => (
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
      </div>
    </div>
  );
};

const MerchantAnalysisCard = ({ merchantInsights }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Merchant Analysis</h3>
      <div className="space-y-4">
        <div>
          <p className="text-white/60 text-sm mb-2">Most Frequent Merchants</p>
          <div className="space-y-2">
            {merchantInsights.topByFrequency.map(([merchant, frequency]) => (
              <div key={merchant} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-white">{merchant}</span>
                <span className="text-white/60">{frequency}x</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-2">Recent Transactions</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {merchantInsights.recentTransactions.map((t, idx) => (
              <div key={idx} className="p-2 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white">{t.merchant}</span>
                  <span className="text-white">₹{Math.round(t.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{t.category}</span>
                  <span className="text-white/60">
                    {new Date(t.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthlyTrendCard = ({ monthlySpending }) => {
  const data = Object.entries(monthlySpending)
    .reverse()
    .map(([month, amount]) => ({
      month,
      amount,
      avg: Object.values(monthlySpending).reduce((a, b) => a + b, 0) / 6
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
  // Group transactions by week and day
  const weeklyData = Array(4).fill().map(() => Array(7).fill(0));
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  insights.transactions.forEach(t => {
    const date = new Date(t.date);
    if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
      const week = Math.floor(date.getDate() / 7);
      const day = date.getDay();
      weeklyData[week][day] += parseFloat(t.amount);
    }
  });

  const maxAmount = Math.max(...weeklyData.flat());

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Spending Pattern</h3>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-white/60 text-xs text-center">{day}</div>
        ))}
        {weeklyData.flat().map((amount, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-lg relative group"
            style={{
              backgroundColor: `rgba(78, 205, 196, ${amount / maxAmount})`
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity">
              ₹{Math.round(amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#4ECDC4] opacity-20"></div>
          <span className="text-white/60 text-xs">Less</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#4ECDC4]"></div>
          <span className="text-white/60 text-xs">More</span>
        </div>
      </div>
    </div>
  );
};

export default InsightsView; 