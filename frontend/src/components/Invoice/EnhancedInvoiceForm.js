import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCopy, FiSave, FiEye, FiCalendar, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import { FormField, Input, Textarea, Select, useFormValidation, validationRules } from '../Common/FormValidation';
import ErrorBoundary from '../Common/ErrorBoundary';
import LoadingSpinner, { ButtonSpinner } from '../Common/LoadingSpinner';
import InvoiceFormWizard from './InvoiceFormWizard';
import InvoiceTemplateSelector from './InvoiceTemplateSelector';

const EnhancedInvoiceForm = ({ 
  initialData = {}, 
  onSave, 
  onPreview, 
  isEditing = false,
  clients = [],
  onClose 
}) => {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form', 'wizard', 'template'
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  // 获取当前日期和30天后的日期
  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getDueDateAfter30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // 表单初始值
  const initialFormData = {
    invoiceNumber: '',
    issueDate: getCurrentDate(),
    dueDate: getDueDateAfter30Days(),
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
    notes: '',
    currency: 'EUR',
    ...initialData
  };

  // 表单验证规则
  const validationRulesConfig = {
    invoiceNumber: [validationRules.required],
    issueDate: [validationRules.required],
    dueDate: [validationRules.required],
    clientName: [validationRules.required],
    clientEmail: [validationRules.email],
    items: [(items) => {
      if (!items || items.length === 0) {
        return '至少需要添加一个项目';
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description) {
          return `第 ${i + 1} 项的描述不能为空`;
        }
        if (!item.quantity || item.quantity <= 0) {
          return `第 ${i + 1} 项的数量必须大于0`;
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          return `第 ${i + 1} 项的单价不能为负数`;
        }
      }
      return null;
    }]
  };

  const {
    values: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid
  } = useFormValidation(initialFormData, validationRulesConfig);

  // 自动生成发票编号
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}-${timestamp}`;
  };

  // 初始化发票编号
  useEffect(() => {
    if (!formData.invoiceNumber && !isEditing) {
      handleChange('invoiceNumber', generateInvoiceNumber());
    }
  }, []);

  // 客户选择处理
  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      handleChange('clientId', clientId);
      handleChange('clientName', client.name);
      handleChange('clientEmail', client.email);
      handleChange('clientAddress', client.address);
    }
  };

  // 添加项目
  const addItem = () => {
    const newItems = [...formData.items, { 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      taxRate: 20 
    }];
    handleChange('items', newItems);
  };

  // 删除项目
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      handleChange('items', newItems);
    }
  };

  // 更新项目
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    handleChange('items', newItems);
  };

  // 复制项目
  const duplicateItem = (index) => {
    const itemToCopy = { ...formData.items[index] };
    const newItems = [...formData.items];
    newItems.splice(index + 1, 0, itemToCopy);
    handleChange('items', newItems);
  };

  // 计算总金额
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const taxAmount = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * item.taxRate / 100);
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  // 自动计算到期日期
  const handleIssueDateChange = (date) => {
    handleChange('issueDate', date);
    if (!formData.dueDate) {
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 30); // 默认30天付款期
      handleChange('dueDate', dueDate.toISOString().split('T')[0]);
    }
  };

  // 表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      showError('请检查表单中的错误信息');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      success(isEditing ? '发票已成功更新' : '发票已成功创建');
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      showError('保存发票失败，请重试');
      console.error('Save invoice error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 预览处理
  const handlePreview = () => {
    if (!validateAll()) {
      showError('请先完善表单信息再预览');
      return;
    }
    setShowPreview(true);
    if (onPreview) {
      onPreview(formData);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // 视图模式切换
  const renderViewModeSelector = () => (
    <div className="flex items-center space-x-4 mb-6">
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setViewMode('form')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'form' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          标准表单
        </button>
        <button
          type="button"
          onClick={() => setViewMode('wizard')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'wizard' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          分步向导
        </button>
        <button
          type="button"
          onClick={() => setViewMode('template')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'template' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiSettings className="w-4 h-4 mr-1 inline" />
          模板选择
        </button>
      </div>
    </div>
  );

  // 根据视图模式渲染不同的内容
  const renderContent = () => {
    switch (viewMode) {
      case 'wizard':
        return (
           <InvoiceFormWizard
             onSave={handleSave}
             onCancel={onCancel}
             clients={clients}
           />
         );
      
      case 'template':
        return (
          <div className="space-y-6">
            <InvoiceTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
            />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                使用此模板创建发票
              </button>
            </div>
          </div>
        );
      
      default:
        return renderStandardForm();
    }
  };

  // 标准表单渲染
  const renderStandardForm = () => (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        {/* 表单头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? '编辑发票' : '创建新发票'}
            </h2>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiEye className="w-4 h-4 mr-2" />
                预览
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="发票编号"
              required
              error={errors.invoiceNumber}
            >
              <div className="flex">
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  onBlur={() => handleBlur('invoiceNumber')}
                  error={errors.invoiceNumber}
                  placeholder="自动生成或手动输入"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleChange('invoiceNumber', generateInvoiceNumber())}
                  className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  重新生成
                </button>
              </div>
            </FormField>

            <FormField
              label="币种"
              required
            >
              <Select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="EUR">欧元 (EUR)</option>
                <option value="USD">美元 (USD)</option>
                <option value="CNY">人民币 (CNY)</option>
              </Select>
            </FormField>

            <FormField
              label="开票日期"
              required
              error={errors.issueDate}
            >
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleIssueDateChange(e.target.value)}
                onBlur={() => handleBlur('issueDate')}
                error={errors.issueDate}
              />
            </FormField>

            <FormField
              label="到期日期"
              required
              error={errors.dueDate}
              helpText="默认为开票日期后30天"
            >
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                onBlur={() => handleBlur('dueDate')}
                error={errors.dueDate}
              />
            </FormField>
          </div>

          {/* 客户信息 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">客户信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="选择客户"
                helpText="从现有客户中选择或手动填写"
              >
                <Select
                  value={formData.clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                >
                  <option value="">选择客户...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="客户名称"
                required
                error={errors.clientName}
              >
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  onBlur={() => handleBlur('clientName')}
                  error={errors.clientName}
                  placeholder="客户或公司名称"
                />
              </FormField>

              <FormField
                label="客户邮箱"
                error={errors.clientEmail}
              >
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleChange('clientEmail', e.target.value)}
                  onBlur={() => handleBlur('clientEmail')}
                  error={errors.clientEmail}
                  placeholder="client@example.com"
                />
              </FormField>

              <FormField
                label="客户地址"
              >
                <Textarea
                  value={formData.clientAddress}
                  onChange={(e) => handleChange('clientAddress', e.target.value)}
                  placeholder="客户地址"
                  rows={2}
                />
              </FormField>
            </div>
          </div>

          {/* 发票项目 */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">发票项目</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="w-4 h-4 mr-1" />
                添加项目
              </button>
            </div>

            {errors.items && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{errors.items}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        描述 *
                      </label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="项目描述"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数量 *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        单价 *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        税率 (%)
                      </label>
                      <Select
                        value={item.taxRate}
                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                      >
                        <option value={0}>0%</option>
                        <option value={5.5}>5.5%</option>
                        <option value={10}>10%</option>
                        <option value={20}>20%</option>
                      </Select>
                    </div>

                    <div className="md:col-span-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="复制项目"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="删除项目"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm text-gray-600">
                    小计: {(item.quantity * item.unitPrice).toFixed(2)} {formData.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 总计 */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">小计:</span>
                  <span className="text-sm font-medium">{subtotal.toFixed(2)} {formData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">税额:</span>
                  <span className="text-sm font-medium">{taxAmount.toFixed(2)} {formData.currency}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold">总计:</span>
                  <span className="text-lg font-semibold">{total.toFixed(2)} {formData.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 备注和条款 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <FormField
              label="备注"
              helpText="给客户的额外信息"
            >
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="备注信息..."
                rows={4}
              />
            </FormField>


          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 border-t pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <ButtonSpinner />
                  <span className="ml-2">保存中...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5 mr-2" />
                  {isEditing ? '更新发票' : '创建发票'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto">
        {renderViewModeSelector()}
        {renderContent()}
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedInvoiceForm;