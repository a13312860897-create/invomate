import React, { useState } from 'react';
import { FiCalendar, FiFilter, FiDownload } from 'react-icons/fi';
import { Button } from '../DesignSystem';

const ReportFilters = ({ onFilterChange, onExport }) => {
  const [filters, setFilters] = useState({
    dateRange: '6m',
    reportType: 'sales',
    status: 'all'
  });
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <FiCalendar className="mr-2 text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="1m">Last 1 month</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last 1 year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
            >
              <option value="sales">Sales Report</option>
              <option value="tax">Tax Report</option>
              <option value="customer">Customer Report</option>
              <option value="payment">Payment Report</option>
            </select>
          </div>
          
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div>
          <Button 
            leftIcon={<FiDownload />}
            onClick={onExport}
            variant="outline"
          >
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;