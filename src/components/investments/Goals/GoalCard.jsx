import React, { useState } from 'react';
import { FaEdit, FaTrash, FaStar, FaCalendarAlt, FaChartLine, FaTimes } from 'react-icons/fa';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import UpdateGoalProgress from './UpdateGoalProgress';
import { SuccessAnimation } from '../../SuccessAnimation';
import GoalForm from './GoalForm';

const GoalCard = ({ goal, refreshGoals }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Handle delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  // Handle actual deletion
  const handleConfirmDelete = async () => {
    try {
      if (!goal?.id) return;
      await deleteDoc(doc(db, "investment_goals", goal.id));
      
      if (refreshGoals) refreshGoals();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };
  
  // Calculate these only if goal exists
  const progressPercentage = goal ? (goal.currentAmount / goal.targetAmount * 100) : 0;
  const timeElapsedMonths = goal?.createdAt ? 
    Math.floor((new Date() - (new Date(goal.createdAt.seconds ? goal.createdAt.seconds * 1000 : goal.createdAt))) / (1000 * 60 * 60 * 24 * 30)) : 0;
  const totalMonths = goal?.timeframe ? (goal.timeframe * 12) : 60; // Default to 5 years
  const timePercentage = Math.min(100, Math.max(0, (timeElapsedMonths / totalMonths) * 100));
  
  // Determine if goal is on track
  const isOnTrack = progressPercentage >= timePercentage;
  
  if (!goal) {
    return null; // Don't render anything if no goal
  }
  
  return (
    <>
      <div className="flex-shrink-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <div className="bg-white/10 p-2 rounded-lg mr-3">
              <FaStar className="text-yellow-400" />
            </div>
            <h4 className="text-white font-medium">{goal.name}</h4>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEditModal(true)}
              className="text-white/60 hover:text-white p-1"
            >
              <FaEdit />
            </button>
            <button 
              onClick={handleDeleteClick}
              className="text-white/60 hover:text-red-400 p-1"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <div>Progress</div>
              <div>{Math.round(progressPercentage)}%</div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/60 text-xs">Target</p>
              <p className="text-white font-semibold">₹{goal.targetAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white/60 text-xs">Current</p>
              <p className="text-white font-semibold">₹{goal.currentAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <FaCalendarAlt className="text-white/60" />
            <span className="text-white/80">{goal.timeframe || 5} years</span>
            <span className="text-white/40">|</span>
            <FaChartLine className={isOnTrack ? 'text-green-400' : 'text-yellow-400'} />
            <span className={isOnTrack ? 'text-green-400' : 'text-yellow-400'}>
              {isOnTrack ? 'On track' : 'Falling behind'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-white/70 text-sm">Monthly investment</div>
            <div className="text-white font-semibold">₹{goal.monthlyInvestment?.toLocaleString() || "N/A"}</div>
          </div>
        </div>
        <UpdateGoalProgress 
          goalId={goal.id}
          currentAmount={goal.currentAmount}
          refreshGoals={refreshGoals}
        />
      </div>
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-white/20 rounded-xl p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Edit Investment Goal</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-white/60 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <GoalForm 
              existingGoal={goal}
              onSave={() => {
                setShowEditModal(false);
                refreshGoals();
                setShowSuccessAnimation(true);
                setTimeout(() => setShowSuccessAnimation(false), 2000);
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-white/20 rounded-xl p-6 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Goal</h3>
            <p className="text-white/70 mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Animation */}
      {showSuccessAnimation && <SuccessAnimation message="Goal updated successfully!" />}
    </>
  );
};

export default GoalCard; 