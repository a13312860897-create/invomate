import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/DesignSystem';
import ClientPickerModal from '../components/ClientPickerModal';
import EnhancedInvoiceActions from '../components/Invoice/EnhancedInvoiceActions';
import InvoicePreview from '../components/Invoice/InvoicePreview';
import FrenchInvoiceForm from '../components/Invoice/FrenchInvoiceForm';
import InvoiceTemplateSelector from '../components/Invoice/InvoiceTemplateSelector';
import PrintPreviewNew from '../components/PrintPreviewNew';
import PDFPreviewNew from '../components/PDFPreviewNew';
import { InvoiceCreationGuard } from '../components/SubscriptionGuard';
import SubscriptionExpiredModal from '../components/SubscriptionExpiredModal';

import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { useSettings } from '../contexts/SettingsContext';
import templateService from '../services/templateService';
import invoiceService from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import api from '../services/api';

const NewInvoiceForm = ({
  user: propUser
}) => {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { clients, createClient, loadClients } = useUnifiedData();
  const { getCompanySettings: getSettingsCompanyInfo } = useSettings();
  const { t, i18n } = useTranslation(['invoices', 'common']);
  
  // 订阅检查
  const {
    isExpired,
    hasActiveSubscription,
    remainingDays,
    loading: subscriptionLoading
  } = useSubscriptionTimer();
  
  // Use prop user or auth user
  const currentUser = propUser || authUser;
  
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('french-standard');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('html'); // 'html' 或 'pdf'
  const [showClientPicker, setShowClientPicker] = useState(false);
  
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
    phone: '',
    email: ''
  });
  const [creatingClient, setCreatingClient] = useState(false);
  
  // 基础发票数据
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    })(),
    serviceDate: new Date().toISOString().split('T')[0], // 服务提供日期 - 法国发票必需
    items: [{ description: '', quantity: 1, unitPrice: '', taxRate: currentUser?.invoiceMode === 'france' ? 20 : '' }],
    notes: '',
    defaultTaxRate: currentUser?.invoiceMode === 'france' ? 20 : '',
    invoiceNumber: '',
    tvaExempt: false,
    tvaExemptClause: '',
    // 发票类型字段 - 法国发票合规要求
    invoiceType: 'standard', // 标准发票、信用票据、借记票据等
    // 卖方信息字段
    sellerCompanyName: '',
    sellerEmail: '',
    sellerPhone: '',
    sellerAddress: '',
    sellerVATNumber: '',
    sellerSIREN: '',
    sellerSIRET: '',
    sellerLegalForm: '',
    sellerRegisteredCapital: '',
    sellerRCS: '',
    sellerNAF: '',
    // 交付地址字段 - 支持发票级别的交付地址覆盖
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryCountry: '',
    deliveryAddressSameAsBilling: false
  });

  // 交付地址展开状态
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);

  const {
    clientId,
    issueDate,
    dueDate,
    invoiceNumber,
    notes,
    defaultTaxRate,
    items,
    tvaExempt,
    tvaExemptClause
  } = formData;

  const loadDefaultInvoice = useCallback(async () => {
    try {
      const defaultInvoiceData = await invoiceService.getDefaultInvoice();
      if (defaultInvoiceData.defaultInvoice) {
        const defaultInvoice = defaultInvoiceData.defaultInvoice;
        setFormData(prev => ({
          ...prev,
          clientId: defaultInvoice.clientId || '',
          // 始终使用当前日期作为默认值
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toISOString().split('T')[0];
          })(),
          serviceDate: new Date().toISOString().split('T')[0],
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
      console.error('Failed to load default invoice:', error);
      // 如果获取默认发票失败，继续使用空表单，但确保日期有默认值
      setFormData(prev => ({
        ...prev,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString().split('T')[0];
        })(),
        serviceDate: new Date().toISOString().split('T')[0],
        items: [{
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: (currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') ? 20 : 0
        }],
        tvaExempt: false,
        tvaExemptClause: ''
      }));
    }
  }, [currentUser]);

  const loadInitialData = useCallback(async () => {
    try {
      const templatesData = await templateService.getAllTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setTemplates([]);
    }
  }, []);

  const generateFrenchInvoiceNumber = async () => {
    try {
      // 调用后端API获取下一个法国发票编号
      const response = await api.get('/invoice-numbers/next-number?format=french');
      return response.data.invoiceNumber;
    } catch (error) {
      console.error('Failed to get French invoice number:', error);
      // 如果API调用失败，使用备用方案
      const now = new Date();
      const year = now.getFullYear();
      // 生成6位数字的序列号，确保符合法国发票编号格式 FR-YYYY-NNNNNN
      const randomNum = Math.floor(Math.random() * 900000) + 100000; // 生成100000-999999之间的6位数
      const paddedNum = randomNum.toString().padStart(6, '0'); // 确保是6位数字
      return `FR-${year}-${paddedNum}`;
    }
  };

  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  
  // Common tax rate constants (multi-country support)
  const COMMON_TAX_RATES = {
    zero: { rate: 0, label: 'Tax Exempt (0%)' },
    low: { rate: 5, label: 'Low Rate (5%)' },
    standard: { rate: 10, label: 'Standard Rate (10%)' },
    high: { rate: 20, label: 'High Rate (20%)' }
  };

  // 法国VAT税率常量
  const FRENCH_VAT_RATES = {
    zero: { rate: 0, label: 'Taux zéro (0%)' },
    special: { rate: 2.1, label: 'Taux particulier (2,1%)' },
    superReduced: { rate: 5.5, label: 'Taux super réduit (5,5%)' },
    reduced: { rate: 10, label: 'Taux réduit (10%)' },
    standard: { rate: 20, label: 'Taux standard (20%)' }
  };

  // Save form data to localStorage
  const saveFormDataToStorage = useCallback((data) => {
    try {
      const dataToSave = {
        ...data,
        timestamp: Date.now() // add timestamp for expiration checking
      };
      localStorage.setItem('newInvoiceFormData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, []);

  // Restore form data from localStorage
  const loadFormDataFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('newInvoiceFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Check if data is expired (24 hours)
        const isExpired = Date.now() - parsedData.timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && parsedData.clientId) {
          // Restore form data but exclude timestamp and ensure dates use current date
          const { timestamp, issueDate, dueDate, serviceDate, ...formDataToRestore } = parsedData;
          setFormData(prev => ({
            ...prev,
            ...formDataToRestore,
            // Always use current date as default value
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 30);
              return date.toISOString().split('T')[0];
            })(),
            serviceDate: new Date().toISOString().split('T')[0]
          }));
          return true; // indicates data restored successfully
        } else if (isExpired) {
          // Clear expired data
          localStorage.removeItem('newInvoiceFormData');
        }
      }
    } catch (error) {
      console.error('Failed to restore form data:', error);
      localStorage.removeItem('newInvoiceFormData');
    }
    return false;
  }, []);

  // Clear saved form data
  const clearSavedFormData = useCallback(() => {
    try {
      localStorage.removeItem('newInvoiceFormData');
    } catch (error) {
      console.error('Failed to clear saved form data:', error);
    }
  }, []);

  // 加载初始数据
  useEffect(() => {
    if (!authLoading && currentUser) {
      loadInitialData();
      
      // 先尝试恢复保存的表单数据
      const hasRestoredData = loadFormDataFromStorage();
      
      // 如果没有恢复到数据，则加载默认发票
      if (!hasRestoredData) {
        loadDefaultInvoice();
      }
      
      // 初始化卖方信息到formData
      const companySettings = getCompanySettings();
      setFormData(prev => ({
        ...prev,
        sellerCompanyName: companySettings.name || '',
        sellerEmail: companySettings.email || '',
        sellerPhone: companySettings.phone || '',
        sellerAddress: companySettings.address || '',
        sellerVATNumber: companySettings.vatNumber || '',
        sellerSIREN: companySettings.siren || '',
        sellerSIRET: companySettings.siret || '',
        sellerLegalForm: companySettings.legalForm || '',
        sellerRegisteredCapital: companySettings.registeredCapital || '',
        sellerRCS: companySettings.rcsNumber || '',
        sellerNAF: companySettings.nafCode || ''
      }));
      
      // 自动应用法国模板
      if (selectedTemplate && selectedTemplate.startsWith('french-')) {
        const vatType = selectedTemplate.replace('french-', '');
        applyTemplate('france-template', vatType);
      }
      
      // 如果表单没有发票编号，自动生成一个
      if (!formData.invoiceNumber) {
        generateInvoiceNumber();
      }
    }
  }, [authLoading, currentUser, selectedTemplate, loadInitialData, loadDefaultInvoice, loadFormDataFromStorage]);

  const applyFrenchTemplate = async () => {
    // 生成法国发票编号 - 使用异步版本
    const invoiceNumber = await generateFrenchInvoiceNumber();

    // 从userProfile获取法国公司信息，而不是localStorage
    let frenchCompanyInfo = {
      sellerCompanyName: '',
      sellerAddress: '',
      sellerVATNumber: '',
      sellerSIREN: '',
      sellerSIRET: '',
      sellerRCS: '',
      sellerNAF: '',
      sellerLegalForm: '',
      sellerRegisteredCapital: ''
    };
    
    // 优先使用userProfile数据
    if (currentUser) {
      frenchCompanyInfo = {
        sellerCompanyName: currentUser.companyName || '',
        sellerAddress: currentUser.address || '',
        sellerVATNumber: currentUser.vatNumber || '',
        sellerSIREN: currentUser.sirenNumber || currentUser.siren || '',
        sellerSIRET: currentUser.siretNumber || '',
        sellerRCS: currentUser.rcsNumber || '',
        sellerNAF: currentUser.nafCode || '',
        sellerLegalForm: currentUser.legalForm || '',
        sellerRegisteredCapital: currentUser.registeredCapital || ''
      };
    } else {
      // 回退到localStorage（保持向后兼容）
      try {
        const savedSettings = localStorage.getItem('frenchCompanySettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          frenchCompanyInfo = {
            sellerCompanyName: parsedSettings.sellerCompanyName || frenchCompanyInfo.sellerCompanyName,
            sellerAddress: parsedSettings.sellerAddress || frenchCompanyInfo.sellerAddress,
            sellerVATNumber: parsedSettings.sellerVATNumber || frenchCompanyInfo.sellerVATNumber,
            sellerSIREN: parsedSettings.sellerSIREN || frenchCompanyInfo.sellerSIREN,
            sellerSIRET: parsedSettings.sellerSIRET || frenchCompanyInfo.sellerSIRET,
            sellerRCS: parsedSettings.sellerRCS || frenchCompanyInfo.sellerRCS,
            sellerNAF: parsedSettings.sellerNAF || frenchCompanyInfo.sellerNAF,
            sellerLegalForm: parsedSettings.sellerLegalForm || frenchCompanyInfo.sellerLegalForm,
            sellerRegisteredCapital: parsedSettings.sellerRegisteredCapital || frenchCompanyInfo.sellerRegisteredCapital
          };
        }
      } catch (error) {
        console.error('Failed to read French company info:', error);
      }
    }

    // 设置法国发票必备字段
    setFormData(prev => ({
      ...prev,
      invoiceNumber: invoiceNumber,
      frenchFields: {
        sellerCompanyName: frenchCompanyInfo.sellerCompanyName,
        sellerAddress: frenchCompanyInfo.sellerAddress,
        sellerVATNumber: frenchCompanyInfo.sellerVATNumber,
        sellerSIREN: frenchCompanyInfo.sellerSIREN,
        sellerSIRET: frenchCompanyInfo.sellerSIRET,
        sellerRCS: frenchCompanyInfo.sellerRCS,
        sellerNAF: frenchCompanyInfo.sellerNAF,
        sellerLegalForm: frenchCompanyInfo.sellerLegalForm,
        sellerRegisteredCapital: frenchCompanyInfo.sellerRegisteredCapital,
        buyerCompanyName: '',
        buyerAddress: '',
        buyerVATNumber: ''
      },
      defaultTaxRate: 20,
      tvaExempt: false,
      tvaExemptClause: '',
      items: prev.items.map(item => ({
        ...item,
        taxRate: item.taxRate || 20
      }))
    }));
  };

  const applyTemplate = async (templateId, vatType = 'standard') => {
    // 如果是法国模板，使用专门的法国模板逻辑
    if (templateId === 'france-template') {
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
        console.error('Failed to read French company info:', error);
      }

      // 设置法国发票必备字段
      const invoiceNumber = await generateFrenchInvoiceNumber();
      setFormData(prev => ({
        ...prev,
        invoiceNumber: invoiceNumber,
        // 添加法国发票必备字段，使用从设置中读取的信息
        frenchFields: {
          sellerCompanyName: frenchCompanyInfo.sellerCompanyName,
          sellerAddress: frenchCompanyInfo.sellerAddress,
          sellerVATNumber: frenchCompanyInfo.sellerVATNumber,
          sellerSIREN: frenchCompanyInfo.sellerSIREN,
          sellerSIRET: frenchCompanyInfo.sellerSIRET
        },
        // 根据增值税类型设置税率和标志，确保清除之前的状态
        tvaExempt: vatType === 'exempt',
        autoLiquidation: vatType === 'auto',
        tvaExemptClause: vatType === 'exempt' ? '' : undefined, // 清除豁免条款
        // 设置法国VAT税率 - 豁免和自清算都应该是0税率
        defaultTaxRate: (vatType === 'exempt' || vatType === 'auto') ? 0 : FRENCH_VAT_RATES.standard.rate,
        items: prev.items.map(item => ({
          ...item,
          taxRate: (vatType === 'exempt' || vatType === 'auto') ? 0 : (item.taxRate || FRENCH_VAT_RATES.standard.rate)
        }))
      }));
      
      setSelectedTemplate(templateId);
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
      console.log(`Applied template: ${template.name}`);
    } catch (error) {
    console.error('Failed to apply template:', error);
    alert('Failed to apply template, please try again');
  }
};

  const handleTemplateChange = async (templateOrEvent) => {
    let templateId;
    let templateObj = null;
    
    // 处理直接传递的模板对象或事件对象
    if (templateOrEvent && typeof templateOrEvent === 'object' && templateOrEvent.id) {
      templateId = templateOrEvent.id;
      templateObj = templateOrEvent;
    } else if (templateOrEvent && templateOrEvent.target) {
      templateId = templateOrEvent.target.value;
    } else {
      templateId = templateOrEvent;
    }
    
    if (!templateId) {
      setSelectedTemplate('');
      return;
    }
    
    // 处理法国模板选择
    if (templateId.startsWith('french-')) {
      const vatType = templateId.replace('french-', '');
      
      // 直接调用applyTemplate，传入模板对象或vatType
      if (templateObj && templateObj.vatType) {
        await applyTemplate('france-template', templateObj.vatType);
      } else {
        await applyTemplate('france-template', vatType);
      }
    } else {
      await applyTemplate(templateId);
    }
  };



