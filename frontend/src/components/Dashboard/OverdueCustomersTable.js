import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMail, FiUser, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { Card, CardBody, Button } from '../DesignSystem';

const OverdueCustomersTable = ({ data, onSendReminder }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // {t('dashboard:formatCurrency')}
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  // {t('dashboard:formatDaysOverdue')}
  const formatDaysOverdue = (days) => {
    if (days < 30) return `${days}${t('common:days')}`;
    if (days < 90) return `${Math.floor(days / 30)}${t('common:months')}${days % 30}${t('common:days')}`;
    return `${Math.floor(days / 30)}${t('common:months')}`;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(data.map(customer => customer.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const handleBulkSendReminder = () => {
    if (selectedCustomers.length === 0) return;
    onSendReminder(selectedCustomers);
    setSelectedCustomers([]);
  };

  // {t('dashboard:getOverdueColor')}
  const getOverdueColor = (days) => {
    if (days < 30) return 'text-yellow-600';
    if (days < 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="mb-8">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{t('dashboard:topOverdueCustomers')}</h2>
          {selectedCustomers.length > 0 && (
            <Button
              onClick={handleBulkSendReminder}
              leftIcon={<FiMail />}
              size="sm"
            >
              {t('dashboard:bulkReminder')} ({selectedCustomers.length})
            </Button>
          )}
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={selectedCustomers.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:overdueAmount')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:daysOverdue')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:invoiceCount')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common:actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.overdueAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getOverdueColor(customer.daysOverdue)}`}>
                        {formatDaysOverdue(customer.daysOverdue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.invoiceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        onClick={() => onSendReminder([customer.id])}
                        variant="outline"
                        size="sm"
                        leftIcon={<FiMail />}
                      >
                        {t('dashboard:sendReminder')}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('dashboard:noOverdueCustomers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

export default OverdueCustomersTable;