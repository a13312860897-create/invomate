import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { templateService } from '../services/templateService';
import { invoiceService } from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { PageHeader } from '../components/DesignSystem';
import InvoicePreview from '../components/Invoice/InvoicePreview';
import FrenchInvoiceForm from '../components/Invoice/FrenchInvoiceForm';

const NewInvoiceForm = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  // 统一使用UnifiedDataContext管理客户数据
  const { 
    clients: unifiedClients, 
    createClient, 
    loadClients
  } = useUnifiedData();
  const { t, i18n } = useTranslation(['invoices', 'common']);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('france-template');
  
  // 内联客户创建状态
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    vatNumber: '',
    siren: '',
    siret: '',
    phone: ''
  });
  const [creatingClient, setCreatingClient] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // 通用税率常量（支持多国）
  const COMMON_TAX_RATES = {
    zero: { rate: 0, label: '免税 (0%)' },
    low: { rate: 5, label: '低税率 (5%)' },
    standard: { rate: 10, label: '标准税率 (10%)' },
    high: { rate: 20, label: '高税率 (20%)' }
  };

  // 法国特定VAT税率（仅在法国模式下显示）
  const FRENCH_VAT_RATES = {
    zero: { rate: 0, label: 'Taux zéro (0%)' },
    special: { rate: 2.1, label: 'Taux particulier (2,1%)' },
    superReduced: { rate: 5.5, label: 'Taux super réduit (5,5%)' },
    reduced: { rate: 10, label: 'Taux réduit (10%)' },
    standard: { rate: 20, label: 'Taux standard (20%)' }
  };

  // 基础发票数据
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: '', taxRate: user?.invoiceMode === 'france' ? 20 : '' }],
    notes: '',
    defaultTaxRate: user?.invoiceMode === 'france' ? 20 : '',
    invoiceNumber: ''
  });

  // 定义loadInitialData函数
  const loadInitialData = useCallback(async () => {
    try {
      const templatesData = await templateService.getAllTemplates();
      setTemplates(templatesData);
      
      // 使用UnifiedDataContext加载客户数据
      if (unifiedClients.length === 0) {
        await loadClients();
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setTemplates([]);
    }
  }, [unifiedClients.length, loadClients]);

  // 应用法国模板的函数
  const applyFrenchTemplate = () => {
    // 生成法国发票编号
    const generateFrenchInvoiceNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const timestamp = now.getTime().toString().slice(-6);
      return `FR${year}${timestamp}`;
    };

    // 从localStorage读取法国公司信息
    let frenchCompanyInfo = {
      sellerCompanyName: '',
      sellerAddress: '',
      sellerVATNumber: '',
      sellerSIREN: '',
      sellerSIRET: ''
    };
    
    try {
      const savedSettings = localStorage.getItem('frenchCompanySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        frenchCompanyInfo = {
          sellerCompanyName: parsedSettings.sellerCompanyName || frenchCompanyInfo.sellerCompanyName,
          sellerAddress: parsedSettings.sellerAddress || frenchCompanyInfo.sellerAddress,
          sellerVATNumber: parsedSettings.sellerVATNumber || frenchCompanyInfo.sellerVATNumber,
          sellerSIREN: parsedSettings.sellerSIREN || frenchCompanyInfo.sellerSIREN,
          sellerSIRET: parsedSettings.sellerSIRET || frenchCompanyInfo.sellerSIRET
        };
      }
    } catch (error) {
      console.error('读取法国公司信息失败:', error);
    }

    // 设置法国发票必备字段
    setFormData(prev => ({
      ...prev,
      invoiceNumber: generateFrenchInvoiceNumber(),
      frenchFields: {
        deliveryDate: prev.issueDate || new Date().toISOString().split('T')[0],
        sellerCompanyName: frenchCompanyInfo.sellerCompanyName,
        sellerAddress: frenchCompanyInfo.sellerAddress,
        sellerVATNumber: frenchCompanyInfo.sellerVATNumber,
        sellerSIREN: frenchCompanyInfo.sellerSIREN,
        sellerSIRET: frenchCompanyInfo.sellerSIRET,
        buyerCompanyName: '',
        buyerAddress: '',
        buyerVATNumber: ''
      },
      defaultTaxRate: 20,
      items: prev.items.map(item => ({
        ...item,
        taxRate: item.taxRate || 20
      }))
    }));
  };

  // 刷新客户列表
  const refreshClients = async () => {
    try {
      await loadClients();
    } catch (error) {
      console.error('刷新客户列表失败:', error);
    }
  };

  const loadDefaultInvoice = useCallback(async () => {
    try {
      const defaultInvoiceData = await invoiceService.getDefaultInvoice();
      if (defaultInvoiceData.defaultInvoice) {
        const defaultInvoice = defaultInvoiceData.defaultInvoice;
        // 使用默认发票数据填充表单
        setFormData(prev => ({
          ...prev,
          clientId: defaultInvoice.clientId || '',
          issueDate: defaultInvoice.issueDate || new Date().toISOString().split('T')[0],
          dueDate: defaultInvoice.dueDate || '',
          items: defaultInvoice.items && defaultInvoice.items.length > 0 
            ? defaultInvoice.items.map(item => ({
                description: item.description || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || '',
                taxRate: item.taxRate || ''
              }))
            : [{ description: '', quantity: 1, unitPrice: '', taxRate: '' }],
          notes: defaultInvoice.notes || '',
          defaultTaxRate: defaultInvoice.items && defaultInvoice.items.length > 0 
            ? defaultInvoice.items[0].taxRate || '' 
            : ''
        }));
      }
    } catch (error) {
      console.error('加载默认发票失败:', error);
      // 如果获取默认发票失败，继续使用空表单
    }
  }, []);

  // 加载初始数据
  useEffect(() => {
    if (!authLoading && user) {
      loadInitialData();
      loadDefaultInvoice();
      // 自动应用法国模板
      if (selectedTemplate === 'france-template') {
        applyFrenchTemplate();
      }
    }
  }, [authLoading, user, selectedTemplate, loadInitialData, loadDefaultInvoice]);

  // 应用模板
  const handleTemplateChange = async (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      setSelectedTemplate('');
      return;
    }

    // 处理法国模板
    if (templateId === 'france-template') {
      // 生成法国发票编号
      const generateFrenchInvoiceNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const timestamp = now.getTime().toString().slice(-6); // 使用时间戳后6位确保唯一性
        return `FR${year}${timestamp}`;
      };

      // 从localStorage读取法国公司信息
      let frenchCompanyInfo = {
        sellerCompanyName: '',
        sellerAddress: '',
        sellerVATNumber: '',
        sellerSIREN: '',
        sellerSIRET: ''
      };
      
      try {
        const savedSettings = localStorage.getItem('frenchCompanySettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          frenchCompanyInfo = {
            sellerCompanyName: parsedSettings.sellerCompanyName || frenchCompanyInfo.sellerCompanyName,
            sellerAddress: parsedSettings.sellerAddress || frenchCompanyInfo.sellerAddress,
            sellerVATNumber: parsedSettings.sellerVATNumber || frenchCompanyInfo.sellerVATNumber,
            sellerSIREN: parsedSettings.sellerSIREN || frenchCompanyInfo.sellerSIREN,
            sellerSIRET: parsedSettings.sellerSIRET || frenchCompanyInfo.sellerSIRET
          };
        }
      } catch (error) {
        console.error('读取法国公司信息失败:', error);
      }

      // 设置法国发票必备字段
      setFormData(prev => ({
        ...prev,
        invoiceNumber: generateFrenchInvoiceNumber(),
        // 添加法国发票必备字段，使用从设置中读取的信息
        frenchFields: {
          deliveryDate: prev.issueDate || new Date().toISOString().split('T')[0],
          sellerCompanyName: frenchCompanyInfo.sellerCompanyName,
          sellerAddress: frenchCompanyInfo.sellerAddress,
          sellerVATNumber: frenchCompanyInfo.sellerVATNumber,
          sellerSIREN: frenchCompanyInfo.sellerSIREN,
          sellerSIRET: frenchCompanyInfo.sellerSIRET,
          buyerCompanyName: '',
          buyerAddress: '',
          buyerVATNumber: ''
        },
        // 设置法国VAT税率
         defaultTaxRate: FRENCH_VAT_RATES.standard.rate,
         items: prev.items.map(item => ({
           ...item,
           taxRate: item.taxRate || FRENCH_VAT_RATES.standard.rate
         }))
      }));
      
      setSelectedTemplate(templateId);
      console.log('已应用法国发票模板');
      return;
    }

    try {
      const template = await templateService.getTemplate(templateId);
      
      // 使用模板服务应用模板数据
      const appliedData = templateService.applyTemplateToInvoice(template, formData);
      
      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        ...appliedData,
        // 保持当前的基本信息不被覆盖
        issueDate: prev.issueDate,
        invoiceNumber: prev.invoiceNumber
      }));
      
      setSelectedTemplate(templateId);
      console.log(`已应用模板: ${template.name}`);
    } catch (error) {
      console.error('应用模板失败:', error);
      alert('应用模板失败，请重试');
    }
  };



  // 处理发票项目变化
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // 添加发票项目
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: '', taxRate: prev.defaultTaxRate || '' }]
    }));
  };

  // 应用法国VAT税率到所有项目
  const applyVATRateToAll = (rate) => {
    setFormData(prev => ({
      ...prev,
      defaultTaxRate: rate,
      items: prev.items.map(item => ({ ...item, taxRate: rate }))
    }));
  };

  // 自动计算到期日期（默认30天）
  const calculateDueDate = (issueDate) => {
    const date = new Date(issueDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // 处理发行日期变化时自动设置到期日期
  const handleIssueDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      issueDate: newDate,
      dueDate: prev.dueDate || calculateDueDate(newDate)
    }));
  };

  // 生成发票号码
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // 使用随机数代替时间，避免同一分钟内重复
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  // 自动生成发票号码（如果为空）
  useEffect(() => {
    if (!formData.invoiceNumber) {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber()
      }));
    }
  }, [formData.invoiceNumber]);

  // 删除发票项目
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  // 计算项目小计
  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const taxAmount = subtotal * ((item.taxRate || 0) / 100);
    return subtotal + taxAmount;
  };

  // 计算发票总计
  const calculateInvoiceTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  // 计算税额总计
  const calculateTotalTax = () => {
    return formData.items.reduce((total, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const taxAmount = subtotal * ((item.taxRate || 0) / 100);
      return total + taxAmount;
    }, 0);
  };

  // 计算不含税总计
  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + ((item.quantity || 0) * (item.unitPrice || 0));
    }, 0);
  };

  // 格式化货币显示
  const formatCurrency = (amount) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const currency = 'EUR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // 处理新客户数据变化
  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 创建新客户
  const createNewClient = async () => {
    if (!newClientData.name) {
      alert('客户姓名为必填项');
      return;
    }
    
    setCreatingClient(true);
    try {
      const newClient = await createClient(newClientData);
      console.log('New client created:', newClient);
      
      // 选择新创建的客户
      setFormData(prev => ({
        ...prev,
        clientId: newClient.id
      }));
      
      // 重置表单状态
      setShowNewClientForm(false);
      setNewClientData({
        name: '',
        company: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'France',
        vatNumber: '',
        siren: '',
        siret: '',
        phone: ''
      });
      
      alert('客户创建成功！');
    } catch (err) {
      console.error('Error creating client:', err);
      alert('创建客户失败，请重试');
    } finally {
      setCreatingClient(false);
    }
  };

  // 取消新客户创建
  const cancelNewClient = () => {
    setShowNewClientForm(false);
    setNewClientData({
      name: '',
      company: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      phone: ''
    });
    setFormData(prev => ({
      ...prev,
      clientId: ''
    }));
  };

  // 保存草稿
  const saveDraft = async () => {
    setLoading(true);
    try {
      const draftData = {
        ...formData,
        templateId: selectedTemplate || null,
        total: calculateInvoiceTotal(),
        subtotal: calculateSubtotal(),
        totalTax: calculateTotalTax(),
        currency: 'EUR',
        locale: i18n.language === 'fr' ? 'fr-FR' : 'en-US',
        status: 'draft'
      };
      
      await invoiceService.createInvoice(draftData);
      alert('草稿保存成功！');
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('保存草稿失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证表单
  const validateForm = () => {
    const errors = {};
    
    if (!formData.clientId) {
      errors.clientId = t('invoices:validation.clientRequired');
    }
    
    if (formData.items.length === 0) {
      errors.items = t('invoices:validation.itemsRequired');
    }
    
    // 法国模式特殊验证
    if (user?.invoiceMode === 'france') {
      // 验证卖方信息
      const settings = JSON.parse(localStorage.getItem('frenchCompanySettings') || '{}');
      
      if (!settings.sellerCompanyName) {
        errors.sellerCompanyName = 'Nom de l\'entreprise vendeur obligatoire';
      }
      
      if (!settings.sellerAddress) {
        errors.sellerAddress = 'Adresse du vendeur obligatoire';
      }
      
      if (!settings.sellerVATNumber) {
        errors.sellerVATNumber = 'Numéro de TVA obligatoire selon Article 242 nonies A';
      } else {
        const frenchVATRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;
        if (!frenchVATRegex.test(settings.sellerVATNumber)) {
          errors.sellerVATNumber = 'Format de numéro de TVA français invalide';
        }
      }
      
      if (!settings.sellerSIREN) {
        errors.sellerSIREN = 'Numéro SIREN obligatoire selon Article 242 nonies A';
      } else {
        const sirenRegex = /^[0-9]{9}$/;
        if (!sirenRegex.test(settings.sellerSIREN)) {
          errors.sellerSIREN = 'Format SIREN invalide (9 chiffres requis)';
        }
      }
      
      // 验证TVA豁免条款
      if (formData.tvaExempt === true) {
        if (!formData.tvaExemptClause || formData.tvaExemptClause.trim() === '') {
          errors.tvaExemptClause = 'Mention d\'exonération TVA obligatoire';
        } else {
          const validExemptReferences = [
            'art. 293 B',
            'article 293 B', 
            'CGI art. 293 B',
            'exonération',
            'TVA non applicable'
          ];
          
          const hasValidReference = validExemptReferences.some(ref => 
            formData.tvaExemptClause.toLowerCase().includes(ref.toLowerCase())
          );
          
          if (!hasValidReference) {
            errors.tvaExemptClause = 'La mention doit inclure une référence légale (ex: art. 293 B du CGI)';
          }
        }
      }
    }
    
    // 验证每个项目
    const itemErrors = [];
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const itemError = {};
      
      if (!item.description) {
        itemError.description = t('invoices:validation.descriptionRequired');
      }
      if (!item.quantity || item.quantity <= 0) {
        itemError.quantity = t('invoices:validation.invalidQuantity');
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        itemError.unitPrice = t('invoices:validation.invalidUnitPrice');
      }
      if (item.taxRate < 0 || item.taxRate > 100) {
        itemError.taxRate = t('invoices:validation.invalidTaxRate');
      }
      
      if (Object.keys(itemError).length > 0) {
        itemErrors[i] = itemError;
      }
    }
    
    if (itemErrors.length > 0) {
      errors.itemErrors = itemErrors;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        templateId: selectedTemplate || null,
        total: calculateInvoiceTotal(),
        subtotal: calculateSubtotal(),
        totalTax: calculateTotalTax(),
        currency: 'EUR',
        locale: i18n.language === 'fr' ? 'fr-FR' : 'en-US',
        status: 'pending'
      };
      
      await invoiceService.createInvoice(invoiceData);
      alert(t('invoices:messages.createSuccess'));
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(t('invoices:messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  // 清空表单
  const clearForm = () => {
    setFormData({
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceNumber: '',
      notes: '',
      defaultTaxRate: user?.invoiceMode === 'france' ? 20 : 0,
      items: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: user?.invoiceMode === 'france' ? 20 : 0
      }],
      tvaExempt: false,
      tvaExemptClause: ''
    });
    setSelectedTemplate('');
  };

  // PDF生成处理
  const handleGeneratePDF = async () => {
    try {
      // 这里可以实现客户端PDF生成或调用后端API
      alert(t('invoices:messages.pdfGenerating'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('invoices:messages.pdfError'));
    }
  };

  // 发送发票处理
  const handleSendInvoice = async () => {
    try {
      alert(t('invoices:messages.sendFeatureComingSoon'));
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert(t('invoices:messages.sendError'));
    }
  };

  // 打印处理
  const handlePrint = () => {
    window.print();
  };

  // 获取选中的客户信息 - 重新实现
  const selectedClient = useMemo(() => {
    if (!formData.clientId || !unifiedClients.length) {
      return null;
    }
    
    // 确保类型一致性的匹配
    const clientId = formData.clientId;
    const foundClient = unifiedClients.find(client => {
      // 尝试多种匹配方式以确保兼容性
      return client.id === clientId || 
             String(client.id) === String(clientId) ||
             Number(client.id) === Number(clientId);
    });
    
    return foundClient || null;
  }, [formData.clientId, unifiedClients]);

  // 客户选择处理函数
  const handleClientChange = (clientId) => {
    setFormData(prev => ({ 
      ...prev, 
      clientId: clientId || '' 
    }));
    
    // 清除客户相关的验证错误
    if (validationErrors.clientId) {
      setValidationErrors(prev => ({ 
        ...prev, 
        clientId: undefined 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title={t('invoices:createNew')}
        subtitle={t('invoices:selectTemplate')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* 左侧：表单区 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 order-1">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">{t('invoices:client')}</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    type="button"
                    onClick={loadDefaultInvoice}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto"
                  >
                    {t('invoices:useDefaultInvoice')}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto"
                  >
                    {t('invoices:clearForm')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 模板选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('invoices:selectTemplate')}
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('invoices:selectTemplate')}</option>
                    <option value="france-template">{t('invoices:french.templateName', '法国发票模板')}</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 客户选择 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('invoices:client')} *
                    </label>
                    <button
                      type="button"
                      onClick={refreshClients}
                      className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      刷新客户列表
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.clientId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">{t('invoices:selectClient')}</option>
                      {unifiedClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 whitespace-nowrap"
                    >
                      + 新建客户
                    </button>
                  </div>
                  {validationErrors.clientId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.clientId}</p>
                  )}
                </div>

                {/* 法国发票特殊字段 */}
                {user?.invoiceMode === 'france' && (
                  <FrenchInvoiceForm
                    formData={formData}
                    setFormData={setFormData}
                    selectedClient={selectedClient}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    t={t}
                  />
                )}

                {/* 新建客户模态框 */}
                {showNewClientForm && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={cancelNewClient}></div>
                      </div>
                      
                      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                      
                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">创建新客户</h3>
                            <button
                              type="button"
                              onClick={cancelNewClient}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  客户姓名 *
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={newClientData.name}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  VAT号码
                                </label>
                                <input
                                  type="text"
                                  name="vatNumber"
                                  value={newClientData.vatNumber}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="FR12345678901"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  SIREN号码
                                </label>
                                <input
                                  type="text"
                                  name="siren"
                                  value={newClientData.siren}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="123456789"
                                  maxLength="9"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  SIRET号码
                                </label>
                                <input
                                  type="text"
                                  name="siret"
                                  value={newClientData.siret}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="12345678901234"
                                  maxLength="14"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  公司名称
                                </label>
                                <input
                                  type="text"
                                  name="company"
                                  value={newClientData.company}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  电话号码
                                </label>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={newClientData.phone}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                地址
                              </label>
                              <input
                                type="text"
                                name="address"
                                value={newClientData.address}
                                onChange={handleNewClientChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  城市
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  value={newClientData.city}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  邮政编码
                                </label>
                                <input
                                  type="text"
                                  name="postalCode"
                                  value={newClientData.postalCode}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  国家
                                </label>
                                <input
                                  type="text"
                                  name="country"
                                  value={newClientData.country}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="button"
                            onClick={createNewClient}
                            disabled={creatingClient || !newClientData.name}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {creatingClient ? '创建中...' : '创建客户'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelNewClient}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 发票号码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('invoices:invoiceNumber')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={generateInvoiceNumber}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      title="重新生成发票号码"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* 日期信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('invoices:issueDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleIssueDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('invoices:dueDate')}
                      <span className="text-xs text-gray-500 ml-1">(Auto: +30 jours)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 税率快速选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {user?.invoiceMode === 'france' ? t('invoices:french.vatCalculation') : '税率快速选择'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {Object.entries(user?.invoiceMode === 'france' ? FRENCH_VAT_RATES : COMMON_TAX_RATES).map(([key, { rate, label }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyVATRateToAll(rate)}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                          formData.defaultTaxRate === rate
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                  {user?.invoiceMode === 'france' && (
                    <p className="text-xs text-gray-500 mb-4">
                      {t('invoices:french.complianceNote')}
                    </p>
                  )}
                </div>

                {/* 默认税率设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('invoices:defaultTaxRate')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.defaultTaxRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || '' }))}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('invoices:defaultTaxRate')}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>

                {/* 发票项目列表 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('invoices:items')}
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {t('invoices:addItem')}
                    </button>
                  </div>
                  {validationErrors.items && (
                    <p className="mb-3 text-sm text-red-600">{validationErrors.items}</p>
                  )}
                  
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">{t('common:item')} {index + 1}</h4>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              {t('invoices:removeItem')}
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:description')}
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                handleItemChange(index, 'description', e.target.value);
                                if (validationErrors.itemErrors?.[index]?.description) {
                                  const newErrors = { ...validationErrors };
                                  delete newErrors.itemErrors[index].description;
                                  if (Object.keys(newErrors.itemErrors[index]).length === 0) {
                                    delete newErrors.itemErrors[index];
                                  }
                                  setValidationErrors(newErrors);
                                }
                              }}
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                validationErrors.itemErrors?.[index]?.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              placeholder={t('invoices:description')}
                              required
                            />
                            {validationErrors.itemErrors?.[index]?.description && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.itemErrors[index].description}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:quantity')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => {
                                handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0);
                                if (validationErrors.itemErrors?.[index]?.quantity) {
                                  const newErrors = { ...validationErrors };
                                  delete newErrors.itemErrors[index].quantity;
                                  if (Object.keys(newErrors.itemErrors[index]).length === 0) {
                                    delete newErrors.itemErrors[index];
                                  }
                                  setValidationErrors(newErrors);
                                }
                              }}
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                validationErrors.itemErrors?.[index]?.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {validationErrors.itemErrors?.[index]?.quantity && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.itemErrors[index].quantity}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:unitPrice')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => {
                                handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0);
                                if (validationErrors.itemErrors?.[index]?.unitPrice) {
                                  const newErrors = { ...validationErrors };
                                  delete newErrors.itemErrors[index].unitPrice;
                                  if (Object.keys(newErrors.itemErrors[index]).length === 0) {
                                    delete newErrors.itemErrors[index];
                                  }
                                  setValidationErrors(newErrors);
                                }
                              }}
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                validationErrors.itemErrors?.[index]?.unitPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {validationErrors.itemErrors?.[index]?.unitPrice && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.itemErrors[index].unitPrice}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:taxRate')}
                            </label>
                            <select
                              value={typeof item.taxRate === 'object' ? '' : item.taxRate}
                              onChange={(e) => {
                                handleItemChange(index, 'taxRate', parseFloat(e.target.value) || '');
                                if (validationErrors.itemErrors?.[index]?.taxRate) {
                                  const newErrors = { ...validationErrors };
                                  delete newErrors.itemErrors[index].taxRate;
                                  if (Object.keys(newErrors.itemErrors[index]).length === 0) {
                                    delete newErrors.itemErrors[index];
                                  }
                                  setValidationErrors(newErrors);
                                }
                              }}
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                validationErrors.itemErrors?.[index]?.taxRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            >
                              <option value="">选择税率</option>
                              {Object.entries(user?.invoiceMode === 'france' ? FRENCH_VAT_RATES : COMMON_TAX_RATES).map(([key, { rate, label }]) => (
                                <option key={key} value={rate}>
                                  {rate}% - {label.split('(')[0].trim()}
                                </option>
                              ))}
                              <option value="custom">自定义税率</option>
                            </select>
                            {item.taxRate === 'custom' && (
                              <div className="relative mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  placeholder="输入自定义税率"
                                  onChange={(e) => {
                                    handleItemChange(index, 'taxRate', parseFloat(e.target.value) || '');
                                    if (validationErrors.itemErrors?.[index]?.taxRate) {
                                      const newErrors = { ...validationErrors };
                                      delete newErrors.itemErrors[index].taxRate;
                                      if (Object.keys(newErrors.itemErrors[index]).length === 0) {
                                        delete newErrors.itemErrors[index];
                                      }
                                      setValidationErrors(newErrors);
                                    }
                                  }}
                                  className={`w-full px-2 py-1 pr-6 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    validationErrors.itemErrors?.[index]?.taxRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                  }`}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                              </div>
                            )}
                            {validationErrors.itemErrors?.[index]?.taxRate && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.itemErrors[index].taxRate}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:subtotal')}
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700">
                              {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:total')}
                            </label>
                            <div className="px-2 py-1 text-sm bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium">
                              {formatCurrency(calculateItemTotal(item))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* TVA豁免设置 (仅法国模式) */}
                  {user?.invoiceMode === 'france' && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">TVA豁免设置</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="tvaExempt"
                            checked={formData.tvaExempt || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, tvaExempt: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="tvaExempt" className="ml-2 text-sm text-gray-700">
                            此发票适用TVA豁免
                          </label>
                        </div>
                        
                        {formData.tvaExempt && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              TVA豁免法律依据 *
                            </label>
                            <textarea
                              value={formData.tvaExemptClause || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, tvaExemptClause: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                validationErrors.tvaExemptClause ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              rows="2"
                              placeholder="例如：TVA non applicable, art. 293 B du CGI"
                              required
                            />
                            {validationErrors.tvaExemptClause && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.tvaExemptClause}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              必须包含具体的法律条款引用（如：art. 293 B du CGI）
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 发票总计 */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('invoices:subtotal')}:</span>
                        <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('invoices:totalTax')}:</span>
                        <span className="font-medium">{formatCurrency(calculateTotalTax())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold">{t('invoices:grandTotal')}:</span>
                        <span className="font-bold text-blue-600 text-lg">{formatCurrency(calculateInvoiceTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 备注 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('invoices:notes')}
                      </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('invoices:notes')}
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/invoices')}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 order-3 sm:order-1"
                  >
                    {t('invoices:cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-2"
                  >
                    {loading ? '保存中...' : '保存草稿'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-3"
                  >
                    {loading ? t('invoices:creating') : t('invoices:save')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 右侧：预览区 */}
          <div className="order-2 xl:order-2">
            <InvoicePreview
              formData={formData}
              client={selectedClient}
              user={user} 
              onGeneratePDF={handleGeneratePDF}
              onSendInvoice={handleSendInvoice}
              onPrint={handlePrint}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoiceForm;