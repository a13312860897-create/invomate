import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // 检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // 默认使用暗色模式，以提升对比度与专注度
    return 'dark';
  });

  const [autoMode, setAutoMode] = useState(() => {
    const savedAutoMode = localStorage.getItem('autoMode');
    return savedAutoMode ? JSON.parse(savedAutoMode) : false;
  });

  // 监听系统主题变化
  useEffect(() => {
    if (!autoMode) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [autoMode]);

  // 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // 兼容 Tailwind 的 dark 变体：在根元素添加/移除 .dark 类
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 保存自动模式设置
  useEffect(() => {
    localStorage.setItem('autoMode', JSON.stringify(autoMode));
  }, [autoMode]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setAutoMode(false); // 手动切换时关闭自动模式
  };

  const setLightTheme = () => {
    setTheme('light');
    setAutoMode(false);
  };

  const setDarkTheme = () => {
    setTheme('dark');
    setAutoMode(false);
  };

  const setAutoTheme = () => {
    setAutoMode(true);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);
  };

  const value = {
    theme,
    autoMode,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;