import React, { useState, useEffect, useRef } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiReceipt, BiPlus, BiTrash, BiLineChart, BiChevronDown } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import Dialog from './components/Dialog';
import { FaUtensils } from 'react-icons/fa';
import { defaultCategories, getCategoryIcon, getMerchantSuggestions, iconMap } from './data/categories';
import AddCategoryDialog from './components/AddCategoryDialog';

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

  const accounts = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank', name: 'Bank Account' },
    ...cards.map(card => ({
      id: card.id,
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

  const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Define fetchTransactions first
  const fetchTransactions = async () => {
    if (!user || !masterPassword) return;
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "transactions"),
        where("uid", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
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
        // Validate required fields
        if (!newTransaction.amount || !newTransaction.account || !newTransaction.category || !newTransaction.merchant) {
          console.error("Please fill in all required fields");
          return;
        }

        const encryptedTransaction = {
          uid: user.uid,
          amount: CryptoJS.AES.encrypt(newTransaction.amount.toString(), masterPassword).toString(),
          account: CryptoJS.AES.encrypt(newTransaction.account, masterPassword).toString(),
          category: newTransaction.category,
          categoryIcon: newTransaction.categoryIcon || 'FaUtensils',
          merchant: CryptoJS.AES.encrypt(newTransaction.merchant, masterPassword).toString(),
          description: CryptoJS.AES.encrypt(newTransaction.description || '', masterPassword).toString(),
          date: newTransaction.date,
          createdAt: new Date()
        };

        await addDoc(collection(db, "transactions"), encryptedTransaction);
        
        // Reset form
        setNewTransaction({
          amount: '',
          account: '',
          category: '',
          categoryIcon: '',
          merchant: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        // Refresh transactions list
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
        
        const snapshot = await getDocs(q);
        const cardsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          bankName: CryptoJS.AES.decrypt(doc.data().bankName, masterPassword).toString(CryptoJS.enc.Utf8),
          cardNumber: CryptoJS.AES.decrypt(doc.data().cardNumber, masterPassword).toString(CryptoJS.enc.Utf8)
        }));
        
        setCards(cardsData);
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    };

    fetchCards();
  }, [user, masterPassword]);

  // Fetch custom categories on component mount
  useEffect(() => {
    const fetchCustomCategories = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, "custom_categories"),
          where("uid", "==", user.uid)
        );
        
        const snapshot = await getDocs(q);
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

  // Update the formatAccountName function
  const formatAccountName = (account, cards) => {
    // If it's a card
    if (account.startsWith('card_')) {
      const card = cards.find(c => c.id === account);
      if (card) {
        // Decrypt the bank name
        const bankName = CryptoJS.AES.decrypt(card.bankName, masterPassword).toString(CryptoJS.enc.Utf8);
        const lastFourDigits = CryptoJS.AES.decrypt(card.cardNumber, masterPassword).toString(CryptoJS.enc.Utf8).slice(-4);
        const bankNameFirst = bankName.split(' ')[0];
        return `${bankNameFirst}-${lastFourDigits}`;
      }
    }
    
    // For cash and bank account, keep as is
    if (account === 'cash') return 'Cash';
    if (account === 'bank') return 'Bank';
    
    return account;
  };

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

            {/* Transactions List - Compact Version */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-3">Recent Transactions</h2>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10"
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
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-white/40 hover:text-white/60 transition-colors"
                        >
                          <BiTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
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
            <h2 className="text-xl font-semibold text-white mb-4">Spending Insights</h2>
            {/* Add your insights components here */}
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
