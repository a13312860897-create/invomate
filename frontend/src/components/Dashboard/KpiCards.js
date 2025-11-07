import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiTrendingUp, FiClock, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { Card, CardBody } from '../DesignSystem';

const KpiCards = ({ data }) => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  
  // Format currency based on current language
  const formatCurrency = (amount, currency = 'EUR') => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const currencyCode = i18n.language === 'fr' ? 'EUR' : (currency || 'EUR');
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  // Format number based on current language
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };

  const kpiData = [
    {
      title: t('dashboard:totalReceivables'),
      value: formatCurrency(data.totalReceivables || 0),
      icon: FiDollarSign,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      trend: data.totalReceivablesTrend,
      trendLabel: t('dashboard:comparedToLastMonth')
    },
    {
      title: t('dashboard:overdueAmount'),
      value: formatCurrency(data.overdue || 0),
      icon: FiCalendar,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      trend: data.overdueTrend,
      trendLabel: t('dashboard:comparedToLastMonth')
    },
    {
      title: t('dashboard:payments30Days'),
      value: formatCurrency(data.payments30d || 0),
      icon: FiDollarSign,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      trend: data.payments30dTrend,
      trendLabel: t('dashboard:comparedToLastMonth')
    },
    {
      title: t('dashboard:averageDaysToPayment'),
      value: `${formatNumber(data.avgDays || 0)}${t('common:days')}`,
      icon: FiClock,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      trend: data.avgDaysTrend,
      trendLabel: t('dashboard:comparedToLastMonth'),
      inverseTrend: true // {t('dashboard:lowerValueIsBetter')}
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPositive = kpi.trend > 0;
        const showPositive = kpi.inverseTrend ? !isPositive : isPositive;
        
        return (
          <Card key={index} hover>
            <CardBody className="flex items-center">
              <div className={`p-3 rounded-full ${kpi.bgColor} ${kpi.textColor}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-sm font-medium text-gray-500">{kpi.title}</h2>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.trend !== undefined && (
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${showPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {showPositive ? '↑' : '↓'} {Math.abs(kpi.trend)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{kpi.trendLabel}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default KpiCards;