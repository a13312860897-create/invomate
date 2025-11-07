// FreshBooks Design System Components
// 基于FreshBooks设计原则的可复用组件库

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiLoader, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

// 按钮组件
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500 shadow-sm hover:shadow-md",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-primary-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <FiLoader className="animate-spin mr-2 h-4 w-4" />}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// 卡片组件
export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

// 状态徽章
export const StatusBadge = ({ status, children }) => {
  const statusConfig = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: null },
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: null },
    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: <FiCheck /> },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: <FiAlertCircle /> },
    cancelled: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: null },
    pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <FiInfo /> },
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {children}
    </span>
  );
};

// 加载状态组件
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizes[size]} ${className}`} />
  );
};

export const LoadingSkeleton = ({ className = '' }) => {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
};

// 空状态组件
export const EmptyState = ({ title, description, action, icon }) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  );
};

// 页面头部组件
export const PageHeader = ({ title, subtitle, actions, breadcrumbs }) => {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index}>
                {index < breadcrumbs.length - 1 ? (
                  <>
                    <a href={crumb.href} className="text-gray-500 hover:text-gray-700">
                      {crumb.label}
                    </a>
                    <span className="text-gray-400 mx-2">/</span>
                  </>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex space-x-3">{actions}</div>}
      </div>
    </div>
  );
};

// 表单组件
export const FormGroup = ({ label, children, error, required = false, className = '' }) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export const Input = ({ error, className = '', ...props }) => {
  return (
    <input
      className={`block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
      {...props}
    />
  );
};

export const Select = ({ children, error, className = '', ...props }) => {
  return (
    <select
      className={`block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

// 数据表格组件
export const DataTable = ({ columns, data, loading = false, emptyState }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                {[...Array(columns.length)].map((_, j) => (
                  <div key={j} className="flex-1">
                    <LoadingSkeleton className="h-4 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardBody>
          {emptyState || (
            <EmptyState
              title={t('common.noDataFound')}
              description={t('common.noItemsToDisplay')}
            />
          )}
        </CardBody>
      </Card>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 模态框组件
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizes[size]} sm:w-full`}>
          {title && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            </div>
          )}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// 导出所有组件
export default {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatusBadge,
  LoadingSpinner,
  LoadingSkeleton,
  EmptyState,
  PageHeader,
  FormGroup,
  Input,
  Select,
  DataTable,
  Modal,
};