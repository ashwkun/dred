import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export const InvestmentSection = ({ investments }) => {
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Total Invested</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalInvested.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">1 Year Projection</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalProjected.oneYear.toFixed(2)}</p>
          <p className="text-green-400 text-sm">
            +₹{(investments.totalProjected.oneYear - investments.totalInvested).toFixed(2)}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">5 Year Projection</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalProjected.fiveYear.toFixed(2)}</p>
          <p className="text-green-400 text-sm">
            +₹{(investments.totalProjected.fiveYear - investments.totalInvested).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Investment Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(investments.instrumentWise).map(([name, value]) => ({
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
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    name
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
                        {name}
                      </text>
                    );
                  }}
                >
                  {Object.entries(investments.instrumentWise).map((entry, index) => (
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
          <h3 className="text-lg font-semibold text-white mb-4">Investment Returns</h3>
          <div className="space-y-4">
            {Object.entries(investments.projectedReturns)
              .sort(([, a], [, b]) => b.amount - a.amount)
              .map(([instrument, data]) => (
                <div key={instrument} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">{instrument}</span>
                    <span className="text-white font-medium">₹{data.amount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-white/60">Expected ROI:</span>
                      <span className="text-green-400 ml-2">{data.rate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-white/60">5Y Projection:</span>
                      <span className="text-white ml-2">₹{data.fiveYear.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Investment Trends */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Investment Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={Object.entries(investments.monthlyInvestments).reverse().map(([month, amount]) => ({
                month,
                amount
              }))}
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

      {/* Investment Tips */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Investment Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-white/80">• Best performing instrument: {
              Object.entries(investments.projectedReturns)
                .sort(([, a], [, b]) => b.rate - a.rate)[0]?.[0]
            }</p>
            <p className="text-white/80">• Monthly average: ₹{
              (investments.totalInvested / 12).toFixed(2)
            }</p>
            <p className="text-white/80">• Portfolio diversification: {
              Object.keys(investments.instrumentWise).length
            } instruments</p>
          </div>
          <div className="space-y-2">
            <p className="text-white/80">• Expected yearly returns: ₹{
              (investments.totalProjected.oneYear - investments.totalInvested).toFixed(2)
            }</p>
            <p className="text-white/80">• 5-year growth potential: {
              ((investments.totalProjected.fiveYear / investments.totalInvested - 1) * 100).toFixed(1)
            }%</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 