import React, { useState, useEffect } from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp, FaWallet } from 'react-icons/fa';
import { BiEdit, BiSave, BiX } from 'react-icons/bi';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from '../../../firebase';
import { auth } from '../../../firebase'; // Import auth directly

// Budget Edit Modal Component
const BudgetEditModal = ({ isOpen, onClose, currentBudget, onSave }) => {
  const [newBudget, setNewBudget] = useState(currentBudget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setNewBudget(currentBudget);
      setError(null);
    }
  }, [isOpen, currentBudget]);
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    if (!newBudget) {
      setError("Please enter a budget amount");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(parseFloat(newBudget));
      onClose();
    } catch (error) {
      setError("Failed to update budget");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/90 border border-white/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Update Monthly Budget</h3>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <BiX size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">Monthly Budget Amount (₹)</label>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-lg">₹</span>
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="bg-white/10 border border-white/20 text-white py-3 px-4 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg"
              placeholder="Enter amount"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm mt-2">{error}</div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <BiSave />
                <span>Save Budget</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const BudgetOverview = (props) => {
  console.log("BudgetOverview props:", props);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Effect to ensure we have the current user
  useEffect(() => {
    setCurrentUser(auth.currentUser);
    console.log("Current user from auth:", auth.currentUser);
  }, []);
  
  const handleBudgetChange = async (newBudgetAmount) => {
    try {
      setSaveStatus(null);
      
      // Get userId directly from auth
      const userId = auth.currentUser?.uid || props.userId;
      console.log("Budget update attempted with userId:", userId);
      
      if (!userId) {
        console.error("Cannot update budget: User ID is missing or invalid");
        setSaveStatus('error');
        return;
      }
      
      const userDocRef = doc(db, 'user_settings', userId);
      
      // Check if the document exists first
      try {
        await updateDoc(userDocRef, {
          monthlyBudget: newBudgetAmount,
          uid: userId // Add this line to ensure uid field is present
        });
      } catch (error) {
        // If document doesn't exist, create it
        if (error.code === 'not-found') {
          await setDoc(userDocRef, {
            monthlyBudget: newBudgetAmount,
            uid: userId // Use uid field
          });
        } else {
          throw error;
        }
      }
      
      props.onSetBudget(newBudgetAmount);
      setSaveStatus('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
      return true;
    } catch (error) {
      console.error("Error updating budget:", error.code, error.message);
      setSaveStatus('error');
      throw error;
    }
  };

  // Calculate budget insights
  const totalSpent = props.insights?.totalSpent || 0;
  const monthlyBudget = props.monthlyBudget || 0;
  const remainingBudget = monthlyBudget - totalSpent;
  const percentSpent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  
  // Determine budget status
  const getBudgetStatus = () => {
    if (percentSpent >= 100) return 'exceeded';
    if (percentSpent >= 80) return 'warning';
    return 'good';
  };
  
  const budgetStatus = getBudgetStatus();
  
  // Budget status colors
  const statusColors = {
    good: {
      bg: 'from-emerald-500 to-teal-500',
      text: 'text-emerald-300',
      progress: 'bg-emerald-300'
    },
    warning: {
      bg: 'from-amber-500 to-yellow-500',
      text: 'text-amber-300',
      progress: 'bg-amber-300'
    },
    exceeded: {
      bg: 'from-red-500 to-rose-500',
      text: 'text-red-300',
      progress: 'bg-red-300'
    }
  };
  
  // Get current date info
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const percentOfMonthPassed = (currentDay / daysInMonth) * 100;
  
  // Calculate projections
  const dailyBudget = monthlyBudget / daysInMonth;
  const dailySpentSoFar = totalSpent / currentDay;
  const projectedMonthTotal = dailySpentSoFar * daysInMonth;
  const projectedOverUnder = monthlyBudget - projectedMonthTotal;
  const isProjectedOver = projectedOverUnder < 0;

  return (
    <>
      {/* Budget Edit Modal */}
      <BudgetEditModal 
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        currentBudget={monthlyBudget}
        onSave={handleBudgetChange}
      />
    
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={props.toggleSection}
        >
          <div className="flex items-center gap-2">
            <FaWallet className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Budget Overview</h3>
          </div>
          <button className="text-white/60">
            {props.isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {props.isExpanded && (
          <div className="mt-4">
            {/* Apple Wallet-style Budget Card */}
            <div className={`relative bg-gradient-to-r ${statusColors[budgetStatus].bg} rounded-xl p-4 mb-6 shadow-lg overflow-hidden`}>
              <div className="absolute top-0 right-0 p-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent toggling the section
                    setShowBudgetModal(true);
                  }}
                  className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <BiEdit size={20} />
                </button>
              </div>
              
              <div className="mb-2">
                <h4 className={`text-sm uppercase ${statusColors[budgetStatus].text}`}>Monthly Budget</h4>
                <div className="text-white text-2xl font-bold">₹{monthlyBudget.toLocaleString()}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <h5 className="text-xs text-white/70 mb-1">Spent</h5>
                  <div className="text-white font-semibold">₹{Math.round(totalSpent).toLocaleString()}</div>
                </div>
                <div>
                  <h5 className="text-xs text-white/70 mb-1">Remaining</h5>
                  <div className="text-white font-semibold">₹{Math.round(remainingBudget).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${statusColors[budgetStatus].progress}`} 
                    style={{ width: `${Math.min(percentSpent, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-white/70">
                  <span>{Math.round(percentSpent)}% of budget</span>
                  <span>{Math.round(percentOfMonthPassed)}% of month</span>
                </div>
              </div>
            </div>
            
            {/* Budget Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-white/60 text-sm mb-3">Budget Projection</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Daily Spending</span>
                    <span className="text-white font-medium">₹{Math.round(dailySpentSoFar).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Daily Budget</span>
                    <span className="text-white font-medium">₹{Math.round(dailyBudget).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Projection for Month</span>
                    <span className={`font-medium ${isProjectedOver ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{Math.round(projectedMonthTotal).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">
                      {isProjectedOver ? 'Projected Overspend' : 'Projected Savings'}
                    </span>
                    <span className={`font-medium ${isProjectedOver ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{Math.abs(Math.round(projectedOverUnder)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-white/60 text-sm mb-3">Budget Health</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${budgetStatus === 'good' ? 'bg-green-400' : budgetStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <span className="text-white/80">
                      {budgetStatus === 'good' ? 'On Track' : budgetStatus === 'warning' ? 'At Risk' : 'Over Budget'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Spending Rate</span>
                    <span className="text-white font-medium">
                      {percentOfMonthPassed > 0 && percentSpent > 0 ? 
                        (percentSpent / percentOfMonthPassed).toFixed(2) : 1}x
                    </span>
                  </div>
                  
                  <div className="text-white/80">
                    {budgetStatus === 'good' && percentOfMonthPassed > percentSpent ? (
                      <span>You're spending at a healthy rate and staying within budget.</span>
                    ) : budgetStatus === 'warning' ? (
                      <span>Your spending is slightly high. Consider reducing expenses for the rest of the month.</span>
                    ) : (
                      <span>You've exceeded your monthly budget. Review your spending in high-expense categories.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Success or Error Message */}
            {saveStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                Budget updated successfully!
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                Failed to update budget. Please try again.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BudgetOverview; 