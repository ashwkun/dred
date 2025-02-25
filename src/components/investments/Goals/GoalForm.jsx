import React, { useState } from 'react';

const GoalForm = ({ goal, onSave, onCancel, availableInstruments }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount || '',
    timeframe: goal?.timeframe || '',
    preferredInstruments: goal?.preferredInstruments || [],
    currentAmount: goal?.currentAmount || 0
  });

  const calculateMonthlyInvestment = (targetAmount, months, currentAmount = 0) => {
    const monthlyInterest = 0.08 / 12;
    const remaining = targetAmount - currentAmount;
    
    const denominator = Math.pow(1 + monthlyInterest, months) - 1;
    const monthlyPayment = remaining * monthlyInterest / denominator;
    
    return Math.round(monthlyPayment);
  };

  const toggleInstrument = (instrument) => {
    setFormData(prev => {
      const instruments = [...prev.preferredInstruments];
      
      if (instruments.includes(instrument)) {
        return {
          ...prev,
          preferredInstruments: instruments.filter(item => item !== instrument)
        };
      } else {
        return {
          ...prev,
          preferredInstruments: [...instruments, instrument]
        };
      }
    });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/20 mt-4">
      <h4 className="text-white font-medium mb-4">
        {goal ? 'Edit Goal' : 'Create New Goal'}
      </h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-1">Goal Name</label>
          <input 
            type="text"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            placeholder="e.g., New Car, Retirement, Vacation"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-1">Target Amount (₹)</label>
            <input 
              type="number"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              placeholder="e.g., 500000"
              value={formData.targetAmount}
              onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-white/70 text-sm mb-1">Current Amount (₹)</label>
            <input 
              type="number"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              placeholder="e.g., 50000"
              value={formData.currentAmount}
              onChange={(e) => setFormData({...formData, currentAmount: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-white/70 text-sm mb-1">Timeframe (Years)</label>
          <input 
            type="number"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            placeholder="e.g., 5"
            value={formData.timeframe}
            onChange={(e) => setFormData({...formData, timeframe: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-white/70 text-sm mb-1">Preferred Investment Instruments</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableInstruments.map((instrument) => (
              <button
                key={instrument}
                type="button"
                className={`text-sm px-3 py-1 rounded-full ${
                  formData.preferredInstruments.includes(instrument)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                onClick={() => toggleInstrument(instrument)}
              >
                {instrument}
              </button>
            ))}
          </div>
        </div>
        
        {formData.targetAmount && formData.timeframe && (
          <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30">
            <h5 className="text-white text-sm font-medium mb-1">Recommended Monthly Investment</h5>
            <p className="text-white text-xl font-bold">
              ₹{calculateMonthlyInvestment(
                parseFloat(formData.targetAmount),
                parseInt(formData.timeframe) * 12,
                parseFloat(formData.currentAmount) || 0
              ).toLocaleString()}
            </p>
            <p className="text-white/60 text-xs mt-1">
              Based on an estimated 8% annual return
            </p>
          </div>
        )}
        
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.targetAmount || !formData.timeframe}
          >
            {goal ? 'Update Goal' : 'Save Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalForm; 