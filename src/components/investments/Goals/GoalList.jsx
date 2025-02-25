import React, { useRef } from 'react';
import GoalCard from './GoalCard';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';

const GoalList = ({ goals, onAddClick, onEditGoal, onDeleteGoal, onUpdateProgress }) => {
  const scrollRef = useRef(null);

  const scrollGoals = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of goal card + margin
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Financial Goals</h3>
        <button
          onClick={onAddClick}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
        >
          <FaPlus />
        </button>
      </div>

      {goals.length > 0 ? (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={() => scrollGoals('left')}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white"
            >
              <FaChevronLeft />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide pb-4 pt-2 -mx-2 px-2"
          >
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => onEditGoal(goal.id)}
                onDelete={() => onDeleteGoal(goal.id)}
                onUpdateProgress={(progress) => onUpdateProgress(goal.id, progress)}
              />
            ))}
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={() => scrollGoals('right')}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white"
            >
              <FaChevronRight />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
          <p className="text-white/60">You haven't set any financial goals yet.</p>
          <p className="text-white/80 mt-2">
            Set goals to track your progress towards big purchases, savings, or investments.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalList; 