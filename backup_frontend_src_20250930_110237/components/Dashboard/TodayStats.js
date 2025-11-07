import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiTrendingUp, FiDollarSign, FiClock, FiAlertCircle } from 'react-icons/fi';

const TodayStats = () => {
  const { api } = useAuth();
  const { t } = useTranslation(['dashboard', 'common']);
  const [todayData, setTodayData] = useState({
    todayInvoices: 0,
    todayInvoicesAmount: 0,
    todayPayments: 0,
    todayPaymentsAmount: 0,
    todayDue: 0,
    todayDueAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const response = await api.get('/dashboard/today-stats');
      setTodayData(response.data);
    } catch (error) {
      console.error('Error fetching today stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, title, count, amount, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-lg font-semibold text-gray-700">{formatCurrency(amount)}</p>
          </div>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {t('dashboard:todayOverview')}
        </h3>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={FiTrendingUp}
            title={t('dashboard:todayInvoices')}
            count={todayData.todayInvoices}
            amount={todayData.todayInvoicesAmount}
            color="border-blue-500"
            bgColor="bg-blue-50"
          />
          
          <StatCard
            icon={FiDollarSign}
            title={t('dashboard:todayPayments')}
            count={todayData.todayPayments}
            amount={todayData.todayPaymentsAmount}
            color="border-green-500"
            bgColor="bg-green-50"
          />
          
          <StatCard
            icon={todayData.todayDue > 0 ? FiAlertCircle : FiClock}
            title={t('dashboard:todayDue')}
            count={todayData.todayDue}
            amount={todayData.todayDueAmount}
            color={todayData.todayDue > 0 ? "border-red-500" : "border-yellow-500"}
            bgColor={todayData.todayDue > 0 ? "bg-red-50" : "bg-yellow-50"}
          />
        </div>
        
        {todayData.todayDue > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">
                {t('dashboard:todayDueAlert', { count: todayData.todayDue })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayStats;