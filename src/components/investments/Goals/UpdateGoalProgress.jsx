import React, { useState } from 'react';
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { BiPlus } from 'react-icons/bi';

const UpdateGoalProgress = ({ goalId, currentAmount, refreshGoals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleUpdateProgress = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setIsSubmitting(true);
    try {
      const goalRef = doc(db, "investment_goals", goalId);
      const docSnap = await getDoc(goalRef);
      
      if (docSnap.exists()) {
        const newAmount = currentAmount + parseFloat(amount);
        await updateDoc(goalRef, {
          currentAmount: newAmount,
          updatedAt: new Date().toISOString()
        });
        
        if (refreshGoals) refreshGoals();
        setIsOpen(false);
        setAmount("");
      }
    } catch (error) {
      console.error("Error updating goal progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
      >
        <BiPlus />
        <span>Update Progress</span>
      </button>
    );
  }
  
  return (
    <div className="mt-3 p-3 bg-white/5 rounded-lg">
      <label className="block text-white/70 text-xs mb-1">Add to Current Progress (₹)</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
        />
        <button
          onClick={handleUpdateProgress}
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Add"}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UpdateGoalProgress; 