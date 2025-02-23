import { useState, useEffect } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiReceipt, BiPlus, BiTrash } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import Dialog from './components/Dialog';

function ExpenseTracker({ user, masterPassword }) {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalExpenses: 0,
    thisMonth: 0,
    byCategory: {}
  });

  const categories = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Others'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [user, masterPassword]);

  const fetchExpenses = async () => {
    if (!user || !masterPassword) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, "expenses"),
        where("uid", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetchedExpenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: CryptoJS.AES.decrypt(doc.data().amount, masterPassword).toString(CryptoJS.enc.Utf8),
        description: CryptoJS.AES.decrypt(doc.data().description, masterPassword).toString(CryptoJS.enc.Utf8)
      }));

      setExpenses(fetchedExpenses);
      calculateStats(fetchedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenseList) => {
    const total = expenseList.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const currentMonth = new Date().getMonth();
    const thisMonthExpenses = expenseList
      .filter(exp => new Date(exp.date).getMonth() === currentMonth)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const categoryTotals = expenseList.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    setStats({
      totalExpenses: total,
      thisMonth: thisMonthExpenses,
      byCategory: categoryTotals
    });
  };

  const handleAddExpense = async () => {
    try {
      const encryptedExpense = {
        uid: user.uid,
        amount: CryptoJS.AES.encrypt(newExpense.amount.toString(), masterPassword).toString(),
        category: newExpense.category,
        description: CryptoJS.AES.encrypt(newExpense.description, masterPassword).toString(),
        date: newExpense.date,
        createdAt: new Date()
      };

      await addDoc(collection(db, "expenses"), encryptedExpense);
      setShowAddExpense(false);
      setNewExpense({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading expenses" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
            <BiReceipt className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Expenses</h1>
            <p className="text-white/60">Track your spending</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="bg-white/10 hover:bg-white/20 rounded-xl p-3 text-white transition-colors"
        >
          <BiPlus className="text-xl" />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-white">₹{stats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
          <p className="text-3xl font-bold text-white">₹{stats.thisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
          <p className="text-3xl font-bold text-white">{Object.keys(stats.byCategory).length}</p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Expenses</h2>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{expense.description}</p>
                  <p className="text-white/60 text-sm">{expense.category} • {expense.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-white font-medium">₹{parseFloat(expense.amount).toFixed(2)}</p>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <BiTrash />
                  </button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-white/60 text-center py-4">
                No expenses recorded yet. Add your first expense!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        title="Add Expense"
        message={
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            />
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            />
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            />
          </div>
        }
        confirmText="Add"
        onConfirm={handleAddExpense}
      />
    </div>
  );
}

export default ExpenseTracker;