// 处理发票项目变化
const handleItemChange = (index, field, value) => {
  const newItems = [...formData.items];
  
  // 如果是修改税率，需要检查当前的VAT模式
  if (field === 'taxRate') {
    // 如果当前是TVA豁免或自清算模式，强制税率为0
    if (formData.tvaExempt || formData.autoLiquidation) {
      value = 0;
    }
  }
  
  newItems[index] = {
    ...newItems[index],
    [field]: value
  };
  const updatedFormData = { ...formData, items: newItems };
  setFormData(updatedFormData);
  
  // 保存表单数据到localStorage
  saveFormDataToStorage(updatedFormData);
};

const addItem = () => {
  // 根据当前VAT模式确定新项目的税率
  const newItemTaxRate = (formData.tvaExempt || formData.autoLiquidation) ? 0 : (formData.defaultTaxRate || '');
  
  const updatedFormData = {
    ...formData,
    items: [...formData.items, { description: '', quantity: 1, unitPrice: '', taxRate: newItemTaxRate }]
  };
  setFormData(updatedFormData);
  
  // 保存表单数据到localStorage
  saveFormDataToStorage(updatedFormData);
};

const applyVATRateToAll = (rate) => {
  setFormData(prev => ({
    ...prev,
    defaultTaxRate: rate,
    items: prev.items.map(item => ({ ...item, taxRate: rate }))
  }));
};

