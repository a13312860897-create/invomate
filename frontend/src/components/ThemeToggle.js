import React from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle = ({ showLabels = true, size = 'default' }) => {
  const { theme, autoMode, setLightTheme, setDarkTheme, setAutoTheme } = useTheme();
  const { t } = useTranslation(['settings', 'common']);

  const themes = [
    {
      key: 'light',
      label: t('settings:lightMode'),
      icon: FiSun,
      action: setLightTheme,
      active: theme === 'light' && !autoMode
    },
    {
      key: 'dark',
      label: t('settings:darkMode'),
      icon: FiMoon,
      action: setDarkTheme,
      active: theme === 'dark' && !autoMode
    },
    {
      key: 'auto',
      label: t('settings:autoMode'),
      icon: FiMonitor,
      action: setAutoTheme,
      active: autoMode
    }
  ];

  const buttonSizeClasses = {
    small: 'p-2 text-sm',
    default: 'p-3',
    large: 'p-4 text-lg'
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div className="theme-toggle">
      {showLabels && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('settings:appearance')}
        </label>
      )}
      
      <div className="flex space-x-2">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          return (
            <button
              key={themeOption.key}
              onClick={themeOption.action}
              className={`
                ${buttonSizeClasses[size]}
                flex items-center justify-center
                rounded-lg border-2 transition-all duration-200
                theme-transition
                ${
                  themeOption.active
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600'
                }
                ${
                  showLabels ? 'flex-col space-y-1 min-w-[80px]' : 'aspect-square'
                }
              `}
              title={themeOption.label}
            >
              <Icon className={iconSizeClasses[size]} />
              {showLabels && (
                <span className="text-xs font-medium">
                  {themeOption.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {autoMode && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t('settings:autoModeDescription')}
        </p>
      )}
    </div>
  );
};

export default ThemeToggle;