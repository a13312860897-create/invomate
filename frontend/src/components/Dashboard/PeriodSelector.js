import React from 'react';
import { useTranslation } from 'react-i18next';

const PeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const { t } = useTranslation(['dashboard']);

  const periods = [
    { value: 'week', label: t('dashboard:thisWeek') },
    { value: 'month', label: t('dashboard:thisMonth') }
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            selectedPeriod === period.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;