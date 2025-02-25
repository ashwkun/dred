import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { v4 as uuidv4 } from 'uuid';
import GoalList from './GoalList';
import GoalForm from './GoalForm';

const GoalManager = ({ userId }) => {
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    timeframe: '',
    preferredInstruments: [],
    createdAt: new Date(),
    currentAmount: 0
  });
  
  const availableInstruments = [
    'Mutual Funds', 'Stocks', 'Fixed Deposits', 
    'PPF', 'Gold', 'Real Estate', 'Bonds'
  ];

  // Fetch goals from Firestore
  useEffect(() => {
    const fetchGoals = async () => {
      if (!userId) return;
      
      try {
        const goalsRef = collection(db, 'goals');
        const q = query(goalsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const fetchedGoals = [];
        querySnapshot.forEach((doc) => {
          fetchedGoals.push({ id: doc.id, ...doc.data() });
        });
        
        setGoals(fetchedGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };
    
    fetchGoals();
  }, [userId]);

  // Calculate monthly investment needed for a goal
  const calculateMonthlyInvestment = (targetAmount, months, currentAmount = 0) => {
    const monthlyInterest = 0.08 / 12;
    const remaining = targetAmount - currentAmount;
    
    if (months <= 0) return remaining;
    
    const denominator = Math.pow(1 + monthlyInterest, months) - 1;
    const monthlyPayment = denominator > 0 
      ? remaining * monthlyInterest / denominator 
      : remaining / months;
    
    return Math.round(monthlyPayment);
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setNewGoal({
      name: '',
      targetAmount: '',
      timeframe: '',
      preferredInstruments: [],
      createdAt: new Date(),
      currentAmount: 0
    });
    setShowGoalForm(true);
  };

  const handleEditGoal = (goalId) => {
    const goalToEdit = goals.find(goal => goal.id === goalId);
    if (goalToEdit) {
      setEditingGoal(goalId);
      setNewGoal({
        name: goalToEdit.name,
        targetAmount: goalToEdit.targetAmount,
        timeframe: goalToEdit.timeframe,
        preferredInstruments: goalToEdit.preferredInstruments || [],
        currentAmount: goalToEdit.currentAmount || 0,
        createdAt: goalToEdit.createdAt
      });
      setShowGoalForm(true);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!userId || !goalId) return;
    
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleUpdateProgress = async (goalId, newProgress) => {
    if (!userId || !goalId) return;
    
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        currentAmount: newProgress
      });
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, currentAmount: newProgress } : goal
      ));
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const saveGoal = async () => {
    if (!userId) return;
    
    try {
      const goalData = {
        ...newGoal,
        userId,
        targetAmount: parseFloat(newGoal.targetAmount),
        timeframe: parseInt(newGoal.timeframe),
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        createdAt: newGoal.createdAt || new Date(),
        lastUpdated: new Date(),
        monthlyInvestment: calculateMonthlyInvestment(
          parseFloat(newGoal.targetAmount),
          parseInt(newGoal.timeframe) * 12,
          parseFloat(newGoal.currentAmount) || 0
        )
      };
      
      if (editingGoal) {
        // Update existing goal
        const goalRef = doc(db, 'goals', editingGoal);
        await updateDoc(goalRef, goalData);
        
        setGoals(prev => prev.map(goal => 
          goal.id === editingGoal ? { ...goal, ...goalData, id: editingGoal } : goal
        ));
      } else {
        // Create new goal
        const newGoalId = uuidv4();
        const goalRef = doc(db, 'goals', newGoalId);
        await setDoc(goalRef, goalData);
        
        setGoals(prev => [...prev, { id: newGoalId, ...goalData }]);
      }
      
      setShowGoalForm(false);
      setEditingGoal(null);
      setNewGoal({
        name: '',
        targetAmount: '',
        timeframe: '',
        preferredInstruments: [],
        createdAt: new Date(),
        currentAmount: 0
      });
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <GoalList 
        goals={goals}
        onAddClick={handleAddGoal}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onUpdateProgress={handleUpdateProgress}
      />
      
      {showGoalForm && (
        <GoalForm 
          goal={editingGoal ? goals.find(goal => goal.id === editingGoal) : null}
          onSave={saveGoal}
          onCancel={() => setShowGoalForm(false)}
          availableInstruments={availableInstruments}
        />
      )}
    </div>
  );
};

export default GoalManager; 