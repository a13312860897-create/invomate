import React, { useState, useEffect } from 'react';

// 法国VAT税率常量
const FRENCH_VAT_RATES = {
  standard: { rate: 20, label: 'Taux standard (20%)' },
  reduced: { rate: 10, label: 'Taux réduit (10%)' },
  superReduced: { rate: 5.5, label: 'Taux super réduit (5,5%)' },
  special: { rate: 2.1, label: 'Taux particulier (2,1%)' }
};

const FrenchInvoiceForm = ({ formData, setFormData, selectedClient, validationErrors, setValidationErrors, t }) => {
  // 获取法国公司设置信息
  const getFrenchCompanySettings = () => {
    try {
      const settings = localStorage.getItem('frenchCompanySettings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('获取法国公司设置失败:', error);
    }
    // 返回默认值
    return {
      sellerCompanyName: '',
      sellerAddress: '',
      sellerVATNumber: '',
      sellerSIREN: '',
      sellerPhone: '',
      sellerWebsite: ''
    };
  };

  const companySettings = getFrenchCompanySettings();
  // 法国发票编号生成规则（连续不跳号）
  const generateFrenchInvoiceNumber = (year = new Date().getFullYear(), sequence = 1) => {
    // 使用时间戳确保连续性
    const timestamp = new Date().getTime().toString().slice(-6);
    return `INV-FR-${year}-${timestamp}`;
  };

  // 验证法国VAT号格式
  const validateFrenchVAT = (vat) => {
    const frenchVATRegex = /^FR[0-9]{11}$/;
    return frenchVATRegex.test(vat);
  };

  // 验证SIREN号格式
  const validateSIREN = (siren) => {
    const sirenRegex = /^[0-9]{9}$/;
    return sirenRegex.test(siren);
  };

  // 处理字段变更
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      frenchFields: {
        ...prev.frenchFields,
        [field]: value
      }
    }));

    // 清除相关验证错误
    if (validationErrors && validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 生成新的法国发票编号
  const handleGenerateInvoiceNumber = () => {
    const newNumber = generateFrenchInvoiceNumber();
    setFormData(prev => ({ ...prev, invoiceNumber: newNumber }));
  };

  // 确保frenchFields存在
  React.useEffect(() => {
    if (!formData.frenchFields) {
      setFormData(prev => ({
        ...prev,
        frenchFields: {
          deliveryDate: prev.issueDate,
          sellerCompany: '',
          sellerAddress: '',
          sellerVAT: '',
          sellerSIREN: '',
          buyerCompany: '',
          buyerAddress: '',
          buyerVAT: ''
        }
      }));
    }
  }, [formData.frenchFields, setFormData, formData.issueDate]);

  // 法国发票必备字段状态
  const [frenchFields, setFrenchFields] = useState({
    // ① 发票编号 - 连续、不跳号
    invoiceNumber: formData.invoiceNumber || generateFrenchInvoiceNumber(),
    // ② 发票日期 - 交易完成日
    issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
    // ③ 交付/服务完成日 - 可与发票日期相同
    deliveryDate: formData.deliveryDate || formData.issueDate || new Date().toISOString().split('T')[0],
    // ④ 卖方公司名 - 营业执照全称
    sellerCompanyName: companySettings.sellerCompanyName,
    // ⑤ 卖方地址 - 注册地址
    sellerAddress: companySettings.sellerAddress,
    // ⑥ 卖方VAT号 - FR+11位数字
    sellerVATNumber: companySettings.sellerVATNumber,
    // ⑦ 卖方SIREN - 9位工商号
    sellerSIREN: companySettings.sellerSIREN,
    // ⑧ 买方公司名 - B2B必填
    buyerCompanyName: '',
    // ⑨ 买方地址
    buyerAddress: '',
    // ⑩ 买方VAT号 - B2B必填；B2C可空
    buyerVATNumber: '',
    // TVA豁免字段
    tvaExempt: false,
    tvaExemptClause: ''
  });

  // 当选择客户时更新买方信息
  useEffect(() => {
    if (selectedClient) {
      setFrenchFields(prev => ({
        ...prev,
        buyerCompanyName: selectedClient.company || selectedClient.name || '',
        buyerAddress: `${selectedClient.address || ''}, ${selectedClient.city || ''} ${selectedClient.postalCode || ''}`.trim(),
        buyerVATNumber: selectedClient.vatNumber || ''
      }));
    }
  }, [selectedClient]);

  // 法国发票字段验证 - 根据Article 242 nonies A要求
  const validateFrenchFields = () => {
    const errors = {};
    
    // 必填：发票编号和日期
    if (!frenchFields.invoiceNumber) {
      errors.invoiceNumber = '发票编号不能为空（法律要求）';
    } else if (!frenchFields.invoiceNumber.match(/^INV-FR-\d{4}-\d{6}$/)) {
      errors.invoiceNumber = '发票编号必须符合格式：INV-FR-YYYY-XXXXXX';
    }
    
    if (!frenchFields.issueDate) {
      errors.issueDate = '发票日期不能为空（法律要求）';
    }
    
    // 必填：卖方信息
    if (!frenchFields.sellerCompanyName) {
      errors.sellerCompanyName = '卖方公司名称不能为空（法律要求）';
    }
    
    if (!frenchFields.sellerAddress) {
      errors.sellerAddress = '卖方地址不能为空（法律要求）';
    }
    
    if (!frenchFields.sellerVATNumber) {
      errors.sellerVATNumber = '卖方VAT号码不能为空（法律要求）';
    } else if (!validateFrenchVAT(frenchFields.sellerVATNumber)) {
      errors.sellerVATNumber = '卖方VAT号码格式错误（应为FR+11位数字）';
    }
    
    if (!frenchFields.sellerSIREN) {
      errors.sellerSIREN = '卖方SIREN号码不能为空（法律要求）';
    } else if (!validateSIREN(frenchFields.sellerSIREN)) {
      errors.sellerSIREN = 'SIREN号码格式错误（应为9位数字）';
    }
    
    // 必填：买方信息
    if (!frenchFields.buyerCompanyName) {
      errors.buyerCompanyName = '买方公司名称不能为空（法律要求）';
    }
    
    if (!frenchFields.buyerAddress) {
      errors.buyerAddress = '买方地址不能为空（法律要求）';
    }
    
    // 如果买方是企业，需要VAT号码
     if (frenchFields.buyerVATNumber && !/^[A-Z]{2}[0-9A-Z]{2,13}$/.test(frenchFields.buyerVATNumber)) {
       errors.buyerVATNumber = '买方VAT号码格式错误';
     }
     
     // TVA豁免条款验证
     if (frenchFields.tvaExempt && !frenchFields.tvaExemptClause) {
       errors.tvaExemptClause = 'TVA豁免时必须提供法律依据条款（法律要求）';
     }
     
     return errors;
  };

  // 处理法国字段变更
  const handleFrenchFieldChange = (field, value) => {
    setFrenchFields(prev => ({ ...prev, [field]: value }));
    
    // 同时更新主表单数据
    if (field === 'invoiceNumber' || field === 'issueDate' || field === 'deliveryDate') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 应用法国VAT税率到所有项目
  const applyFrenchVATToAll = (rate) => {
    const updatedItems = formData.items.map(item => ({
      ...item,
      taxRate: rate
    }));
    setFormData(prev => ({ ...prev, items: updatedItems, defaultTaxRate: rate }));
  };

  return (
    <div className="space-y-6">
      {/* 法国发票合规提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              法国发票合规要求（Article 242 nonies A）
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="space-y-1">
                <li>• <strong>必填信息：</strong>发票编号、日期、双方完整信息（名称、地址）</li>
                <li>• <strong>卖方VAT号：</strong>必须提供有效的VAT号码（FR+11位数字格式）</li>
                <li>• <strong>卖方SIREN：</strong>必须提供9位数字的SIREN号码</li>
                <li>• <strong>TVA处理：</strong>如适用豁免，必须注明法律依据条款</li>
                <li>• <strong>税率要求：</strong>标准20%，减免10%，特殊5.5%，超减2.1%</li>
                <li>• <strong>2025年起：</strong>电子发票强制要求，需符合平台规范</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                基于法国税务局官方文档要求
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 发票基本信息 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">发票基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ① 发票编号 *
            </label>
            <div className="flex">
              <input
                type="text"
                value={frenchFields.invoiceNumber}
                onChange={(e) => handleFrenchFieldChange('invoiceNumber', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="INV-FR-2024-001"
              />
              <button
                type="button"
                onClick={handleGenerateInvoiceNumber}
                className="ml-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                生成
              </button>
            </div>
            {validationErrors?.invoiceNumber && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ② 发票日期 *
            </label>
            <input
              type="date"
              value={frenchFields.issueDate}
              onChange={(e) => handleFrenchFieldChange('issueDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ③ 交付/服务完成日 *
            </label>
            <input
              type="date"
              value={frenchFields.deliveryDate}
              onChange={(e) => handleFrenchFieldChange('deliveryDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 卖方信息 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">卖方信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ④ 卖方公司名 *
            </label>
            <input
              type="text"
              value={frenchFields.sellerCompanyName}
              onChange={(e) => handleFrenchFieldChange('sellerCompanyName', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="营业执照全称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑤ 卖方地址 *
            </label>
            <input
              type="text"
              value={frenchFields.sellerAddress}
              onChange={(e) => handleFrenchFieldChange('sellerAddress', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="注册地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑥ 卖方VAT号 *
            </label>
            <input
              type="text"
              value={frenchFields.sellerVATNumber}
              onChange={(e) => handleFrenchFieldChange('sellerVATNumber', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="FR32123456789"
            />
            {validationErrors?.sellerVATNumber && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.sellerVATNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑦ 卖方SIREN *
            </label>
            <input
              type="text"
              value={frenchFields.sellerSIREN}
              onChange={(e) => handleFrenchFieldChange('sellerSIREN', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="123456789"
            />
            {validationErrors?.sellerSIREN && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.sellerSIREN}</p>
            )}
          </div>
        </div>
      </div>

      {/* 买方信息 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">买方信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑧ 买方公司名 *
            </label>
            <input
              type="text"
              value={frenchFields.buyerCompanyName}
              onChange={(e) => handleFrenchFieldChange('buyerCompanyName', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="B2B必填"
            />
            {validationErrors?.buyerCompanyName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.buyerCompanyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑨ 买方地址
            </label>
            <input
              type="text"
              value={frenchFields.buyerAddress}
              onChange={(e) => handleFrenchFieldChange('buyerAddress', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="买方地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⑩ 买方VAT号
            </label>
            <input
              type="text"
              value={frenchFields.buyerVATNumber}
              onChange={(e) => handleFrenchFieldChange('buyerVATNumber', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="FR32987654321（B2B必填）"
            />
            {validationErrors?.buyerVATNumber && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.buyerVATNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* TVA豁免条款 - 法律要求 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-900 mb-3">TVA豁免条款（法律要求）</h3>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={frenchFields.tvaExempt || false}
              onChange={(e) => handleFrenchFieldChange('tvaExempt', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">此发票适用TVA豁免</span>
          </label>
        </div>
        
        {frenchFields.tvaExempt && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              豁免条款说明 *
            </label>
            <textarea
              value={frenchFields.tvaExemptClause || ''}
              onChange={(e) => handleFrenchFieldChange('tvaExemptClause', e.target.value)}
              placeholder="TVA non applicable, art. 293 B du CGI"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            {validationErrors?.tvaExemptClause && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.tvaExemptClause}</p>
            )}
          </div>
        )}
      </div>

      {/* 法国VAT税率快速应用 */}
      {!frenchFields.tvaExempt && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">法国VAT税率</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(FRENCH_VAT_RATES).map(([key, { rate, label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyFrenchVATToAll(rate)}
                className="p-3 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{rate}%</div>
                <div className="text-gray-600 text-xs">{label}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            点击上方按钮可将对应税率应用到所有发票项目
          </p>
        </div>
      )}
    </div>
  );
};

export default FrenchInvoiceForm;