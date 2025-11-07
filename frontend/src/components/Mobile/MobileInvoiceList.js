import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiMoreVertical,
  FiEye,
  FiSend,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiChevronDown,
  FiCalendar,
  FiUser
} from 'react-icons/fi';
import MobileLayout from './MobileLayout';
import { useToast } from '../Common/Toast';
import LoadingSpinner from '../Common/LoadingSpinner';
import { SwipeableItem, LongPressMenu, PullToRefresh } from './TouchGestures';

const MobileInvoiceList = ({ onNavigate }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [pullToRefresh, setPullToRefresh] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const { success, error: showErrorToast } = useToast();
  const listRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // 加载发票数据
  const loadInvoices = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockInvoices = [
        {
          id: 'INV-2024-001',
          clientName: 'ABC公司',
          amount: 5680.00,
          status: 'paid',
          dueDate: '2024-01-15',
          createdAt: '2024-01-01',
          description: '网站开发服务'
        },
        {
          id: 'INV-2024-002',
          clientName: 'XYZ企业',
          amount: 3200.00,
          status: 'pending',
          dueDate: '2024-01-20',
          createdAt: '2024-01-05',
          description: '品牌设计服务'
        },
        {
          id: 'INV-2024-003',
          clientName: '123有限公司',
          amount: 8900.00,
          status: 'overdue',
          dueDate: '2024-01-10',
          createdAt: '2023-12-28',
          description: '系统集成项目'
        },
        {
          id: 'INV-2024-004',
          clientName: '456科技',
          amount: 2150.00,
          status: 'draft',
          dueDate: '2024-01-25',
          createdAt: '2024-01-08',
          description: '移动应用开发'
        },
        {
          id: 'INV-2024-005',
          clientName: '789集团',
          amount: 12500.00,
          status: 'sent',
          dueDate: '2024-01-30',
          createdAt: '2024-01-10',
          description: '企业咨询服务'
        }
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      showErrorToast('加载发票列表失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullToRefresh(false);
      setPullDistance(0);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 下拉刷新处理
  const handleTouchStart = (e) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current && listRef.current && listRef.current.scrollTop === 0) {
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;
      
      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
        if (distance > 60) {
          setPullToRefresh(true);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullToRefresh) {
      loadInvoices(true);
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
    currentY.current = 0;
  };

  // 筛选发票
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 获取状态颜色和文本
  const getStatusInfo = (status) => {
    const statusMap = {
      paid: { color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-800 dark:border-green-600', text: '已支付' },
      pending: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-800 dark:border-yellow-600', text: '待支付' },
      overdue: { color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-800 dark:border-red-600', text: '已逾期' },
      draft: { color: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-blue-200 dark:bg-blue-900 dark:border-blue-600', text: '草稿' },
      sent: { color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-200 dark:bg-blue-800 dark:border-blue-600', text: '已发送' }
    };
    return statusMap[status] || statusMap.draft;
  };

  // 格式化金额
  const formatCurrency = (amount) => {
    // 处理无效值，确保显示0而不是NaN
    const validAmount = (amount === undefined || amount === null || isNaN(amount)) ? 0 : amount;
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(validAmount);
  };

  // 处理发票操作
  const handleInvoiceAction = async (action, invoiceId) => {
    try {
      switch (action) {
        case 'view':
          onNavigate('invoice-detail', `/invoices/${invoiceId}`);
          break;
        case 'edit':
          onNavigate('edit-invoice', `/invoices/${invoiceId}/edit`);
          break;
        case 'send':
          success('发票已成功发送');
          break;
        case 'download':
          success('发票下载已开始');
          break;
        case 'delete':
          if (window.confirm('确定要删除这张发票吗？')) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            success('发票已删除');
          }
          break;
        case 'mark-paid':
          setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
          ));
          success('发票已标记为已支付');
          break;
      }
    } catch (error) {
      showErrorToast('操作失败，请重试');
    }
    setActionMenuId(null);
  };

  // 批量操作
  const handleBatchAction = async (action) => {
    try {
      switch (action) {
        case 'mark-paid':
          setInvoices(prev => prev.map(inv => 
            selectedInvoices.includes(inv.id) ? { ...inv, status: 'paid' } : inv
          ));
          success(`已将 ${selectedInvoices.length} 张发票标记为已支付`);
          break;
        case 'send':
          success(`已发送 ${selectedInvoices.length} 张发票`);
          break;
        case 'download':
          success(`已开始下载 ${selectedInvoices.length} 张发票`);
          break;
        case 'delete':
          if (window.confirm(`确定要删除选中的 ${selectedInvoices.length} 张发票吗？`)) {
            setInvoices(prev => prev.filter(inv => !selectedInvoices.includes(inv.id)));
            success(`已删除 ${selectedInvoices.length} 张发票`);
          }
          break;
      }
      setSelectedInvoices([]);
      setShowBatchActions(false);
    } catch (error) {
      showErrorToast('批量操作失败，请重试');
    }
  };

  // 发票项组件
  const InvoiceItem = ({ invoice }) => {
    const statusInfo = getStatusInfo(invoice.status);
    const isSelected = selectedInvoices.includes(invoice.id);
    
    // 滑动操作配置
    const leftActions = [
      {
        icon: FiCheck,
        label: '标记已付',
        color: 'bg-green-500',
        onClick: () => handleInvoiceAction('mark-paid', invoice.id)
      }
    ];

    const rightActions = [
      {
        icon: FiSend,
        label: '发送',
        color: 'bg-blue-500',
        onClick: () => handleInvoiceAction('send', invoice.id)
      },
      {
        icon: FiTrash2,
        label: '删除',
        color: 'bg-red-500',
        onClick: () => handleInvoiceAction('delete', invoice.id)
      }
    ];

    // 长按菜单配置
    const longPressMenuItems = [
      {
        icon: FiEye,
        label: '查看详情',
        onClick: () => handleInvoiceAction('view', invoice.id)
      },
      {
        icon: FiEdit,
        label: '编辑发票',
        onClick: () => handleInvoiceAction('edit', invoice.id)
      },
      {
        icon: FiSend,
        label: '发送发票',
        onClick: () => handleInvoiceAction('send', invoice.id)
      },
      {
        icon: FiDownload,
        label: '下载PDF',
        onClick: () => handleInvoiceAction('download', invoice.id)
      },
      {
        icon: FiCheck,
        label: '标记已支付',
        onClick: () => handleInvoiceAction('mark-paid', invoice.id)
      },
      {
        icon: FiTrash2,
        label: '删除发票',
        onClick: () => handleInvoiceAction('delete', invoice.id)
      }
    ];
    
    return (
      <SwipeableItem
        leftActions={leftActions}
        rightActions={rightActions}
        className="mb-3"
      >
        <LongPressMenu menuItems={longPressMenuItems}>
          <div className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 ${
            isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 发票头部信息 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {showBatchActions && (
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                          } else {
                            setSelectedInvoices(prev => [...prev, invoice.id]);
                          }
                        }}
                        className={`mr-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <FiCheck className="w-3 h-3" />}
                      </button>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{invoice.id}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FiUser className="w-3 h-3 mr-1" />
                        {invoice.clientName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                </div>

                {/* 发票描述 */}
                <p className="text-sm text-gray-600 mb-3">{invoice.description}</p>

                {/* 发票底部信息 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    <span>到期: {invoice.dueDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleInvoiceAction('view', invoice.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleInvoiceAction('send', invoice.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleInvoiceAction('download', invoice.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActionMenuId(actionMenuId === invoice.id ? null : invoice.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FiMoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 操作菜单 */}
                {actionMenuId === invoice.id && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg border">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleInvoiceAction('edit', invoice.id)}
                        className="flex items-center justify-center p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                      >
                        <FiEdit className="w-4 h-4 mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleInvoiceAction('mark-paid', invoice.id)}
                        className="flex items-center justify-center p-2 text-sm text-gray-600 hover:text-green-600 hover:bg-white rounded transition-colors"
                      >
                        <FiCheck className="w-4 h-4 mr-1" />
                        标记已付
                      </button>
                      <button
                        onClick={() => handleInvoiceAction('delete', invoice.id)}
                        className="flex items-center justify-center p-2 text-sm text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" />
                        删除
                      </button>
                      <button
                        onClick={() => setActionMenuId(null)}
                        className="flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-colors"
                      >
                        <FiX className="w-4 h-4 mr-1" />
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </LongPressMenu>
      </SwipeableItem>
    );
  };

  if (loading) {
    return (
      <MobileLayout currentPage="invoices" onNavigate={onNavigate}>
        <LoadingSpinner fullScreen text="正在加载发票列表..." />
      </MobileLayout>
    );
  }

  const headerActions = [
    {
      icon: FiRefreshCw,
      label: '刷新',
      onClick: () => loadInvoices(true),
      primary: false
    },
    {
      icon: showBatchActions ? FiX : FiMoreVertical,
      label: showBatchActions ? '取消' : '批量操作',
      onClick: () => {
        setShowBatchActions(!showBatchActions);
        setSelectedInvoices([]);
      },
      primary: false
    }
  ];

  return (
    <MobileLayout 
      currentPage="invoices" 
      onNavigate={onNavigate}
      title="发票管理"
      actions={headerActions}
    >
      <div className="space-y-4">
        {/* 下拉刷新指示器 */}
        {pullDistance > 0 && (
          <div 
            className="flex items-center justify-center py-2 transition-all duration-200"
            style={{ transform: `translateY(${Math.min(pullDistance - 60, 20)}px)` }}
          >
            <FiRefreshCw className={`w-5 h-5 text-blue-600 mr-2 ${pullToRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm text-blue-600">
              {pullToRefresh ? '释放刷新' : '下拉刷新'}
            </span>
          </div>
        )}

        {/* 搜索栏 */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索发票编号、客户或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 筛选器 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FiFilter className="w-4 h-4 mr-2" />
            筛选
            <FiChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {selectedStatus !== 'all' && (
            <button
              onClick={() => setSelectedStatus('all')}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm"
            >
              {getStatusInfo(selectedStatus).text}
              <FiX className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>

        {/* 筛选选项 */}
        {showFilters && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">按状态筛选</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'draft', label: '草稿' },
                { key: 'sent', label: '已发送' },
                { key: 'pending', label: '待支付' },
                { key: 'paid', label: '已支付' },
                { key: 'overdue', label: '已逾期' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setSelectedStatus(status.key)}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    selectedStatus === status.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 批量操作栏 */}
        {showBatchActions && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-blue-700">
                已选择 {selectedInvoices.length} 张发票
              </span>
              <button
                onClick={() => {
                  if (selectedInvoices.length === filteredInvoices.length) {
                    setSelectedInvoices([]);
                  } else {
                    setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedInvoices.length === filteredInvoices.length ? '取消全选' : '全选'}
              </button>
            </div>
            
            {selectedInvoices.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchAction('mark-paid')}
                  className="flex items-center justify-center p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheck className="w-4 h-4 mr-1" />
                  标记已付
                </button>
                <button
                  onClick={() => handleBatchAction('send')}
                  className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSend className="w-4 h-4 mr-1" />
                  批量发送
                </button>
                <button
                  onClick={() => handleBatchAction('download')}
                  className="flex items-center justify-center p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FiDownload className="w-4 h-4 mr-1" />
                  批量下载
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="flex items-center justify-center p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4 mr-1" />
                  批量删除
                </button>
              </div>
            )}
          </div>
        )}

        {/* 发票列表 */}
        <PullToRefresh
           onRefresh={handleRefresh}
           isRefreshing={isRefreshing}
           className="flex-1"
         >
          <div 
            ref={listRef}
            className="space-y-3"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {refreshing && (
              <div className="flex items-center justify-center py-4">
                <FiRefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-blue-600">正在刷新...</span>
              </div>
            )}
            
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || selectedStatus !== 'all' ? '没有找到匹配的发票' : '暂无发票'}
                </p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <InvoiceItem key={invoice.id} invoice={invoice} />
              ))
            )}
          </div>
        </PullToRefresh>
      </div>
    </MobileLayout>
  );
};

export default MobileInvoiceList;