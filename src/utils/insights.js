export const calculateInsights = (transactions, monthlyBudget) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const today = now.getDate();
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  
  // Separate investment transactions
  const investmentTransactions = transactions.filter(t => t.category === "Investment");
  const nonInvestmentTransactions = transactions.filter(t => t.category !== "Investment");

  // Filter transactions for current and last month
  const thisMonthTransactions = nonInvestmentTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
  
  const lastMonthTransactions = nonInvestmentTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === (thisMonth - 1) && date.getFullYear() === thisYear;
  });

  // Calculate totals
  const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Category-wise spending
  const categorySpending = nonInvestmentTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Account-wise spending
  const accountSpending = nonInvestmentTransactions.reduce((acc, t) => {
    acc[t.account] = (acc[t.account] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Daily spending trend (last 30 days)
  const dailySpending = nonInvestmentTransactions
    .filter(t => {
      const date = new Date(t.date);
      const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    })
    .reduce((acc, t) => {
      const date = new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
      });
      acc[date] = (acc[date] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  // Merchant-wise spending
  const merchantSpending = nonInvestmentTransactions.reduce((acc, t) => {
    acc[t.merchant] = (acc[t.merchant] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Monthly breakdown (last 6 months)
  const monthlySpending = {};
  for (let i = 0; i < 6; i++) {
    const month = new Date(thisYear, thisMonth - i, 1);
    const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlySpending[monthKey] = nonInvestmentTransactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  // Budget insights
  const remainingBudget = monthlyBudget - thisMonthTotal;
  const dailyBudget = remainingBudget / (daysInMonth - today);
  const budgetStatus = (thisMonthTotal / monthlyBudget) * 100;
  
  // Average transaction size
  const avgTransactionSize = thisMonthTotal / (thisMonthTransactions.length || 1);

  // Investment-specific calculations
  const investmentInsights = {
    totalInvested: investmentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    instrumentWise: investmentTransactions.reduce((acc, t) => {
      acc[t.merchant] = (acc[t.merchant] || 0) + parseFloat(t.amount);
      return acc;
    }, {}),
    monthlyInvestments: {}
  };

  // Calculate monthly investment trends
  for (let i = 0; i < 12; i++) {
    const month = new Date(thisYear, thisMonth - i, 1);
    const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
    investmentInsights.monthlyInvestments[monthKey] = investmentTransactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  // ROI rates for different instruments
  const ROI_RATES = {
    'SIP': 0.12,
    'Mutual Funds': 0.10,
    'Stocks': 0.15,
    'Gold': 0.08,
    'Fixed Deposits': 0.06,
    'PPF': 0.071,
    'NPS': 0.10,
    'Bonds': 0.07,
    'ETFs': 0.11,
    'Real Estate': 0.09
  };

  // Calculate projected returns
  const projectedReturns = {};
  Object.entries(investmentInsights.instrumentWise).forEach(([instrument, amount]) => {
    const rate = ROI_RATES[instrument] || 0.10;
    projectedReturns[instrument] = {
      amount,
      oneYear: amount * (1 + rate),
      threeYear: amount * Math.pow(1 + rate, 3),
      fiveYear: amount * Math.pow(1 + rate, 5),
      rate: rate * 100
    };
  });

  investmentInsights.projectedReturns = projectedReturns;
  investmentInsights.totalProjected = {
    oneYear: Object.values(projectedReturns).reduce((sum, p) => sum + p.oneYear, 0),
    threeYear: Object.values(projectedReturns).reduce((sum, p) => sum + p.threeYear, 0),
    fiveYear: Object.values(projectedReturns).reduce((sum, p) => sum + p.fiveYear, 0)
  };

  return {
    thisMonthTotal,
    lastMonthTotal,
    categorySpending,
    accountSpending,
    dailySpending,
    merchantSpending,
    monthlySpending,
    remainingBudget,
    dailyBudget,
    budgetStatus,
    avgTransactionSize,
    daysLeft: daysInMonth - today,
    investments: investmentInsights
  };
}; 