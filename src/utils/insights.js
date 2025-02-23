export const calculateInsights = (transactions, monthlyBudget) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const today = now.getDate();
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  
  // Filter transactions for current and last month
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
  
  // ... rest of the calculateInsights function ...
  // Copy the entire function from ExpenseTracker.jsx
}; 