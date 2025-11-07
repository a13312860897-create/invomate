import React, { useState } from 'react';
import { 
  FiPlus, 
  FiCopy, 
  FiDownload, 
  FiMail, 
  FiEye, 
  FiEdit3, 
  FiTrash2, 
  FiCheck, 
  FiClock,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../Common/LoadingSpinner';

const InvoiceQuickActions = ({ 
  selectedInvoices = [], 
  onCreateNew,
  onDuplicate,
  onDownload,
  onSendEmail,
  onMarkPaid,
  onDelete,
  onBulkAction,
  totalInvoices = 0,
  filters = {},
  onFilterChange
}) => {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasSelection = selectedInvoices.length > 0;
  const isMultipleSelection = selectedInvoices.length > 1;

  // 批量操作处理
  const handleBulkAction = async (action) => {
    if (!hasSelection) {
      showError('请先选择要操作的发票');
      return;
    }

    setIsLoading(true);
    try {
      await onBulkAction(action, selectedInvoices);
      
      switch (action) {
        case 'markPaid':
          success(`已将 ${selectedInvoices.length} 张发票标记为已支付`);
          break;
        case 'download':
          success(`正在下载 ${selectedInvoices.length} 张发票`);
          break;
        case 'sendEmail':
          success(`已发送 ${selectedInvoices.length} 张发票`);
          break;
        case 'delete':
          success(`已删除 ${selectedInvoices.length} 张发票`);
          break;
        default:
          success('批量操作完成');
      }
    } catch (error) {
      showError('批量操作失败，请重试');
      console.error('Bulk action error:', error);
    } finally {
      setIsLoading(false);
      setShowBulkActions(false);
    }
  };

  // 单个发票操作
  const handleSingleAction = async (action, invoiceId) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'duplicate':
          await onDuplicate(invoiceId);
          success('发票已复制');
          break;
        case 'download':
          await onDownload(invoiceId);
          success('发票下载已开始');
          break;
        case 'sendEmail':
          await onSendEmail(invoiceId);
          success('发票已发送');
          break;
        case 'markPaid':
          await onMarkPaid(invoiceId);
          success('发票已标记为已支付');
          break;
        case 'delete':
          await onDelete(invoiceId);
          success('发票已删除');
          break;
      }
    } catch (error) {
      showError(`操作失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 快速创建模板
  const quickCreateTemplates = [
    { id: 'standard', name: '标准发票', icon: FiFileText, description: '常规商业发票' },
    { id: 'service', name: '服务发票', icon: FiClock, description: '服务类发票' },
    { id: 'product', name: '产品发票', icon: FiDollarSign, description: '产品销售发票' },
    { id: 'recurring', name: '定期发票', icon: FiCopy, description: '定期重复发票' }
  ];

  // 过滤器选项
  const filterOptions = [
    { key: 'status', label: '状态', options: [
      { value: 'all', label: '全部' },
      { value: 'draft', label: '草稿' },
      { value: 'sent', label: '已发送' },
      { value: 'paid', label: '已支付' },
      { value: 'overdue', label: '逾期' }
    ]},
    { key: 'dateRange', label: '日期范围', options: [
      { value: 'all', label: '全部' },
      { value: 'today', label: '今天' },
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' },
      { value: 'quarter', label: '本季度' },
      { value: 'year', label: '本年' }
    ]},
    { key: 'amount', label: '金额范围', options: [
      { value: 'all', label: '全部' },
      { value: 'small', label: '< €1,000' },
      { value: 'medium', label: '€1,000 - €10,000' },
      { value: 'large', label: '> €10,000' }
    ]}
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：主要操作 */}
        <div className="flex items-center space-x-4">
          {/* 创建新发票 */}
          <div className="relative group">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              创建发票
            </button>
            
            {/* 快速创建下拉菜单 */}
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  快速创建
                </div>
                {quickCreateTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onCreateNew(template.id)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <template.icon className="w-4 h-4 mr-3 text-gray-400" />
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索发票..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
          </div>

          {/* 过滤器 */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                showFilters ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
              }`}
            >
              <FiFilter className="w-4 h-4 mr-2" />
              过滤器
            </button>

            {showFilters && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="p-4 space-y-4">
                  {filterOptions.map((filter) => (
                    <div key={filter.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {filter.label}
                      </label>
                      <select
                        value={filters[filter.key] || 'all'}
                        onChange={(e) => onFilterChange({ [filter.key]: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <button
                      onClick={() => {
                        onFilterChange({});
                        setShowFilters(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      重置
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      应用
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：选择信息和批量操作 */}
        <div className="flex items-center space-x-4">
          {/* 选择信息 */}
          {hasSelection && (
            <div className="text-sm text-gray-600">
              已选择 {selectedInvoices.length} 张发票
            </div>
          )}

          {/* 批量操作 */}
          {hasSelection && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                批量操作
                <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleBulkAction('markPaid')}
                      disabled={isLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4 mr-3" />
                      标记为已支付
                    </button>
                    <button
                      onClick={() => handleBulkAction('download')}
                      disabled={isLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiDownload className="w-4 h-4 mr-3" />
                      批量下载
                    </button>
                    <button
                      onClick={() => handleBulkAction('sendEmail')}
                      disabled={isLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FiMail className="w-4 h-4 mr-3" />
                      批量发送
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      disabled={isLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <FiTrash2 className="w-4 h-4 mr-3" />
                      批量删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 统计信息 */}
          <div className="text-sm text-gray-500">
            共 {totalInvoices} 张发票
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <LoadingSpinner size="small" text="处理中..." />
        </div>
      )}
    </div>
  );
};

export default InvoiceQuickActions;