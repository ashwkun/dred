import React, { useState, useEffect } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiReceipt, BiPlus, BiTrash, BiLineChart } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import Dialog from './components/Dialog';
import { FaUtensils } from 'react-icons/fa';
import { defaultCategories, getCategoryIcon, getMerchantSuggestions } from './data/categories';
import AddCategoryDialog from './components/AddCategoryDialog';

// Add new component for category selector
const CategorySelector = ({ isOpen, onClose, onSelect, categories }) => {
  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    } transition-opacity`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Select Category</h2>
        <div className="grid grid-cols-2 gap-3">
          {[...defaultCategories, ...categories].map(cat => (
            <button
              key={cat.name}
              onClick={() => {
                onSelect(cat.name);
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
        <div className="flex justify-end mt-4">
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

  // Define fetchTransactions first
  const fetchTransactions = async () => {
    if (!user || !masterPassword) return;
    setLoading(true);

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
        description: CryptoJS.AES.decrypt(doc.data().description, masterPassword).toString(CryptoJS.enc.Utf8)
      }));

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Then define other functions that use fetchTransactions
  const handleAddTransaction = async () => {
    // Validate required fields
    if (!newTransaction.amount || !newTransaction.account || !newTransaction.category || !newTransaction.merchant) {
      // You might want to show an error message to the user
      console.error("Please fill in all required fields");
      return;
    }

    try {
      const encryptedTransaction = {
        uid: user.uid,
        amount: CryptoJS.AES.encrypt(newTransaction.amount.toString(), masterPassword).toString(),
        account: newTransaction.account,
        category: newTransaction.category,
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
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh transactions list
      await fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      // You might want to show an error message to the user
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
          ...doc.data(),
          name: CryptoJS.AES.decrypt(doc.data().name, masterPassword).toString(CryptoJS.enc.Utf8),
          merchants: doc.data().merchants.map(m => 
            CryptoJS.AES.decrypt(m, masterPassword).toString(CryptoJS.enc.Utf8)
          )
        }));
        
        setCustomCategories(categoriesData);
      } catch (error) {
        console.error('Error loading custom categories:', error);
      }
    };

    fetchCustomCategories();
  }, [user, masterPassword]);

  // Add this function to handle category selection
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setNewTransaction({ ...newTransaction, category });
    setMerchantSuggestions(getMerchantSuggestions(category));
  };

  // Update handleAddCategory to save to Firestore
  const handleAddCategory = async (category) => {
    try {
      const encryptedCategory = {
        uid: user.uid,
        name: CryptoJS.AES.encrypt(category.name, masterPassword).toString(),
        icon: category.icon.name, // Store icon component name
        merchants: category.merchants.map(m => 
          CryptoJS.AES.encrypt(m, masterPassword).toString()
        ),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "custom_categories"), encryptedCategory);
      
      setCustomCategories([...customCategories, {
        id: docRef.id,
        ...category
      }]);
      
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding custom category:', error);
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

  if (loading) {
    return <LoadingOverlay message="Loading transactions" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
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
                  <select
                    value={newTransaction.account}
                    onChange={(e) => setNewTransaction({ ...newTransaction, account: e.target.value })}
                    className="w-full bg-white/10 rounded-lg p-3 text-white appearance-none hover:bg-white/20 transition-colors cursor-pointer
                      border border-white/10 focus:outline-none focus:border-white/30"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='white' opacity='0.5'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center'
                    }}
                  >
                    <option value="" disabled className="bg-gray-800">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id} className="bg-gray-800">
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCategorySelector(true)}
                    className="w-full bg-white/10 rounded-lg p-3 text-left text-white hover:bg-white/20 transition-colors flex items-center justify-between"
                  >
                    <span>{newTransaction.category || 'Select Category'}</span>
                    {newTransaction.category && (
                      React.createElement(getCategoryIcon(newTransaction.category), {
                        className: "text-lg"
                      })
                    )}
                  </button>
                  {newTransaction.category && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search Merchant"
                        value={newTransaction.merchant}
                        onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                        className="w-full bg-white/10 rounded-lg p-3 text-white"
                      />
                      {merchantSuggestions.length > 0 && (
                        <div className="absolute w-full mt-1 bg-gray-800 rounded-lg border border-white/10 max-h-48 overflow-y-auto z-10">
                          {merchantSuggestions
                            .filter(m => m.toLowerCase().includes(newTransaction.merchant.toLowerCase()))
                            .map((merchant, index) => (
                              <button
                                key={index}
                                onClick={() => setNewTransaction({ ...newTransaction, merchant })}
                                className="w-full text-left px-3 py-2 text-white hover:bg-white/10"
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
                          {React.createElement(getCategoryIcon(transaction.category) || FaUtensils, {
                            className: "text-lg"
                          })}
                        </div>
                        <p className="text-white font-medium">₹{parseFloat(transaction.amount).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-white/60 text-sm">{transaction.account}</p>
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
          setNewTransaction({ ...newTransaction, category, merchant: '' });
          setMerchantSuggestions(getMerchantSuggestions(category));
        }}
        categories={customCategories}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleAddCategory}
      />
    </div>
  );
}

export default ExpenseTracker;