const calculateDueDate = (issueDate, days = 30) => {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const handleIssueDateChange = (newDate) => {
  setFormData(prev => ({
    ...prev,
    issueDate: newDate,
    dueDate: prev.dueDate || calculateDueDate(newDate)
  }));
};

const generateInvoiceNumber = async () => {
    try {
      // 检查是否是法国模板，使用法国标准格式
      if (selectedTemplate && (selectedTemplate.includes('french') || selectedTemplate === 'france-template')) {
        const invoiceNumber = await generateFrenchInvoiceNumber();
        setFormData(prev => ({ ...prev, invoiceNumber }));
        return invoiceNumber;
      }
      
      // 默认格式：INV-YYYYMM-XXXX
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoiceNumber = `INV-${year}${month}-${random}`;
      setFormData(prev => ({ ...prev, invoiceNumber }));
      return invoiceNumber;
    } catch (error) {
      console.error('生成发票编号失败:', error);
      // 备用方案
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);
      const invoiceNumber = `INV-${year}${month}-${timestamp}`;
      setFormData(prev => ({ ...prev, invoiceNumber }));
      return invoiceNumber;
    }
  };

const removeItem = (index) => {
  if (formData.items.length > 1) {
    const newItems = formData.items.filter((_, i) => i !== index);
    const updatedFormData = { ...formData, items: newItems };
    setFormData(updatedFormData);
    
    // 保存表单数据到localStorage
    saveFormDataToStorage(updatedFormData);
  }
};

