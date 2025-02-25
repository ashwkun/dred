import React from 'react';
import { FaChartPie, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const CategoryBudgetAnalysis = ({ insights, monthlyBudget, isExpanded, toggleSection }) => {
  // Calculate category budgets (assumes roughly proportional to historical spending)
  const topCategories = insights?.categoryInsights?.topCategories || [];
  const totalCategorySpend = topCategories.reduce((sum, cat) => sum + cat.amount, 0);
  
  // Add budget allocation and percentage to each category
  const categoriesWithBudget = topCategories.map(category => {
    const proportion = totalCategorySpend > 0 ? category.amount / totalCategorySpend : 0;
    const budgetAllocation = monthlyBudget * proportion;
    const percentOfBudget = budgetAllocation > 0 ? (category.amount / budgetAllocation) * 100 : 0;
    const status = percentOfBudget >= 100 ? 'exceeded' : percentOfBudget >= 80 ? 'warning' : 'good';
    
    return {
      ...category,
      budgetAllocation,
      percentOfBudget,
      status
    };
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center gap-2">
          <FaChartPie className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Category Budget Analysis</h3>
        </div>
        <button className="text-white/60">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <p className="text-white/60 text-sm mb-4">
            See how your spending compares to estimated category budgets based on your overall monthly budget.
          </p>
          
          <div className="space-y-4">
            {categoriesWithBudget.map((category, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: category.status === 'good' ? '#4ade80' : 
                                         category.status === 'warning' ? '#facc15' : '#f87171' 
                      }}
                    ></div>
                    <span className="text-white font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">₹{Math.round(category.amount).toLocaleString()}</div>
                    <div className="text-white/60 text-xs">
                      of ₹{Math.round(category.budgetAllocation).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      category.status === 'good' ? 'bg-green-400' : 
                      category.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(category.percentOfBudget, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-1 text-xs text-white/60">
                  <span>
                    {category.status === 'exceeded' ? 
                      `${Math.round(category.percentOfBudget - 100)}% over budget` : 
                      `${Math.round(category.percentOfBudget)}% of budget`}
                  </span>
                  <span>
                    {Math.round((category.amount / totalCategorySpend) * 100)}% of spending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBudgetAnalysis; 