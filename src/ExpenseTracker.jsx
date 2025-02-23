import { useState, useEffect } from 'react';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { BiReceipt, BiPlus, BiTrash, BiLineChart } from 'react-icons/bi';
import { LoadingOverlay } from './components/LoadingOverlay';
import Dialog from './components/Dialog';

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

  // Fetch transactions
  useEffect(() => {
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

    fetchTransactions();
  }, [user, masterPassword]);

  const handleAddTransaction = async () => {
    try {
      const encryptedTransaction = {
        uid: user.uid,
        amount: CryptoJS.AES.encrypt(newTransaction.amount.toString(), masterPassword).toString(),
        account: newTransaction.account,
        category: newTransaction.category,
        merchant: CryptoJS.AES.encrypt(newTransaction.merchant, masterPassword).toString(),
        description: CryptoJS.AES.encrypt(newTransaction.description, masterPassword).toString(),
        date: newTransaction.date,
        createdAt: new Date()
      };

      await addDoc(collection(db, "transactions"), encryptedTransaction);
      setShowAddTransaction(false);
      setNewTransaction({
        amount: '',
        account: '',
        category: '',
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading transactions" />;
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('transactions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'transactions' 
                ? 'bg-white/20 text-white' 
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'insights' 
                ? 'bg-white/20 text-white' 
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            <BiLineChart className="inline mr-1" />
            Insights
          </button>
        </div>
      </div>

      {activeView === 'transactions' ? (
        <>
          {/* Add Transaction Button */}
          <button
            onClick={() => setShowAddTransaction(true)}
            className="w-full mb-4 bg-white/10 hover:bg-white/20 rounded-xl p-4 text-white transition-colors flex items-center justify-center gap-2"
          >
            <BiPlus className="text-xl" />
            Add Transaction
          </button>

          {/* Transactions List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{transaction.merchant}</p>
                      <p className="text-white/60 text-sm">
                        {transaction.category} • {transaction.account} • {transaction.date}
                      </p>
                      {transaction.description && (
                        <p className="text-white/40 text-sm mt-1">{transaction.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-white font-medium">₹{parseFloat(transaction.amount).toFixed(2)}</p>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <BiTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-white/60 text-center py-4">
                    No transactions recorded yet. Add your first transaction!
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        // Insights View (to be implemented)
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Spending Insights</h2>
          {/* Add your insights components here */}
        </div>
      )}

      {/* Add Transaction Dialog */}
      <Dialog
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="Add Transaction"
        message={
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
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Merchant"
              value={newTransaction.merchant}
              onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
              className="w-full bg-white/10 rounded-lg p-3 text-white"
            />
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
          </div>
        }
        confirmText="Add"
        onConfirm={handleAddTransaction}
      />
    </div>
  );
}

export default ExpenseTracker;
