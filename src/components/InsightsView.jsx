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
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/60 text-sm">Monthly Budget</h3>
              <button
                onClick={() => setShowBudgetInput(!showBudgetInput)}
                className="text-white/60 hover:text-white"
              >
                {showBudgetInput ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {showBudgetInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseFloat(e.target.value))}
                  className="flex-1 bg-white/10 rounded-lg p-2 text-white"
                  placeholder="Enter monthly budget"
                />
                <button
                  onClick={() => {
                    onSetBudget(newBudget);
                    setShowBudgetInput(false);
                  }}
                  className="px-4 py-2 bg-white/20 rounded-lg text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-white">₹{monthlyBudget.toFixed(2)}</p>
                <div className="mt-2 bg-white/5 rounded-lg overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-green-400 to-red-400"
                    style={{ width: `${Math.min(insights.budgetStatus, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <p className="text-white/60">
                    ₹{insights.remainingBudget.toFixed(2)} remaining
                  </p>
                  <p className="text-white/60">
                    {insights.daysLeft} days left
                  </p>
                </div>
                <p className="text-white/60 text-sm mt-1">
                  Daily limit: ₹{Math.max(insights.dailyBudget, 0).toFixed(2)}
                </p>
              </>
            )}
          </div>

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
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px'
                    }}
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
                      label
                    >
                      {Object.entries(insights.categorySpending)
                        .filter(([category]) => category !== 'Investment')
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px'
                      }}
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
        </div>
      ) : (
        <InvestmentSection investments={insights.investments} />
      )}
    </div>
  );
};

export default InsightsView; 