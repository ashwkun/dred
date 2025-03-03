import React, { useState, useEffect, useRef } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiReceipt, BiPlus, BiTrash, BiLineChart, BiChevronDown } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import Dialog from './components/Dialog';
import { FaUtensils } from 'react-icons/fa';
import { defaultCategories, getCategoryIcon, getMerchantSuggestions, iconMap } from './data/categories';
import AddCategoryDialog from './components/AddCategoryDialog';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { retryOperation } from './utils/firestore';
import InsightsView from './components/InsightsView';

// Move formatAccountName to the top, before any components
const formatAccountName = (account, cards) => {
  // If it's a card
  if (account.startsWith('card_')) {
    const cardId = account.replace('card_', ''); // Remove prefix to match with cards array
    const card = cards.find(c => c.id === cardId);
    if (card) {
      const bankNameFirst = card.bankName.split(' ')[0];
      const lastFourDigits = card.cardNumber.slice(-4);
      return `${bankNameFirst}-${lastFourDigits}`;
    }
  }
  
  // For cash and bank account, keep as is
  if (account === 'cash') return 'Cash';
  if (account === 'bank') return 'Bank';
  
  return account;
};

// Add new component for category selector
const CategorySelector = ({ isOpen, onClose, onSelect, categories, onAddCategory }) => {
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    } transition-opacity`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Select Category</h2>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {[...defaultCategories, ...categories].map(cat => (
            <button
              key={cat.name}
              onClick={() => {
                onSelect({
                  name: cat.name,
                  iconName: cat.iconName || 'FaUtensils'
                });
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {React.createElement(cat.icon || FaUtensils, {
                className: "text-white text-lg"
              })}
              <span className="text-white">{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onAddCategory}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
          >
            <BiPlus />
            Add Category
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSelector = ({ isOpen, onClose, onSelect, accounts }) => {
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    } transition-opacity`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Select Account</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {accounts.map(account => (
            <button
              key={account.id}
              onClick={() => {
                onSelect(account.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span className="text-white">{account.name}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this new component at the top of the file
const TransactionItem = ({ transaction, cards, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-white/70">
            {React.createElement(getCategoryIcon(transaction.categoryIcon || 'FaUtensils'), {
              className: "text-lg"
            })}
          </div>
          <p className="text-white font-medium">₹{parseFloat(transaction.amount).toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-white/60 text-sm">
            {formatAccountName(transaction.account, cards)}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent expansion when clicking delete
              onDelete(transaction.id);
            }}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <BiTrash className="text-sm" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <div 
        className={`grid transition-all duration-200 ${
          isExpanded 
            ? 'grid-rows-[1fr] opacity-100 mt-2' 
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <p className="text-white text-2xl font-bold">₹{parseFloat(transaction.amount).toFixed(2)}</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/50 text-sm">Date</p>
                <p className="text-white">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Category</p>
                <p className="text-white">{transaction.category}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Merchant</p>
                <p className="text-white">{transaction.merchant}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Account</p>
                <p className="text-white">{formatAccountName(transaction.account, cards)}</p>
              </div>
              {transaction.description && (
                <div className="col-span-2">
                  <p className="text-white/50 text-sm">Description</p>
                  <p className="text-white">{transaction.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this helper function to calculate insights
const calculateInsights = (transactions, monthlyBudget) => {
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
  
  const lastMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === (thisMonth - 1) && date.getFullYear() === thisYear;
  });

  // Calculate totals
  const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Category-wise spending
  const categorySpending = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Account-wise spending
  const accountSpending = transactions.reduce((acc, t) => {
    acc[t.account] = (acc[t.account] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Daily spending trend (last 30 days)
  const dailySpending = transactions
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
  const merchantSpending = transactions.reduce((acc, t) => {
    acc[t.merchant] = (acc[t.merchant] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  // Monthly breakdown (last 6 months)
  const monthlySpending = {};
  for (let i = 0; i < 6; i++) {
    const month = new Date(thisYear, thisMonth - i, 1);
    const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlySpending[monthKey] = transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  // Budget insights
  const remainingBudget = monthlyBudget - thisMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const dailyBudget = remainingBudget / (daysInMonth - today);
  const budgetStatus = (thisMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / monthlyBudget) * 100;
  
  // Average transaction size
  const avgTransactionSize = thisMonthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / (thisMonthTransactions.length || 1);

  // Highest spending day
  const dailyTotals = transactions.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + parseFloat(t.amount);
    return acc;
  }, {});
  const highestSpendingDay = Object.entries(dailyTotals)
    .sort(([,a], [,b]) => b - a)[0];

  // Separate investment transactions
  const investmentTransactions = transactions.filter(t => t.category === "Investment");
  const nonInvestmentTransactions = transactions.filter(t => t.category !== "Investment");

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

  // Use nonInvestmentTransactions for regular expense calculations
  const thisMonthTotal = nonInvestmentTransactions
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

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
    highestSpendingDay,
    daysLeft: daysInMonth - today,
    investments: investmentInsights
  };
};

// Add this component inside InsightsView
const InvestmentSection = ({ investments }) => {
  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Total Invested</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalInvested.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Projected (1 Year)</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalProjected.oneYear.toFixed(2)}</p>
          <p className="text-white/60 text-sm">
            +₹{(investments.totalProjected.oneYear - investments.totalInvested).toFixed(2)}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white/60 text-sm">Projected (5 Years)</h3>
          <p className="text-2xl font-bold text-white">₹{investments.totalProjected.fiveYear.toFixed(2)}</p>
          <p className="text-white/60 text-sm">
            +₹{(investments.totalProjected.fiveYear - investments.totalInvested).toFixed(2)}
          </p>
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

      {/* Instrument-wise Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Investment Distribution</h3>
          <div className="space-y-3">
            {Object.entries(investments.instrumentWise)
              .sort(([, a], [, b]) => b - a)
              .map(([instrument, amount]) => (
                <div
                  key={instrument}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">{instrument}</span>
                    <span className="text-white font-medium">₹{amount.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Expected Returns (Annual)</span>
                      <span className="text-green-400">
                        {investments.projectedReturns[instrument]?.rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">5 Year Projection</span>
                      <span className="text-white">
                        ₹{investments.projectedReturns[instrument]?.fiveYear.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Investment Tips</h3>
          <div className="space-y-3 text-white/80">
            <p>• Diversify your portfolio across different instruments</p>
            <p>• Consider increasing SIP investments for long-term growth</p>
            <p>• Review and rebalance your portfolio periodically</p>
            <p>• Stay invested for longer periods to benefit from compounding</p>
            <p>• Keep emergency funds separate from investments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function ExpenseTracker({ user, masterPassword }) {
  const [activeView, setActiveView] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [cards, setCards] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    account: '',
    category: '',
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false);
  const merchantInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  const accounts = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank', name: 'Bank Account' },
    ...cards.map(card => ({
      id: `card_${card.id}`,
      name: `${card.bankName} Card (${card.cardNumber.slice(-4)})`
    }))
  ];

  const categories = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Others'
  ];

  // Define fetchTransactions first
  const fetchTransactions = async () => {
    if (!user || !masterPassword) return;
    setLoading(true);
    setError(null);

    try {
      // Try to refresh token first to ensure fresh authentication
      try {
        await user.getIdToken(true);
        console.log("Token refreshed before fetching transactions");
      } catch (tokenError) {
        console.error("Error refreshing token:", tokenError);
      }

      const q = query(
        collection(db, "transactions"),
        where("uid", "==", user.uid)
      );

      console.log("Fetching transactions for user:", user.uid);
      const querySnapshot = await getDocs(q);
      console.log(`Retrieved ${querySnapshot.docs.length} transactions`);
      
      const fetchedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: CryptoJS.AES.decrypt(doc.data().amount, masterPassword).toString(CryptoJS.enc.Utf8),
        merchant: CryptoJS.AES.decrypt(doc.data().merchant, masterPassword).toString(CryptoJS.enc.Utf8),
        description: CryptoJS.AES.decrypt(doc.data().description, masterPassword).toString(CryptoJS.enc.Utf8),
        account: CryptoJS.AES.decrypt(doc.data().account, masterPassword).toString(CryptoJS.enc.Utf8),
        category: doc.data().category // Keep category as is since it's not encrypted
      }));

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please check your internet connection or disable ad-blockers.");
    } finally {
      setLoading(false);
    }
  };

  // Then define other functions that use fetchTransactions
  const handleAddTransaction = async () => {
    try {
      await retryOperation(async () => {
        if (!newTransaction.amount || !newTransaction.account || !newTransaction.category || !newTransaction.merchant) {
          console.error("Please fill in all required fields");
          return;
        }

        const encryptedTransaction = {
          uid: user.uid,
          amount: CryptoJS.AES.encrypt(newTransaction.amount.toString(), masterPassword).toString(),
          account: CryptoJS.AES.encrypt(newTransaction.account, masterPassword).toString(), // Store with prefix
          category: newTransaction.category,
          categoryIcon: newTransaction.categoryIcon || 'FaUtensils',
          merchant: CryptoJS.AES.encrypt(newTransaction.merchant, masterPassword).toString(),
          description: CryptoJS.AES.encrypt(newTransaction.description || '', masterPassword).toString(),
          date: newTransaction.date,
          createdAt: new Date()
        };

        await addDoc(collection(db, "transactions"), encryptedTransaction);
        
        setNewTransaction({
          amount: '',
          account: '',
          category: '',
          categoryIcon: '',
          merchant: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        await fetchTransactions();
      });
    } catch (error) {
      setError("Failed to add transaction. Please check your connection.");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await deleteDoc(doc(db, "transactions", transactionId));
      await fetchTransactions(); // Call fetchTransactions after deleting
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Then define your useEffects
  useEffect(() => {
    fetchTransactions();
  }, [user, masterPassword]);

  // Fetch saved cards
  useEffect(() => {
    const fetchCards = async () => {
      if (!user || !masterPassword) return;
      
      try {
        const q = query(
          collection(db, "cards"),
          where("uid", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedCards = querySnapshot.docs.map(doc => ({
          id: doc.id, // Store the raw ID
          ...doc.data(),
          bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
          cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8)
        }));
        
        setCards(fetchedCards);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };

    fetchCards();
  }, [user, masterPassword]);

  // Fetch custom categories on component mount
  useEffect(() => {
    const fetchCustomCategories = async () => {
      if (!user || !masterPassword) return;
      
      try {
        // Try to refresh token first to ensure fresh authentication
        try {
          await user.getIdToken(true);
          console.log("Token refreshed before fetching custom categories");
        } catch (tokenError) {
          console.error("Error refreshing token for custom categories:", tokenError);
        }

        const q = query(
          collection(db, "custom_categories"),
          where("uid", "==", user.uid)
        );
        
        console.log("Fetching custom categories for user:", user.uid);
        const snapshot = await getDocs(q);
        console.log(`Retrieved ${snapshot.docs.length} custom categories`);
        
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: CryptoJS.AES.decrypt(doc.data().name, masterPassword).toString(CryptoJS.enc.Utf8),
          iconName: doc.data().iconName,
          icon: iconMap[doc.data().iconName] || FaUtensils,
          merchants: doc.data().merchants.map(m => 
            CryptoJS.AES.decrypt(m, masterPassword).toString(CryptoJS.enc.Utf8)
          )
        }));
        
        setCustomCategories(categoriesData);
      } catch (error) {
        console.error('Error loading custom categories:', error);
        setError('Failed to load custom categories');
      }
    };

    fetchCustomCategories();
  }, [user, masterPassword]);

  // Add this function to handle category selection
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setNewTransaction({ ...newTransaction, category });
    setMerchantSuggestions(getMerchantSuggestions(category, customCategories));
  };

  // Update handleAddCategory to save to Firestore
  const handleAddCategory = async (category) => {
    try {
      const encryptedCategory = {
        uid: user.uid,
        name: CryptoJS.AES.encrypt(category.name, masterPassword).toString(),
        iconName: category.iconName,
        merchants: category.merchants.map(m => 
          CryptoJS.AES.encrypt(m, masterPassword).toString()
        ),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "custom_categories"), encryptedCategory);
      
      const newCategory = {
        id: docRef.id,
        name: category.name,
        icon: iconMap[category.iconName],
        iconName: category.iconName,
        merchants: category.merchants
      };
      
      setCustomCategories([...customCategories, newCategory]);
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding custom category:', error);
      setError('Failed to add category. Please try again.');
    }
  };

  // Add function to delete custom category
  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteDoc(doc(db, "custom_categories", categoryId));
      setCustomCategories(customCategories.filter(c => c.id !== categoryId));
    } catch (error) {
      console.error('Error deleting custom category:', error);
    }
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (merchantInputRef.current && !merchantInputRef.current.contains(event.target)) {
        setShowMerchantSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update saveBudget function to use retry logic
  const saveBudget = async (amount) => {
    try {
      await retryOperation(async () => {
        const budgetRef = doc(db, "user_settings", user.uid);
        await setDoc(budgetRef, {
          monthlyBudget: amount,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setMonthlyBudget(amount);
      });
    } catch (error) {
      console.error('Error saving budget:', error);
      setError('Failed to save budget. Please try again.');
    }
  };

  // Update budget fetching to use retry logic
  useEffect(() => {
    const fetchBudget = async () => {
      if (!user) return;
      try {
        await retryOperation(async () => {
          const budgetDoc = await getDoc(doc(db, "user_settings", user.uid));
          if (budgetDoc.exists()) {
            setMonthlyBudget(budgetDoc.data().monthlyBudget || 0);
          } else {
            // Initialize with default settings if not exists
            await setDoc(doc(db, "user_settings", user.uid), {
              monthlyBudget: 0,
              createdAt: serverTimestamp()
            });
          }
        });
      } catch (error) {
        console.error('Error fetching budget:', error);
        setError('Failed to load budget settings');
      }
    };
    fetchBudget();
  }, [user]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-6">
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchTransactions();
            }}
            className="mt-2 px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingOverlay message="Loading transactions" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Add warning if needed */}
      {error && (
        <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-lg mb-6">
          <p>Having trouble? Try disabling your ad-blocker for this site.</p>
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
          <BiReceipt className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-white/60">Track your spending</p>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveView('transactions')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeView === 'transactions' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          Add Transaction
        </button>
        <button
          onClick={() => setActiveView('insights')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeView === 'insights' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          <BiLineChart className="inline mr-1" />
          Insights
        </button>
      </div>

      {/* Content Section - Wrap in a div */}
      <div>
        {activeView === 'transactions' ? (
          <div className="grid gap-6">
            {/* Add Transaction Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Add Transaction</h2>
                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full bg-white/10 rounded-lg p-3 text-white"
                  />
                  <button
                    onClick={() => setShowAccountSelector(true)}
                    className="w-full bg-white/10 rounded-lg p-3 text-left text-white hover:bg-white/20 transition-colors flex items-center justify-between"
                  >
                    <span>{accounts.find(a => a.id === newTransaction.account)?.name || 'Select Account'}</span>
                    <BiChevronDown className="text-lg opacity-50" />
                  </button>
                  <button
                    onClick={() => setShowCategorySelector(true)}
                    className="w-full bg-white/10 rounded-lg p-3 text-left text-white hover:bg-white/20 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {newTransaction.category && React.createElement(getCategoryIcon(newTransaction.categoryIcon || 'FaUtensils'), {
                        className: "text-lg"
                      })}
                      <span>{newTransaction.category || 'Select Category'}</span>
                    </div>
                    <BiChevronDown className="text-lg opacity-50" />
                  </button>
                  {newTransaction.category && (
                    <div className="relative" ref={merchantInputRef}>
                      <input
                        type="text"
                        placeholder="Search Merchant"
                        value={newTransaction.merchant}
                        onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                        onFocus={() => setShowMerchantSuggestions(true)}
                        className="w-full bg-white/10 rounded-lg p-3 text-white"
                      />
                      {showMerchantSuggestions && merchantSuggestions.length > 0 && (
                        <div className="absolute w-full mt-1 bg-gray-800 rounded-lg border border-white/10 max-h-48 overflow-y-auto z-10">
                          {merchantSuggestions
                            .filter(m => m.toLowerCase().includes(newTransaction.merchant.toLowerCase()))
                            .map((merchant, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setNewTransaction({ ...newTransaction, merchant });
                                  setShowMerchantSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 border-b border-white/5 last:border-0"
                              >
                                {merchant}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full bg-white/10 rounded-lg p-3 text-white"
                  />
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full bg-white/10 rounded-lg p-3 text-white"
                  />
                  <button
                    onClick={handleAddTransaction}
                    className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-white transition-colors"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-3">Recent Transactions</h2>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      cards={cards}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-white/60 text-center py-3 text-sm">
                      No transactions yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Insights View
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Spending Insights</h2>
            <InsightsView transactions={transactions} cards={cards} monthlyBudget={monthlyBudget} onSetBudget={saveBudget} />
          </div>
        )}
      </div>

      {/* Add Category Selector Dialog */}
      <CategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={(category) => {
          setNewTransaction({ 
            ...newTransaction, 
            category: category.name,
            categoryIcon: category.iconName,
            merchant: '' 
          });
          setMerchantSuggestions(getMerchantSuggestions(category.name, customCategories));
        }}
        onAddCategory={() => {
          setShowCategorySelector(false);
          setShowAddCategory(true);
        }}
        categories={customCategories}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleAddCategory}
      />

      {/* Add Account Selector */}
      <AccountSelector
        isOpen={showAccountSelector}
        onClose={() => setShowAccountSelector(false)}
        onSelect={(accountId) => setNewTransaction({ ...newTransaction, account: accountId })}
        accounts={accounts}
      />
    </div>
  );
}

export default ExpenseTracker;
