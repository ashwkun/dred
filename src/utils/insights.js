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

  // Add these calculations to the investment insights
  const calculateSIPTrend = (transactions) => {
    // Get last 3 months of investments
    const last3Months = Object.entries(investmentInsights.monthlyInvestments)
      .slice(0, 3)
      .map(([, amount]) => amount);

    const avgMonthlyInvestment = last3Months.reduce((sum, amt) => sum + amt, 0) / last3Months.length || 0;

    // Project future investments assuming same monthly investment
    const projectedSIP = {
      monthly: avgMonthlyInvestment,
      yearlyContribution: avgMonthlyInvestment * 12,
      fiveYearContribution: avgMonthlyInvestment * 12 * 5
    };

    // Calculate returns with compound interest (monthly compounding)
    const calculateSIPReturns = (monthly, years, rate) => {
      const monthlyRate = rate / 12;
      const months = years * 12;
      return monthly * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);
    };

    // Calculate for each instrument type
    Object.entries(investmentInsights.instrumentWise).forEach(([instrument, amount]) => {
      const rate = ROI_RATES[instrument] || 0.10;
      projectedReturns[instrument] = {
        ...projectedReturns[instrument],
        sipOneYear: calculateSIPReturns(avgMonthlyInvestment, 1, rate),
        sipFiveYear: calculateSIPReturns(avgMonthlyInvestment, 5, rate)
      };
    });

    return {
      projectedSIP,
      avgMonthlyInvestment,
      last3Months
    };
  };

  const sipTrends = calculateSIPTrend(transactions);

  // Add these new calculations in calculateInsights
  // Weekly patterns
  const weeklyPatterns = nonInvestmentTransactions.reduce((acc, t) => {
    try {
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return acc; // Skip invalid dates
      
      const dayOfWeek = date.getDay();
      const amount = parseFloat(t.amount) || 0;
      
      acc.dayWise[dayOfWeek] = (acc.dayWise[dayOfWeek] || 0) + amount;
      acc.weekendTotal += (dayOfWeek === 0 || dayOfWeek === 6) ? amount : 0;
      acc.weekdayTotal += (dayOfWeek > 0 && dayOfWeek < 6) ? amount : 0;
      acc.count.weekend += (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
      acc.count.weekday += (dayOfWeek > 0 && dayOfWeek < 6) ? 1 : 0;
      
      return acc;
    } catch (error) {
      console.error('Error processing transaction:', error);
      return acc;
    }
  }, { 
    dayWise: {}, 
    weekendTotal: 0, 
    weekdayTotal: 0, 
    count: { weekend: 0, weekday: 0 } 
  });

  // Category frequency and trends
  const categoryAnalysis = nonInvestmentTransactions.reduce((acc, t) => {
    const category = t.category;
    const amount = parseFloat(t.amount);
    const date = new Date(t.date);
    const month = date.getMonth();
    
    // Frequency
    acc.frequency[category] = (acc.frequency[category] || 0) + 1;
    
    // Monthly trends
    if (!acc.monthlyTrends[category]) {
      acc.monthlyTrends[category] = {};
    }
    acc.monthlyTrends[category][month] = (acc.monthlyTrends[category][month] || 0) + amount;
    
    // Average transaction size
    if (!acc.avgSize[category]) {
      acc.avgSize[category] = { total: 0, count: 0 };
    }
    acc.avgSize[category].total += amount;
    acc.avgSize[category].count += 1;
    
    return acc;
  }, { 
    frequency: {}, 
    monthlyTrends: {}, 
    avgSize: {} 
  });

  // Calculate top categories by frequency and amount
  const topCategories = Object.entries(categorySpending)
    .map(([name, amount]) => ({
      name,
      amount,
      frequency: categoryAnalysis.frequency[name] || 0,
      avgTransaction: amount / (categoryAnalysis.frequency[name] || 1)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Calculate spending velocity and projections
  const spendingVelocity = {
    daily: thisMonthTotal / today,
    projected: (thisMonthTotal / today) * daysInMonth,
    trend: (thisMonthTotal / lastMonthTotal - 1) * 100,
    daysOverBudget: Object.entries(dailySpending)
      .filter(([, amount]) => amount > dailyBudget).length
  };

  // Calculate merchant analytics
  const merchantAnalytics = nonInvestmentTransactions.reduce((acc, t) => {
    const merchant = t.merchant;
    const amount = parseFloat(t.amount);
    const date = new Date(t.date);
    
    // Frequency
    acc.frequency[merchant] = (acc.frequency[merchant] || 0) + 1;
    
    // Recent transactions
    acc.recent.push({
      merchant,
      amount,
      date,
      category: t.category
    });
    
    // Category distribution
    if (!acc.categoryWise[t.category]) {
      acc.categoryWise[t.category] = {};
    }
    acc.categoryWise[t.category][merchant] = (acc.categoryWise[t.category][merchant] || 0) + amount;
    
    return acc;
  }, {
    frequency: {},
    recent: [],
    categoryWise: {}
  });

  // Example calculation logic
  const investmentData = {
    totalInvested: transactions.reduce((acc, t) => acc + (t.type === 'investment' ? parseFloat(t.amount) : 0), 0),
    totalReturns: transactions.reduce((acc, t) => acc + (t.type === 'return' ? parseFloat(t.amount) : 0), 0),
    investmentGrowth: 0 // Calculate based on your logic
  };

  // Calculate growth
  if (investmentData.totalInvested > 0) {
    investmentData.investmentGrowth = ((investmentData.totalReturns / investmentData.totalInvested) - 1) * 100;
  }

  // Add to the return object
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
    investments: {
      ...investmentInsights,
      sipProjections: sipTrends.projectedSIP,
      investmentTrends: {
        monthlyAverage: sipTrends.avgMonthlyInvestment,
        consistency: sipTrends.last3Months.length === 3 ? 'Regular' : 'Irregular',
        growthRate: sipTrends.last3Months.length >= 2 
          ? ((sipTrends.last3Months[0] / sipTrends.last3Months[sipTrends.last3Months.length - 1]) - 1) * 100 
          : 0
      }
    },
    weeklyAnalysis: {
      mostExpensiveDay: Object.entries(weeklyPatterns.dayWise).length > 0
        ? Object.entries(weeklyPatterns.dayWise).sort(([, a], [, b]) => b - a)[0]
        : null,
      weekendAvg: weeklyPatterns.count.weekend ? weeklyPatterns.weekendTotal / weeklyPatterns.count.weekend : 0,
      weekdayAvg: weeklyPatterns.count.weekday ? weeklyPatterns.weekdayTotal / weeklyPatterns.count.weekday : 0,
      dayWiseSpending: weeklyPatterns.dayWise
    },
    categoryInsights: {
      topCategories,
      trends: categoryAnalysis.monthlyTrends,
      averageSize: Object.entries(categoryAnalysis.avgSize).reduce((acc, [cat, data]) => {
        acc[cat] = data.total / data.count;
        return acc;
      }, {})
    },
    spendingVelocity,
    merchantInsights: {
      topByFrequency: (() => {
        try {
          const frequency = merchantAnalytics.frequency || {};
          return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        } catch (error) {
          console.error('Error processing merchant frequency:', error);
          return [];
        }
      })(),
      categoryDistribution: merchantAnalytics.categoryWise || {},
      recentTransactions: (() => {
        try {
          const recent = merchantAnalytics.recent || [];
          return [...recent]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        } catch (error) {
          console.error('Error processing recent transactions:', error);
          return [];
        }
      })()
    },
    investmentData,
    highestSpendingDay: Object.entries(dailySpending).sort(([, a], [, b]) => b - a)[0],
    mostFrequentCategory: Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0]?.[0],
    largestExpense: Math.max(...transactions.map(t => parseFloat(t.amount)))
  };
}; 