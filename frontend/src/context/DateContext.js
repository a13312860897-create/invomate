import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentDisplayMonth } from '../utils/dateUtils';

const DateContext = createContext();

export const useDateContext = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
};

export const DateProvider = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentDisplayMonth());

  // 监听月份变化，可以在这里添加数据刷新逻辑
  useEffect(() => {
    console.log('当前显示月份已更改为:', currentMonth);
  }, [currentMonth]);

  const changeMonth = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const value = {
    currentMonth,
    changeMonth,
    setCurrentMonth
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};