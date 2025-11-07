import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DateUtils, DateConfig } from '../../utils/dateUtils';

const MonthSelector = ({ currentMonth, onMonthChange, className = '' }) => {
  const handlePreviousMonth = () => {
    const prevMonth = DateUtils.getPreviousMonth(currentMonth);
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = DateUtils.getNextMonth(currentMonth);
    onMonthChange(nextMonth);
  };

  const handleCurrentMonth = () => {
    const now = DateUtils.getCurrentMonth(true);
    onMonthChange(now);
  };

  const isCurrentMonth = DateUtils.isCurrentMonth(currentMonth);
  const displayText = DateUtils.formatMonthDisplay(currentMonth);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handlePreviousMonth}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        title="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg min-w-[120px] justify-center">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900">{displayText}</span>
        {isCurrentMonth && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Current
          </span>
        )}
      </div>
      
      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        title="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      {!isCurrentMonth && (
        <button
          onClick={handleCurrentMonth}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Back to Current Month"
        >
          Current Month
        </button>
      )}
    </div>
  );
};

export default MonthSelector;