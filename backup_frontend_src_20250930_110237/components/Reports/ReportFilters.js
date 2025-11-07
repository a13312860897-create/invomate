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
              <option value="1m">最近1个月</option>
              <option value="3m">最近3个月</option>
              <option value="6m">最近6个月</option>
              <option value="1y">最近1年</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
            >
              <option value="sales">销售报表</option>
              <option value="tax">税务报表</option>
              <option value="customer">客户报表</option>
              <option value="payment">支付报表</option>
            </select>
          </div>
          
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">所有状态</option>
            <option value="paid">已付款</option>
            <option value="pending">待付款</option>
            <option value="overdue">逾期</option>
          </select>
        </div>
        
        <div>
          <Button 
            leftIcon={<FiDownload />}
            onClick={onExport}
            variant="outline"
          >
            导出报表
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;