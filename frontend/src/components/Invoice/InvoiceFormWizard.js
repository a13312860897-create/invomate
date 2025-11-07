import React, { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiUser, FiFileText, FiDollarSign, FiEye } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import { FormField, Input, Textarea, Select, useFormValidation, validationRules } from '../Common/FormValidation';
import LoadingSpinner from '../Common/LoadingSpinner';

const InvoiceFormWizard = ({ onSave, onCancel, clients = [] }) => {
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, name: '基本信息', icon: FiFileText, description: '发票编号和日期' },
    { id: 2, name: '客户信息', icon: FiUser, description: '选择或添加客户' },
    { id: 3, name: '项目详情', icon: FiDollarSign, description: '添加发票项目' },
    { id: 4, name: '预览确认', icon: FiEye, description: '检查并提交' }
  ];

  // 获取当前日期和30天后的日期
  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getDueDateAfter30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // 表单数据
  const [formData, setFormData] = useState({
    // 步骤1: 基本信息
    invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    issueDate: getCurrentDate(),
    dueDate: getDueDateAfter30Days(),
    currency: 'EUR',
    
    // 步骤2: 客户信息
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    
    // 步骤3: 项目信息
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
    notes: '',
    
    // 其他
    status: 'draft'
  });

  // 各步骤的验证规则
  const getValidationRules = (step) => {
    switch (step) {
      case 1:
        return {
          invoiceNumber: [validationRules.required],
          issueDate: [validationRules.required],
          dueDate: [validationRules.required]
        };
      case 2:
        return {
          clientName: [validationRules.required],
          clientEmail: [validationRules.email]
        };
      case 3:
        return {
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
              if (item.unitPrice < 0) {
                return `第 ${i + 1} 项的单价不能为负数`;
              }
            }
            return null;
          }]
        };
      default:
        return {};
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll
  } = useFormValidation(formData, getValidationRules(currentStep));

  // 更新表单数据
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    handleChange(field, value);
  };

  // 客户选择处理
  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        clientPhone: client.phone || ''
      }));
    }
  };

  // 自动计算到期日期
  const handleIssueDateChange = (date) => {
    updateFormData('issueDate', date);
    if (!formData.dueDate) {
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 30);
      updateFormData('dueDate', dueDate.toISOString().split('T')[0]);
    }
  };

  // 项目操作
  const addItem = () => {
    const newItems = [...formData.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 20 }];
    updateFormData('items', newItems);
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      updateFormData('items', newItems);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateFormData('items', newItems);
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

  // 步骤验证
  const validateCurrentStep = () => {
    return validateAll();
  };

  // 下一步
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      showError('请完善当前步骤的信息');
    }
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateAll()) {
      showError('请检查表单中的错误信息');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      success('发票已成功创建');
    } catch (error) {
      showError('创建发票失败，请重试');
      console.error('Create invoice error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              <div className="flex items-center">
                <div className={`
                  relative flex h-8 w-8 items-center justify-center rounded-full
                  ${currentStep > step.id 
                    ? 'bg-green-600 text-white' 
                    : currentStep === step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }
                `}>
                  {currentStep > step.id ? (
                    <FiCheck className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="ml-4 min-w-0">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="发票编号"
                required
                error={errors.invoiceNumber}
              >
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => updateFormData('invoiceNumber', e.target.value)}
                  onBlur={() => handleBlur('invoiceNumber')}
                  error={errors.invoiceNumber}
                  placeholder="自动生成"
                />
              </FormField>

              <FormField
                label="币种"
                required
              >
                <Select
                  value={formData.currency}
                  onChange={(e) => updateFormData('currency', e.target.value)}
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
                  onChange={(e) => updateFormData('dueDate', e.target.value)}
                  onBlur={() => handleBlur('dueDate')}
                  error={errors.dueDate}
                />
              </FormField>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">客户信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="选择现有客户"
                helpText="从客户列表中选择"
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

              <div></div>

              <FormField
                label="客户名称"
                required
                error={errors.clientName}
              >
                <Input
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
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
                  onChange={(e) => updateFormData('clientEmail', e.target.value)}
                  onBlur={() => handleBlur('clientEmail')}
                  error={errors.clientEmail}
                  placeholder="client@example.com"
                />
              </FormField>

              <FormField
                label="联系电话"
              >
                <Input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData('clientPhone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </FormField>

              <FormField
                label="客户地址"
              >
                <Textarea
                  value={formData.clientAddress}
                  onChange={(e) => updateFormData('clientAddress', e.target.value)}
                  placeholder="客户地址"
                  rows={3}
                />
              </FormField>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">项目详情</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                添加项目
              </button>
            </div>

            {errors.items && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm text-red-700">{errors.items}</span>
              </div>
            )}

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        项目描述 *
                      </label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="描述项目或服务"
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

                    <div className="md:col-span-1 flex items-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="删除项目"
                        >
                          ×
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="备注"
                helpText="给客户的额外信息"
              >
                <Textarea
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="备注信息..."
                  rows={3}
                />
              </FormField>


            </div>
          </div>
        );

      case 4:
        const { subtotal, taxAmount, total } = calculateTotals();
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">预览确认</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">发票信息</h4>
                  <p className="text-sm text-gray-600">编号: {formData.invoiceNumber}</p>
                  <p className="text-sm text-gray-600">开票日期: {formData.issueDate}</p>
                  <p className="text-sm text-gray-600">到期日期: {formData.dueDate}</p>
                  <p className="text-sm text-gray-600">币种: {formData.currency}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">客户信息</h4>
                  <p className="text-sm text-gray-600">{formData.clientName}</p>
                  <p className="text-sm text-gray-600">{formData.clientEmail}</p>
                  {formData.clientPhone && (
                    <p className="text-sm text-gray-600">{formData.clientPhone}</p>
                  )}
                  {formData.clientAddress && (
                    <p className="text-sm text-gray-600">{formData.clientAddress}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">项目列表</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">单价</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">税率</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">小计</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.taxRate}%</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      {renderStepIndicator()}
      
      <div className="min-h-96">
        {renderStepContent()}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          type="button"
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? '取消' : '上一步'}
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            下一步
            <FiArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" color="white" />
                <span className="ml-2">创建中...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                创建发票
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceFormWizard;