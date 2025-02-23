import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const InvestmentSection = ({ insights }) => {
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Fetch data from the insights object
  const investments = insights?.investmentData || {};
  const totalInvested = investments.totalInvested || 0;
  const totalReturns = investments.totalReturns || 0;
  const investmentGrowth = investments.investmentGrowth || 0;
  const projectedValue = investments.totalProjected?.fiveYear || 0;
  const expectedReturn = totalInvested > 0 ? ((projectedValue / totalInvested - 1) * 100).toFixed(1) : 0;
  const monthlyAvg = investments.sipProjections?.monthly || 0;

  // Data for charts
  const portfolioDistribution = Object.entries(investments.instrumentWise || {}).map(([name, value]) => ({
    name,
    value
  }));

  const investmentTrends = Object.entries(investments.monthlyInvestments || {}).reverse().map(([month, amount]) => ({
    month,
    amount
  }));

  const expectedReturns = Object.entries(investments.projectedReturns || {}).map(([instrument, data]) => ({
    instrument,
    current: data.amount,
    fiveYear: data.fiveYear,
    rate: data.rate
  }));

  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Total Invested</h3>
          <p className="text-2xl font-bold text-white">₹{Math.round(totalInvested).toLocaleString()}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">5Y Projection</h3>
          <p className="text-2xl font-bold text-white">₹{Math.round(projectedValue).toLocaleString()}</p>
          <p className="text-green-400 text-sm">+{expectedReturn}% return</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Monthly Average</h3>
          <p className="text-2xl font-bold text-white">₹{Math.round(monthlyAvg).toLocaleString()}</p>
          <p className="text-white/60 text-sm">SIP equivalent</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Investment Status</h3>
          <p className="text-2xl font-bold text-white">
            {investments.investmentTrends?.consistency || 'New'}
          </p>
          <p className="text-white/60 text-sm">based on pattern</p>
        </div>
      </div>

      {/* Portfolio Distribution */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolioDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
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
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {portfolioDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Trends */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Investment Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={investmentTrends}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorInvestment)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expected Returns */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Expected Returns</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expectedReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="instrument" 
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
                formatter={(value) => [`₹${Math.round(value).toLocaleString()}`, 'Amount']}
              />
              <Legend />
              <Bar dataKey="current" fill="#4ECDC4" />
              <Bar dataKey="fiveYear" fill="#FF6B6B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Overview */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Investment Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Total Invested</span>
            <span className="text-white">₹{totalInvested.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Total Returns</span>
            <span className="text-white">₹{totalReturns.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Investment Growth</span>
            <span className={`text-lg ${investmentGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {investmentGrowth >= 0 ? '↑' : '↓'} {Math.abs(investmentGrowth)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSection; 