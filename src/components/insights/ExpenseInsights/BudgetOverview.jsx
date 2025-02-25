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
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaWallet className="text-white/60" />
              <h3 className="text-lg font-semibold text-white">Monthly Budget</h3>
            </div>
            {!showBudgetInput && (
              <button
                onClick={() => setShowBudgetInput(true)}
                className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <BiEdit size={18} />
              </button>
            )}
          </div>
          
          {showBudgetInput ? (
            <div className="mt-4">
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
            </div>
          ) : (
            <div>
              {/* Budget display and stats */}
              {/* Add content from original component */}
            </div>
          )}
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
  );
};

export default BudgetOverview; 