const calculateItemTotal = (item) => {
  const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
  // 如果是TVA豁免或自清算，税额为0
  if (formData.tvaExempt || formData.autoLiquidation) {
    return subtotal;
  }
  const taxAmount = subtotal * ((item.taxRate || 0) / 100);
  return subtotal + taxAmount;
};

const calculateInvoiceTotal = () => {
  return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
};

const calculateTotalTax = () => {
  // 如果是TVA豁免或自清算，税额为0
  if (formData.tvaExempt || formData.autoLiquidation) {
    return 0;
  }
  return formData.items.reduce((total, item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const taxAmount = subtotal * ((item.taxRate || 0) / 100);
    return total + taxAmount;
  }, 0);
};

const calculateSubtotal = () => {
  return formData.items.reduce((total, item) => {
    return total + ((item.quantity || 0) * (item.unitPrice || 0));
  }, 0);
};

const calculateTotals = () => {
  const subtotal = calculateSubtotal();
  const taxAmount = calculateTotalTax();
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
};

// 统一的金额格式化（与 PrintPreviewNew、后端 pdfServiceNew 保持一致）
const formatCurrencyUnified = (amount, currencyCode = 'EUR') => {
  const num = Number(amount ?? 0);
  const isFrenchMode = (currentUser?.invoiceMode === 'fr' || currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french' || i18n.language === 'fr');
  if (isFrenchMode) {
    try {
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
      // 替换不间断空格，确保视觉一致
      return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
    } catch (e) {
      return `${currencyCode} ${num.toFixed(2)}`;
    }
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (e) {
    return `${currencyCode} ${num.toFixed(2)}`;
  }
};

const handleNewClientChange = (e) => {
  const { name, value } = e.target;
  
  // 对SIREN和SIRET进行格式化处理，只保留数字
  let processedValue = value;
  if (name === 'siren' || name === 'siret') {
    processedValue = value.replace(/\D/g, ''); // 只保留数字
  }
  
  setNewClientData(prev => ({
    ...prev,
    [name]: processedValue
  }));
};

const getDueDateAfter30Days = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

const cancelNewClient = () => {
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
    phone: '',
    email: ''
  });
};

  const createNewClient = async () => {
    if (!newClientData.name.trim()) {
    alert('Client name is required');
      return;
    }
    
    // 验证SIREN格式（如果提供）
    if (newClientData.siren && newClientData.siren.length > 0) {
      if (newClientData.siren.length !== 9 || !/^\d{9}$/.test(newClientData.siren)) {
      alert('SIREN must be 9 digits');
        return;
      }
    }
    
    // 验证SIRET格式（如果提供）
    if (newClientData.siret && newClientData.siret.length > 0) {
      if (newClientData.siret.length !== 14 || !/^\d{14}$/.test(newClientData.siret)) {
      alert('SIRET must be 14 digits');
        return;
      }
    }
  
  setCreatingClient(true);
  try {
    const clientData = {
      name: newClientData.name.trim(),
      email: newClientData.email.trim(),
      company: newClientData.company.trim(),
      address: newClientData.address.trim(),
      city: newClientData.city.trim(),
      postalCode: newClientData.postalCode.trim(),
      country: newClientData.country.trim(),
      vatNumber: newClientData.vatNumber.trim(),
      siren: newClientData.siren.trim() || null, // 如果为空则发送null
      siret: newClientData.siret.trim() || null, // 如果为空则发送null
      phone: newClientData.phone.trim(),
      // 添加交付地址数据
      sameAsAddress: newClientData.sameAsAddress || false,
      deliveryAddress: newClientData.deliveryAddress?.trim() || '',
      deliveryCity: newClientData.deliveryCity?.trim() || '',
      deliveryPostalCode: newClientData.deliveryPostalCode?.trim() || '',
      deliveryCountry: newClientData.deliveryCountry?.trim() || ''
    };
    
    const newClient = await createClient(clientData);
    
    // 关闭模态框并重置表单
    cancelNewClient();
    
    // 自动选择新创建的客户
    setFormData(prev => ({ ...prev, clientId: newClient.id }));
    
    alert('Client created successfully!');
  } catch (error) {
    console.error('Failed to create client:', error);
    alert('Failed to create client: ' + (error.message || 'Unknown error'));
  } finally {
    setCreatingClient(false);
  }
};



  const saveInvoice = async () => {
    // 防止重复提交
    if (loading) {
      console.log('Save operation in progress; ignoring duplicate request');
      return;
    }

    // 验证表单
    if (!validateForm()) {
      console.log('Form validation failed; cannot save');
      throw new Error('Form validation failed');
    }

    console.log('Starting to save invoice, form data:', formData);
    setLoading(true);
    try {
      // 从统一设置中获取销售方数据
      const companySettings = getCompanySettings();
      
      const invoiceData = {
        // 后端期望的核心字段
        clientId: parseInt(formData.clientId, 10) || null, // 确保是数字类型
        items: formData.items.map(item => ({
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          // 如果是TVA豁免或自清算，税率应该为0
          taxRate: (formData.tvaExempt || formData.autoLiquidation) ? 0 : (parseFloat(item.taxRate) || 0)
        })),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        notes: formData.notes,
        status: 'draft',
        
        // 金额字段 - 确保数值类型
        subtotal: parseFloat(calculateSubtotal()) || 0,
        taxAmount: parseFloat(calculateTotalTax()) || 0,
        total: parseFloat(calculateInvoiceTotal()) || 0,
        totalAmount: parseFloat(calculateInvoiceTotal()) || 0, // 兼容字段
        
        // 其他表单数据
        templateId: selectedTemplate || null,
        currency: 'EUR',
        locale: i18n.language === 'fr' ? 'fr-FR' : 'en-US',
        invoiceNumber: formData.invoiceNumber,
        serviceDate: formData.serviceDate,
        deliveryAddress: formData.deliveryAddress,
        deliveryCity: formData.deliveryCity,
        deliveryPostalCode: formData.deliveryPostalCode,
        deliveryCountry: formData.deliveryCountry,
        tvaExempt: formData.tvaExempt || false,
        tvaExemptClause: formData.tvaExemptClause || '',
        autoLiquidation: formData.autoLiquidation || false,
        
        // 销售方数据 - 确保所有后端需要的字段都包含
        sellerCompanyName: companySettings.name || '',
        sellerCompanyAddress: [companySettings.address, companySettings.city, companySettings.postalCode]
          .filter(Boolean).join(' ') || '',
        sellerTaxId: companySettings.vatNumber || '',
        sellerSiren: companySettings.siren || '',
        sellerSiret: companySettings.siret || '',
        sellerPhone: companySettings.phone || '',
        sellerEmail: companySettings.email || '',
        sellerNafCode: companySettings.nafCode || '',
        sellerRcsNumber: companySettings.rcsNumber || '',
        sellerLegalForm: companySettings.legalForm || '',
        sellerRegisteredCapital: companySettings.registeredCapital || ''
      };
      
      console.log('Prepared invoice data:', invoiceData);
      console.log('Invoice data structure details:', JSON.stringify(invoiceData, null, 2));
      console.log('Client ID validation:', {
        clientId: invoiceData.clientId,
        clientIdType: typeof invoiceData.clientId,
        clientIdString: String(invoiceData.clientId),
        isValidClientId: !!(invoiceData.clientId && String(invoiceData.clientId).trim() !== '')
      });
      
      // 检查当前可用的客户端列表
      console.log('Current available clients list:', clients.map(c => ({id: c.id, name: c.name, company: c.company})));
      
      
      // 在发送前再次验证clientId
      const clientIdNum = parseInt(formData.clientId, 10);
      if (!clientIdNum || isNaN(clientIdNum)) {
        throw new Error('Invalid client ID; cannot create invoice');
      }
      
      // 验证选中的客户端是否存在于客户端列表中
      const selectedClient = clients.find(c => parseInt(c.id, 10) === clientIdNum);
      console.log('Selected client:', selectedClient);
      
      if (!selectedClient) {
        throw new Error(`Client ID ${clientIdNum} not found in clients list; please refresh and retry`);
      }
      
      const response = await invoiceService.createInvoice(invoiceData);
      console.log('Raw API response:', response);
      // 修复：根据实际API响应结构提取发票数据
      const savedInvoice = response.invoice || response.data?.invoice || response.data;
      console.log('Invoice saved successfully; returned data:', savedInvoice);
      console.log('Response structure analysis:', {
        hasData: !!response.data,
        hasInvoice: !!response.invoice,
        hasDataInvoice: !!response.data?.invoice,
        responseKeys: Object.keys(response || {}),
        dataKeys: response.data ? Object.keys(response.data) : null
      });
      
      // 更新formData以包含新创建的发票ID
      if (savedInvoice && savedInvoice.id) {
        setFormData(prev => ({ ...prev, id: savedInvoice.id }));
        console.log('Updated invoice ID in formData:', savedInvoice.id);
        
        // 发票保存成功后清除localStorage中的表单数据
        clearSavedFormData();
      }
      
      return savedInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (invoiceId = formData.id) => {
    try {
      let targetInvoiceId = invoiceId;
      
      // 如果发票ID不存在，先自动保存
      if (!targetInvoiceId) {
        console.log('Invoice not saved; auto-saving to generate PDF...');
        
        // 验证表单基本数据
        if (!formData.clientId || formData.items.length === 0) {
          throw new Error('Please fill in the invoice information (client and items) first');
        }
        
        // 自动保存发票
        const savedInvoice = await saveInvoice();
        targetInvoiceId = savedInvoice?.id;
        
        if (!targetInvoiceId) {
          throw new Error('Auto-saving invoice failed; cannot generate PDF');
        }
        
        console.log('Auto-saved invoice successfully, ID:', targetInvoiceId);
      }

      // 调用后端API生成PDF
      const token = localStorage.getItem('token');
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/invoices/${targetInvoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取PDF blob
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `facture-${formData.invoiceNumber || 'draft'}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, invoiceId: targetInvoiceId };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handlePrint = () => {
    setPreviewMode('pdf'); // 设置为PDF模式
    setShowPrintPreview(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.clientId) {
      errors.clientId = t('invoices:validation.clientRequired');
    } else {
      // 验证clientId是否为有效的数字或字符串
      const clientIdStr = String(formData.clientId).trim();
      if (!clientIdStr || clientIdStr === '' || clientIdStr === 'undefined' || clientIdStr === 'null') {
        errors.clientId = t('invoices:validation.clientRequired');
      }
    }
    
    if (formData.items.length === 0) {
      errors.items = t('invoices:validation.itemsRequired');
    }
    
    // 法国模式特殊验证 - 使用统一设置而非localStorage
    if (currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') {
      // 验证卖方信息 - 从统一设置获取
      const companySettings = getCompanySettings();
      
      if (!companySettings.name) {
        errors.sellerCompanyName = 'Nom de l\'entreprise vendeur obligatoire - Veuillez configurer dans les paramètres';
      }
      
      if (!companySettings.address && !companySettings.city) {
        errors.sellerAddress = 'Adresse du vendeur obligatoire - Veuillez configurer dans les paramètres';
      }
      
      if (!companySettings.vatNumber) {
        errors.sellerVATNumber = 'Numéro de TVA obligatoire - Veuillez configurer dans les paramètres';
      } else {
        const frenchVATRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;
        if (!frenchVATRegex.test(companySettings.vatNumber)) {
          errors.sellerVATNumber = 'Format de numéro de TVA français invalide (FR + 2 caractères + 9 chiffres)';
        }
      }
      
      if (!companySettings.siren) {
        errors.sellerSIREN = 'Numéro SIREN obligatoire - Veuillez configurer dans les paramètres';
      } else {
        const sirenRegex = /^[0-9]{9}$/;
        if (!sirenRegex.test(companySettings.siren)) {
          errors.sellerSIREN = 'Format SIREN invalide (9 chiffres requis)';
        }
      }
      
      // 验证其他法国法定字段
      if (!companySettings.siret) {
        errors.sellerSIRET = 'Numéro SIRET obligatoire - Veuillez configurer dans les paramètres';
      } else {
        const siretRegex = /^[0-9]{14}$/;
        if (!siretRegex.test(companySettings.siret)) {
          errors.sellerSIRET = 'Format SIRET invalide (14 chiffres requis)';
        }
      }
      
      if (!companySettings.legalForm) {
        errors.sellerLegalForm = 'Forme juridique obligatoire - Veuillez configurer dans les paramètres';
      }
      
      if (!companySettings.registeredCapital) {
        errors.sellerRegisteredCapital = 'Capital social obligatoire - Veuillez configurer dans les paramètres';
      }
      
      if (!companySettings.rcsNumber) {
        errors.sellerRcsNumber = 'Numéro RCS obligatoire - Veuillez configurer dans les paramètres';
      }
      
      if (!companySettings.nafCode) {
        errors.sellerNafCode = 'Code APE/NAF obligatoire - Veuillez configurer dans les paramètres';
      }
      
      // 简化TVA豁免验证
      if (formData.tvaExempt === true) {
        if (!formData.tvaExemptClause || formData.tvaExemptClause.trim() === '') {
          errors.tvaExemptClause = 'Mention d\'exonération TVA obligatoire';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const savedInvoice = await saveInvoice();
      if (savedInvoice && savedInvoice.id) {
        alert(t('invoices:messages.createSuccess'));
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(t('invoices:messages.createError'));
    }
  };

  const clearForm = () => {
    setFormData({
      clientId: '',
      issueDate: getCurrentDate(),
      dueDate: getDueDateAfter30Days(),
      invoiceNumber: '',
      notes: '',
      defaultTaxRate: (currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') ? 20 : 0,
      items: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: (currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') ? 20 : 0
      }],
      tvaExempt: false,
      tvaExemptClause: ''
    });
    setSelectedTemplate('');
  };

  const selectedClient = useMemo(() => {
    if (!formData.clientId || !clients.length) {
      return null;
    }
    
    // 确保类型一致性的匹配
    const clientId = formData.clientId;
    const foundClient = clients.find(client => {
      // 添加安全检查，确保client对象存在且有id属性
      if (!client || typeof client.id === 'undefined') {
        return false;
      }
      // 尝试多种匹配方式以确保兼容性
      return client.id === clientId || 
             String(client.id) === String(clientId) ||
             Number(client.id) === Number(clientId);
    });
    
    return foundClient || null;
  }, [formData.clientId, clients]);

  const handleClientChange = (clientId) => {
    // 确保clientId是有效值，并转换为数字类型
    let validClientId = '';
    if (clientId && String(clientId).trim() !== '' && clientId !== 'undefined' && clientId !== 'null') {
      // 转换为数字类型，这样后端能正确识别
      validClientId = parseInt(clientId, 10);
      // 如果转换失败，则设为空字符串
      if (isNaN(validClientId)) {
        validClientId = '';
      }
    }
    
    const updatedFormData = { 
      ...formData, 
      clientId: validClientId 
    };
    
    setFormData(updatedFormData);
    
    // 保存表单数据到localStorage
    saveFormDataToStorage(updatedFormData);
    
    // 清除客户相关的验证错误
    if (validationErrors.clientId) {
      setValidationErrors(prev => ({ 
        ...prev, 
        clientId: undefined 
      }));
    }
  };



  // Duplicate handleSendEmail function removed - using the original at line 657

  // Duplicate handlePrint function removed - using the original at line 690

  const getCompanySettings = () => {
    // 从统一设置获取完整的公司信息，确保与PDF输出一致
    const settingsCompanyInfo = getSettingsCompanyInfo();
    
    return {
      name: settingsCompanyInfo.name || currentUser?.companyName || '',
      address: settingsCompanyInfo.address || currentUser?.address || '',
      city: settingsCompanyInfo.city || currentUser?.city || '',
      postalCode: settingsCompanyInfo.postalCode || currentUser?.postalCode || '',
      phone: settingsCompanyInfo.phone || currentUser?.phone || '',
      email: settingsCompanyInfo.email || currentUser?.email || '',
      vatNumber: settingsCompanyInfo.vatNumber || currentUser?.vatNumber || '',
      siren: settingsCompanyInfo.siren || currentUser?.siren || '',
      siret: settingsCompanyInfo.siret || currentUser?.siret || '',
      legalForm: settingsCompanyInfo.legalForm || currentUser?.legalForm || '',
      registeredCapital: settingsCompanyInfo.registeredCapital || currentUser?.registeredCapital || '',
      rcsNumber: settingsCompanyInfo.rcsNumber || currentUser?.rcsNumber || '',
      nafCode: settingsCompanyInfo.nafCode || currentUser?.nafCode || ''
    };
  };

  return (
    <>
      <InvoiceCreationGuard>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 模板选择 */}
                <InvoiceTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateChange}
                  invoiceMode={currentUser?.invoiceMode}
                />

                {/* 客户选择 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('invoices:client')} *
                    </label>
                    <button
                      type="button"
                      onClick={loadClients}
                      className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      Refresh clients
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowClientPicker(true)}
                      className={`flex-1 px-3 py-2 border rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.clientId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      aria-label="Choose client"
                    >
                      {selectedClient
                        ? (selectedClient.company
                            ? `${selectedClient.company} (${selectedClient.name})`
                            : `${selectedClient.name}`)
                        : 'Choose client'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 whitespace-nowrap"
                    >
                      + New Client
                    </button>
                  </div>
                  {validationErrors.clientId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.clientId}</p>
                  )}
                </div>

                {/* 法国发票特殊字段 */}
                {(currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') && (
                  <FrenchInvoiceForm
                    formData={formData}
                    setFormData={setFormData}
                    selectedClient={selectedClient}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
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
                            <h3 className="text-lg font-medium text-gray-900">Create New Client</h3>
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
                                  Client Name *
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
                                  Email
                                </label>
                                <div className="mt-1 relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                  </div>
                                  <input
                                    type="email"
                                    name="email"
                                    value={newClientData.email}
                                    onChange={handleNewClientChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="client@example.com"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  VAT Number
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
                                  SIREN Number
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
                                  SIRET Number
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
                                  Company Name
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
                                  Phone Number
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
                            
                            {/* 账单地址部分 */}
                            <div className="border-t pt-4 mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Address</h4>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Address
                                </label>
                                <input
                                  type="text"
                                  name="address"
                                  value={newClientData.address}
                                  onChange={handleNewClientChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    City
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
                                    Postal Code
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
                                    Country
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
                            
                            {/* 交付地址部分 */}
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-900">Delivery Address</h4>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={newClientData.sameAsAddress || false}
                                    onChange={(e) => {
                                      const sameAsAddress = e.target.checked;
                                      setNewClientData(prev => ({
                                        ...prev,
                                        sameAsAddress,
                                        deliveryAddress: sameAsAddress ? prev.address : prev.deliveryAddress || '',
                                        deliveryCity: sameAsAddress ? prev.city : prev.deliveryCity || '',
                                        deliveryPostalCode: sameAsAddress ? prev.postalCode : prev.deliveryPostalCode || '',
                                        deliveryCountry: sameAsAddress ? prev.country : prev.deliveryCountry || ''
                                      }));
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-600">Same as billing address</span>
                                </label>
                              </div>
                              
                              {!newClientData.sameAsAddress && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Delivery Address
                                    </label>
                                    <input
                                      type="text"
                                      name="deliveryAddress"
                                      value={newClientData.deliveryAddress || ''}
                                      onChange={handleNewClientChange}
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        City
                                      </label>
                                      <input
                                        type="text"
                                        name="deliveryCity"
                                        value={newClientData.deliveryCity || ''}
                                        onChange={handleNewClientChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Postal Code
                                      </label>
                                      <input
                                        type="text"
                                        name="deliveryPostalCode"
                                        value={newClientData.deliveryPostalCode || ''}
                                        onChange={handleNewClientChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Country
                                      </label>
                                      <input
                                        type="text"
                                        name="deliveryCountry"
                                        value={newClientData.deliveryCountry || ''}
                                        onChange={handleNewClientChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
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
                            {creatingClient ? 'Creating...' : 'Create Client'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelNewClient}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 客户选择模态框 */}
                {showClientPicker && (
                  <ClientPickerModal
                    isOpen={showClientPicker}
                    onClose={() => setShowClientPicker(false)}
                    clients={clients}
                    initialSelectedId={formData.clientId}
                    onSelect={(c) => handleClientChange(c.id)}
                    onRefresh={loadClients}
                  />
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
                      title="Regenerate invoice number"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* 发票日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate ? (formData.issueDate.includes('T') ? formData.issueDate.split('T')[0] : formData.issueDate) : ''}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    required
                  />
                </div>

                {/* 到期日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate ? (formData.dueDate.includes('T') ? formData.dueDate.split('T')[0] : formData.dueDate) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    required
                  />
                </div>

                {/* 服务提供日期 - 法国发票必需 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Delivery Date
                    <span className="text-xs text-gray-500 ml-2">(Required for French invoices)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.serviceDate ? (formData.serviceDate.includes('T') ? formData.serviceDate.split('T')[0] : formData.serviceDate) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Date when services were provided or goods delivered; defines VAT liability timing.
                  </p>
                </div>

                {/* 交付地址部分 - 发票级别覆盖 */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setShowDeliveryAddress(!showDeliveryAddress)}
                      className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      <span>Customize Delivery Address</span>
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${showDeliveryAddress ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500">(Optional, overrides client's default delivery address)</span>
                  </div>
                  
                  {showDeliveryAddress && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2 flex items-center justify-between">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.deliveryAddressSameAsBilling || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormData(prev => ({
                                    ...prev,
                                    deliveryAddressSameAsBilling: checked,
                                    deliveryAddress: checked ? (selectedClient?.address || '') : prev.deliveryAddress,
                                    deliveryCity: checked ? (selectedClient?.city || '') : prev.deliveryCity,
                                    deliveryPostalCode: checked ? (selectedClient?.postalCode || '') : prev.deliveryPostalCode,
                                    deliveryCountry: checked ? (selectedClient?.country || '') : prev.deliveryCountry
                                  }));
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Same as client's billing address</span>
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Delivery Address
                            </label>
                            <input
                              type="text"
                              value={formData.deliveryAddress}
                              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                              placeholder="Leave blank to use client's default delivery address"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.deliveryCity}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryCity: e.target.value }))}
                            placeholder="Leave blank to use client's default"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formData.deliveryPostalCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryPostalCode: e.target.value }))}
                            placeholder="Leave blank to use client's default"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Country
                          </label>
                          <input
                            type="text"
                            value={formData.deliveryCountry}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryCountry: e.target.value }))}
                            placeholder="Leave blank to use client's default"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 税率快速选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {(currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') ? t('invoices:french.vatCalculation') : 'Quick Tax Rate Selection'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {Object.entries((currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') ? FRENCH_VAT_RATES : COMMON_TAX_RATES).map(([key, { rate, label }]) => (
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
                  {(currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') && (
                    <p className="text-xs text-gray-500 mb-4">
                      {t('invoices:french.vatCalculation')}
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
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={typeof item.taxRate === 'object' ? '' : (item.taxRate ?? '')}
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
                                placeholder="Enter tax rate"
                                className={`w-full px-2 py-1 pr-6 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  validationErrors.itemErrors?.[index]?.taxRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                            </div>
                            {validationErrors.itemErrors?.[index]?.taxRate && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.itemErrors[index].taxRate}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:subtotal')}
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700">
                              {formatCurrencyUnified((item.quantity || 0) * (item.unitPrice || 0), 'EUR')}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('invoices:total')}
                            </label>
                            <div className="px-2 py-1 text-sm bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium">
                              {formatCurrencyUnified(calculateItemTotal(item), 'EUR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* TVA豁免设置 (仅法国模式) */}
                  {(currentUser?.invoiceMode === 'france' || currentUser?.invoiceMode === 'french') && (
                    <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
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
                            TVA Exempt
                          </label>
                        </div>
                        
                        {formData.tvaExempt && (
                          <div className="ml-6">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Exemption Clause *
                            </label>
                            <input
                              type="text"
                              value={formData.tvaExemptClause || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, tvaExemptClause: e.target.value }))}
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                validationErrors.tvaExemptClause ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              placeholder="TVA non applicable, art. 293 B du CGI"
                              required
                            />
                            {validationErrors.tvaExemptClause && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.tvaExemptClause}</p>
                            )}
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
                        <span className="font-medium">{formatCurrencyUnified(calculateSubtotal(), 'EUR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('invoices:totalTax')}:</span>
                        <span className="font-medium">{formatCurrencyUnified(calculateTotalTax(), 'EUR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold">{t('invoices:grandTotal')}:</span>
                        <span className="font-bold text-blue-600 text-lg">{formatCurrencyUnified(calculateInvoiceTotal(), 'EUR')}</span>
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
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {t('invoices:cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('invoices:creating') : t('invoices:save')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 右侧：预览区和操作面板 */}
          <div className="order-2 xl:order-2 space-y-4">
            {/* 发票预览 */}
            <InvoicePreview
              formData={formData}
              client={selectedClient}
              user={currentUser}
              selectedTemplate={selectedTemplate}
              loading={loading}
            />
            
            {/* 简化的操作面板 */}
            <EnhancedInvoiceActions
              invoice={formData.id ? { id: formData.id, invoiceNumber: formData.invoiceNumber } : null}
              formData={formData}
              client={selectedClient}
              user={currentUser}
              onGeneratePDF={handleGeneratePDF}
              onPrint={handlePrint}
              loading={loading}
              disabled={!formData.clientId || formData.items.length === 0}
            />
          </div>
        </div>
      </div>
      
      {/* 打印预览模态框 */}
      {showPrintPreview && (
        <>
          {previewMode === 'pdf' ? (
            <PDFPreviewNew
              formData={formData}
              selectedClient={selectedClient}
              user={currentUser}
              previewInvoiceNumber={formData.invoiceNumber}
              onClose={() => setShowPrintPreview(false)}
            />
          ) : (
            <PrintPreviewNew
              formData={formData}
              clients={clients}
              client={selectedClient}
              user={currentUser}
              calculateTotals={calculateTotals}
              calculateItemTotal={calculateItemTotal}
              formatCurrency={formatCurrencyUnified}
              invoiceMode={currentUser?.invoiceMode}
              selectedTemplate={selectedTemplate}
              onClose={() => setShowPrintPreview(false)}
            />
          )}
        </>
      )}
      
    </div>
    </InvoiceCreationGuard>
    
    {/* 订阅到期模态框 - 无法关闭 */}
    {isExpired && (
      <SubscriptionExpiredModal
        isVisible={true}
        onRenew={() => navigate('/pricing')}
        showBackground={true}
      />
    )}
    </>
  );
}

export default NewInvoiceForm;