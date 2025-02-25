import React, { useState, useEffect } from 'react';
import { FaChartLine, FaChevronDown, FaChevronUp, FaWallet } from 'react-icons/fa';
import { BiEdit, BiSave, BiX } from 'react-icons/bi';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from '../../../firebase';
import { auth } from '../../../firebase'; // Import auth directly

const BudgetOverview = (props) => {
  console.log("BudgetOverview props:", props);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newBudget, setNewBudget] = useState(props.monthlyBudget);
  const [saveStatus, setSaveStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Effect to ensure we have the current user
  useEffect(() => {
    setCurrentUser(auth.currentUser);
    console.log("Current user from auth:", auth.currentUser);
  }, []);
  
  const handleBudgetChange = async () => {
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
          monthlyBudget: parseFloat(newBudget),
          uid: userId // Add this line to ensure uid field is present
        });
      } catch (error) {
        // If document doesn't exist, create it
        if (error.code === 'not-found') {
          await setDoc(userDocRef, {
            monthlyBudget: parseFloat(newBudget),
            uid: userId // Use uid field
          });
        } else {
          throw error;
        }
      }
      
      props.onSetBudget(parseFloat(newBudget));
      setShowBudgetInput(false);
      setSaveStatus('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error updating budget:", error.code, error.message);
      setSaveStatus('error');
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
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={props.toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartLine className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Budget Overview</h3>
        </div>
        <button className="text-white/60">
          {props.isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {props.isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Apple Wallet Style Budget Card */}
          <div className={`rounded-xl overflow-hidden shadow-lg relative bg-gradient-to-br ${statusColors[budgetStatus].bg} p-1`}>
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide">Monthly Budget</h3>
                  <div className="flex items-baseline mt-1">
                    <span className="text-white text-2xl md:text-3xl font-bold">₹{monthlyBudget.toLocaleString()}</span>
                    {!showBudgetInput && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBudgetInput(true);
                        }}
                        className="ml-2 text-white/60 hover:text-white"
                      >
                        <BiEdit size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Spent</span>
                  <span className="text-white text-xl md:text-2xl font-bold mt-1">₹{totalSpent.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`${statusColors[budgetStatus].text}`}>
                    {budgetStatus === 'exceeded' ? 'Over Budget' : 'Remaining'}
                  </span>
                  <span className="text-white font-medium">
                    {budgetStatus === 'exceeded' ? '+' : ''}₹{Math.abs(remainingBudget).toLocaleString()}
                  </span>
                </div>
                
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
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
          
          {/* Budget Editing Section */}
          {showBudgetInput && (
            <div className="mt-4 bg-white/5 rounded-xl p-4">
              <h4 className="text-white/60 text-sm mb-3">Update Monthly Budget</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/60">₹</span>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white py-2 px-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleBudgetChange}
                  className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg flex-1 transition-colors"
                >
                  <BiSave />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setShowBudgetInput(false)}
                  className="flex items-center justify-center gap-1 bg-white/10 hover:bg-red-500/20 text-white py-2 px-4 rounded-lg flex-1 transition-colors"
                >
                  <BiX />
                  <span>Cancel</span>
                </button>
              </div>
              
              {saveStatus === 'success' && (
                <div className="text-green-400 text-sm mt-2">
                  Budget updated successfully!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-red-400 text-sm mt-2">
                  Failed to update budget. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetOverview; 