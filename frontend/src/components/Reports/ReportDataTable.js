import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';
import { Button } from '../DesignSystem';

// Currency format function
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Date format function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB');
};

// 报表数据表格组件
const ReportDataTable = ({ data, columns, title, onExport, onViewDetail }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // 处理排序
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // 获取排序图标
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? 
      <FiChevronUp className="ml-1" /> : 
      <FiChevronDown className="ml-1" />;
  };
  
  // 应用排序
  const getProcessedData = () => {
    let processedData = [...data];
    
    // 应用排序
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return processedData;
  };
  
  const processedData = getProcessedData();
  
  // 渲染表格单元格
  const renderCell = (item, column) => {
    const value = item[column.key];
    
    switch (column.type) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value);
      case 'status':
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${value === 'paid' ? 'bg-green-100 text-green-800' : ''}
            ${value === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${value === 'overdue' ? 'bg-red-100 text-red-800' : ''}
            ${value === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {value === 'paid' ? 'Paid' : ''}
            {value === 'pending' ? 'Pending' : ''}
            {value === 'overdue' ? 'Overdue' : ''}
            {value === 'draft' ? 'Draft' : ''}
          </span>
        );
      default:
        return value;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex gap-2">
            {onExport && (
              <Button 
                leftIcon={<FiDownload />}
                onClick={onExport}
                variant="outline"
                size="sm"
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.length > 0 ? (
              processedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No Data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ReportDataTable;