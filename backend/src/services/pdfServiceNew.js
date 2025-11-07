const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { getFrenchLabel } = require('../utils/frenchLabels');
const { formatCurrencyUnified, formatPercentageUnified, mapCompanyLegalInfo } = require('../utils/normalizers');

/**
 * 全新的PDF生成服务 - 基于InvoicePreview.jsx模板
 * 确保PDF输出与前端预览完全一致
 */

// 格式化货币 - 改进的法国格式
const formatCurrency = (amount, currency = 'EUR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 €';
  }
  
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  // 确保使用正确的空格字符
  return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
};

// 格式化日期 - 改进的法国格式
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// 格式化百分比
const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,0%';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// 生成发票编号 - 修复：根据发票模式生成正确的编号格式
const generateInvoiceNumber = (invoiceData, invoiceMode) => {
  if (invoiceData.invoiceNumber) {
    // 如果是法国模式，需要转换现有编号格式
    if (invoiceMode === 'fr' && invoiceData.invoiceNumber.startsWith('INV-')) {
      // 将 INV-2024-001 转换为 FR-2025-000001
      const parts = invoiceData.invoiceNumber.split('-');
      if (parts.length >= 3) {
        const year = new Date().getFullYear();
        const number = parts[2].padStart(6, '0');
        return `FR-${year}-${number}`;
      }
    }
    return invoiceData.invoiceNumber;
  }
  
  const getInvoicePrefix = () => {
    switch(invoiceMode) {
      case 'fr': return 'FR-';
      default: return 'INV-';
    }
  };
  
  const year = new Date().getFullYear();
  return getInvoicePrefix() + year + '-000001';
};

// 获取交付地址 - 与InvoicePreview逻辑完全一致
const getDeliveryAddress = (formData, selectedClient) => {
  try {
    console.log('开始获取交付地址信息');

    // 新增优先级 0：使用自定义交付地址（与 InvoicePreview 逻辑一致）
    const customAddr = (formData?.customDeliveryAddress || '').trim();
    if (customAddr) {
      console.log('使用自定义交付地址');
      return {
        hasDeliveryAddress: true,
        type: 'custom',
        label: '📍 Adresse de livraison personnalisée',
        addressLines: [customAddr],
        address: customAddr  // 添加address字段供PDF渲染使用
      };
    }

    // 新增优先级 1：交付地址与账单地址相同（发票层标志）
    const sameAsBillingFlag = formData?.deliveryAddressSameAsBilling === true;
    const hasClientBillingAddress = !!(selectedClient?.address || selectedClient?.city || selectedClient?.postalCode || selectedClient?.country);
    if (sameAsBillingFlag && hasClientBillingAddress) {
      console.log('交付地址与账单地址相同（发票标志）');
      const addressLines = [];
      if (selectedClient?.companyName) addressLines.push(selectedClient.companyName);
      if (selectedClient?.contactName) addressLines.push(selectedClient.contactName);
      if (selectedClient?.address) addressLines.push(selectedClient.address);
      const cityLine = [selectedClient?.postalCode, selectedClient?.city].filter(Boolean).join(' ');
      if (cityLine) addressLines.push(cityLine);
      if (selectedClient?.country) addressLines.push(selectedClient.country);

      return {
        hasDeliveryAddress: true,
        type: 'billing',
        label: '✓ Même adresse que la facturation',
        addressLines,
        address: addressLines.join('\n')  // 添加address字段供PDF渲染使用
      };
    }

    // 现有优先级：发票级别交付地址->客户账单地址->客户独立交付地址
    const hasInvoiceDeliveryAddress = !!(formData?.deliveryAddress || formData?.deliveryCity || formData?.deliveryPostalCode || formData?.deliveryCountry);
    if (hasInvoiceDeliveryAddress) {
      console.log('使用发票级别的交付地址');
      const addressLines = [];
      if (selectedClient?.companyName) addressLines.push(selectedClient.companyName);
      if (selectedClient?.contactName) addressLines.push(selectedClient.contactName);
      if (formData?.deliveryAddress) addressLines.push(formData.deliveryAddress);
      const cityLine = [formData?.deliveryPostalCode, formData?.deliveryCity].filter(Boolean).join(' ');
      if (cityLine) addressLines.push(cityLine);
      if (formData?.deliveryCountry) addressLines.push(formData.deliveryCountry);

      return {
        hasDeliveryAddress: true,
        type: 'invoice',
        label: '📦 Adresse de livraison',
        addressLines,
        address: addressLines.join('\n')  // 添加address字段供PDF渲染使用
      };
    }

    // 客户账单地址（如果客户设置了 sameAsAddress 或者独立交付地址缺失）
    const clientUseSameAddress = selectedClient?.sameAsAddress === true;
    if (clientUseSameAddress && hasClientBillingAddress) {
      console.log('客户设置交付地址同账单地址');
      const addressLines = [];
      if (selectedClient?.companyName) addressLines.push(selectedClient.companyName);
      if (selectedClient?.contactName) addressLines.push(selectedClient.contactName);
      if (selectedClient?.address) addressLines.push(selectedClient.address);
      const cityLine = [selectedClient?.postalCode, selectedClient?.city].filter(Boolean).join(' ');
      if (cityLine) addressLines.push(cityLine);
      if (selectedClient?.country) addressLines.push(selectedClient.country);

      return {
        hasDeliveryAddress: true,
        type: 'client_billing',
        label: '✓ Même adresse que la facturation',
        addressLines,
        address: addressLines.join('\n')  // 添加address字段供PDF渲染使用
      };
    }

    // 客户独立交付地址
    const hasClientDeliveryAddress = !!(selectedClient?.deliveryAddress || selectedClient?.deliveryCity || selectedClient?.deliveryPostalCode || selectedClient?.deliveryCountry);
    if (hasClientDeliveryAddress) {
      console.log('使用客户独立的交付地址');
      const addressLines = [];
      if (selectedClient?.companyName) addressLines.push(selectedClient.companyName);
      if (selectedClient?.contactName) addressLines.push(selectedClient.contactName);
      if (selectedClient?.deliveryAddress) addressLines.push(selectedClient.deliveryAddress);
      const cityLine = [selectedClient?.deliveryPostalCode, selectedClient?.deliveryCity].filter(Boolean).join(' ');
      if (cityLine) addressLines.push(cityLine);
      if (selectedClient?.deliveryCountry) addressLines.push(selectedClient.deliveryCountry);

      return {
        hasDeliveryAddress: true,
        type: 'client_delivery',
        label: '📦 Adresse de livraison',
        addressLines,
        address: addressLines.join('\n')  // 添加address字段供PDF渲染使用
      };
    }

    console.log('未找到可用的交付地址');
    return {
      hasDeliveryAddress: false,
      type: 'none',
      label: '📦 Adresse de livraison',
      addressLines: [],
      address: ''  // 添加address字段供PDF渲染使用
    };
  } catch (error) {
    console.error('获取交付地址错误:', error);
    return {
      hasDeliveryAddress: false,
      type: 'error',
      label: '📦 Adresse de livraison',
      addressLines: [],
      address: ''  // 添加address字段供PDF渲染使用
    };
  }
};

// 获取TVA信息显示文本 - 与InvoicePreview保持一致（修正豁免与自清算文案）
const getTVAInfoText = (invoiceMode, formData) => {
  if (invoiceMode !== 'fr') return '';

  // TVA豁免：优先使用前端填写的豁免说明，否则使用293 B默认文案
  if (formData.tvaExempt) {
    const clause = (formData.tvaExemptClause || '').trim();
    const clauseText = clause || "TVA non applicable, art. 293 B du CGI (régime de la franchise en base)";
    return `Statut TVA: ${clauseText}`;
  }

  // 自清算/反向征收
  if (formData.tvaSelfBilling || formData.autoLiquidation) {
    return "Statut TVA: Autoliquidation de la TVA par le preneur conformément à l'article 283-1 du Code général des impôts (CGI).";
  }

  // 标准TVA模式
  const vatNumber = formData.sellerVATNumber || formData.vatNumber || 'FR12345678901';
  return `Statut TVA: TVA applicable selon l'article 256 du Code général des impôts. Numéro de TVA intracommunautaire: ${vatNumber}`;
};

// PDF页面设置 - 优化为单页布局
const PAGE_CONFIG = {
  margin: 25,  // 减少边距从40到25
  size: 'A4',
  width: 595.28,  // A4 width in points
  height: 841.89, // A4 height in points
  contentWidth: 545.28, // width - 2*margin (更宽的内容区域)
  contentHeight: 791.89 // height - 2*margin (更高的内容区域)
};

// 颜色配置（黑白版）
const COLORS = {
  primary: '#000000',
  secondary: '#000000',
  accent: '#000000',
  background: '#FFFFFF',
  border: '#000000',
  text: '#000000'
};

// 字体大小配置 - 优化为更紧凑的布局
const FONT_SIZES = {
  title: 16,    // 从18减少到16
  subtitle: 12, // 从14减少到12
  heading: 10,  // 从12减少到10
  body: 9,      // 从10减少到9
  small: 8,     // 从9减少到8
  tiny: 7       // 从8减少到7
};

class PDFInvoiceGenerator {
  constructor() {
    this.doc = null;
    this.currentY = 0;
  }

  // 初始化PDF文档
  initializeDocument(invoiceNumber) {
    this.doc = new PDFDocument({
      margin: PAGE_CONFIG.margin,
      size: PAGE_CONFIG.size,
      info: {
        Title: `Facture ${invoiceNumber}`,
        Author: 'Invoice System',
        Subject: 'Facture',
        Keywords: 'facture, invoice, billing'
      }
    });

    // 注册支持中文字符的字体
    this.registerChineseFont();

    // 跟踪页面数量，拦截 addPage 以准确统计
    this.pageCount = 1;
    const originalAddPage = this.doc.addPage.bind(this.doc);
    this.doc.addPage = (...args) => {
      this.pageCount += 1;
      return originalAddPage(...args);
    };

    this.currentY = PAGE_CONFIG.margin;
    return this.doc;
  }

  // 注册中文字体
  registerChineseFont() {
    try {
      // 完全避免使用自定义字体，直接使用PDFKit内置字体
      console.log('使用PDFKit内置字体，避免字体子集问题');
      this.hasChineseFont = false; // 强制使用内置字体
    } catch (error) {
      console.error('字体注册过程出错:', error);
      this.hasChineseFont = false;
    }
  }

  // 获取字体名称 - 使用内置字体避免兼容性问题
  getFont(bold = false) {
    // 始终使用PDFKit内置字体，避免字体子集错误
    return bold ? 'Helvetica-Bold' : 'Helvetica';
  }

  // 添加公司信息部分 - 基于InvoicePreview的company-info
  addCompanyInfo(userData, x, y, width, invoiceMode = 'fr', currencyCode = 'EUR') {
    const startY = y;
    const mapped = mapCompanyLegalInfo(userData);
    
    // 公司标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Vendeur / Prestataire', x, y);
    
    y += 20;
    
    // 公司名称 - 修复：使用正确的字段映射
    const companyName = mapped.companyName;
    if (companyName) {
      this.doc.fontSize(FONT_SIZES.body)
             .fillColor(COLORS.text)
             .font(this.getFont(true))
             .text(companyName, x, y);
      y += 15;
    }
    
    // 公司地址 - 修复：使用正确的字段映射
    const address = mapped.address;
    if (address) {
      this.doc.fontSize(FONT_SIZES.body)
             .font(this.getFont())
             .text(address, x, y);
      y += 12;
    }
    
    // 城市和邮编 - 修复：使用正确的字段映射
    const city = mapped.city;
    const postalCode = mapped.postalCode;
    if (city || postalCode) {
      const cityLine = [postalCode, city].filter(Boolean).join(' ');
      this.doc.text(cityLine, x, y);
      y += 12;
     }
     
     // 电话号码 - 修复：使用正确的字段映射
    const phone = mapped.phone;
    if (phone) {
      this.doc.text(`Tél: ${phone}`, x, y);
      y += 12;
    }
    
    // 邮箱地址 - 修复：使用正确的字段映射
    const email = mapped.email;
    if (email) {
      this.doc.text(`Email: ${email}`, x, y);
      y += 12;
    }
    
    // VAT号码 - 修复：使用正确的字段映射
    const vatNumber = mapped.vatNumber;
    if (vatNumber) {
      this.doc.text(`N° TVA: ${vatNumber}`, x, y);
      y += 12;
    }
    
    // SIREN号码 - 修复：使用正确的字段映射
    const siren = mapped.siren;
    if (siren) {
      this.doc.text(`SIREN: ${siren}`, x, y);
      y += 12;
    }
    
    // SIRET号码 - 修复：使用正确的字段映射
    const siret = mapped.siret;
    if (siret) {
      this.doc.text(`SIRET: ${siret}`, x, y);
      y += 12;
    }
    
    // 法律形式 - 修复：使用正确的字段映射
    const legalForm = mapped.legalForm;
    if (legalForm) {
      this.doc.text(`Forme juridique: ${legalForm}`, x, y);
      y += 12;
    }
    
    // 注册资本 - 修复：使用正确的字段映射
    const registeredCapital = mapped.registeredCapital;
    if (registeredCapital) {
      this.doc.text(`Capital social: ${formatCurrencyUnified(registeredCapital, currencyCode, invoiceMode)}`, x, y);
      y += 12;
    }
    
    // RCS号码 - 修复：使用正确的字段映射
    const rcsNumber = mapped.rcsNumber;
    if (rcsNumber) {
      this.doc.text(`RCS: ${rcsNumber}`, x, y);
      y += 12;
    }
    
    // NAF代码
    if (mapped.nafCode) {
      this.doc.text(`Code NAF: ${mapped.nafCode}`, x, y);
      y += 12;
    }
    
    return y - startY; // 返回使用的高度
  }

  // 添加客户信息部分 - 基于InvoicePreview的client-info，分离账单地址和交付地址
  addClientInfo(selectedClient, x, y, width) {
    const startY = y;
    let currentY = y;
    
    // 检查是否有账单地址信息
    const hasClientBillingAddress = selectedClient?.address || selectedClient?.city || selectedClient?.postalCode || selectedClient?.country;
    
    if (!hasClientBillingAddress) {
      return 0; // 没有客户信息，返回0高度
    }
    
    // 账单地址标题 - 修复：移除emoji，使用纯文本
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Adresse de facturation', x, currentY);
    
    currentY += 15;  // 减少间距从20到15
    
    // 账单地址内容框
    const addressLines = [];
    
    // 公司名或个人姓名
    if (selectedClient.companyName) {
      addressLines.push(selectedClient.companyName);
    }
    
    // 联系人姓名
    if (selectedClient.contactName) {
      addressLines.push(`A l'attention de: ${selectedClient.contactName}`);
    }
    
    // 地址
    if (selectedClient.address) {
      // 清理地址中的特殊字符和乱码
      const cleanAddress = selectedClient.address.replace(/[^\w\s\-,.']/g, '');
      addressLines.push(cleanAddress);
    }
    
    // 城市和邮政编码
    if (selectedClient.city || selectedClient.postalCode) {
      const cityLine = [selectedClient.city, selectedClient.postalCode].filter(Boolean).join(', ');
      if (cityLine) {
        // 清理城市信息中的特殊字符
        const cleanCityLine = cityLine.replace(/[^\w\s\-,.']/g, '');
        addressLines.push(cleanCityLine);
      }
    }
    
    // 国家
    if (selectedClient.country) {
      addressLines.push(selectedClient.country);
    }
    
    // VAT号码
    if (selectedClient.vatNumber) {
      addressLines.push(`Numéro de TVA: ${selectedClient.vatNumber}`);
    }
    
    // 计算地址内容高度
    const addressText = addressLines.join('\n');
    const addressHeight = this.doc.heightOfString(addressText, {
      width: width - 30
    });
    
    // 背景与装饰移除，保持黑白简洁
    // 仅使用文本，无彩色背景与边框
    
    currentY += 10;
    
    // 账单地址文本
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont())
           .text(addressText, x + 15, currentY, {
             width: width - 30,
             align: 'left'
           });
    
    currentY += addressHeight + 15;
    
    return currentY - startY;
  }

  // 添加发票详情部分 - 基于InvoicePreview的invoice-details
  addInvoiceDetails(formData, invoiceNumber, invoiceMode, y) {
    const startY = y;
    const leftX = PAGE_CONFIG.margin;
    const rightX = PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth / 2;
    
    // 移除背景填充，保持黑白
    
    y += 15;
    
    // 左侧信息
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont(true));
    
    // 发票编号
    this.doc.text('N° de facture:', leftX + 15, y);
    this.doc.font(this.getFont())
           .text(invoiceNumber, leftX + 15, y + 12);
    
    // 发票日期
    this.doc.font(this.getFont(true))
           .text('Date de facture:', leftX + 15, y + 30);
    this.doc.font(this.getFont())
           .text(formatDate(formData.invoiceDate), leftX + 15, y + 42);
    
    // 右侧信息
    // 服务提供日期
    if (formData.serviceDate) {
      this.doc.font(this.getFont(true))
             .text('Date de prestation:', rightX, y);
      this.doc.font(this.getFont())
             .text(formatDate(formData.serviceDate), rightX, y + 12);
    }
    
    // 到期日期
    if (formData.dueDate) {
      this.doc.font(this.getFont(true))
             .text('Date d\'échéance:', rightX, y + 30);
      this.doc.font(this.getFont())
             .text(formatDate(formData.dueDate), rightX, y + 42);
    }
    
    return 95; // 固定高度
  }

  // 添加法国特定字段 - 基于InvoicePreview的french-specific-fields
  addFrenchSpecificFields(formData, invoiceMode, y) {
    if (invoiceMode !== 'fr') return 0;
    
    const startY = y;
    let currentY = y + 15;
    
    // 移除了订单参考和合同参考的显示，以简化发票界面
    
    return currentY - startY;
  }

  // 添加交付地址信息 - 基于InvoicePreview的逻辑，确保完全一致
  addDeliveryAddress(formData, selectedClient, invoiceMode, y) {
    console.log('=== addDeliveryAddress 调试 ===');
    console.log('invoiceMode:', invoiceMode);
    
    if (invoiceMode !== 'fr') {
      console.log('不是法国模式，跳过交付地址');
      return 0;
    }
    
    const deliveryInfo = getDeliveryAddress(formData, selectedClient);
    console.log('getDeliveryAddress返回:', deliveryInfo);
    
    if (!deliveryInfo.address) {
      console.log('没有交付地址，跳过');
      return 0;
    }
    
    console.log('开始添加交付地址到PDF');
    
    const startY = y;
    let currentY = y + 15;
    
    // 交付地址标题 - 黑白
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.text)
           .font(this.getFont(true))
           .text('Adresse de livraison', PAGE_CONFIG.margin, currentY);
    
    currentY += 20;
    
    // 使用addressLines数组逐行渲染，而不是合并后的address字符串
    const addressLines = deliveryInfo.addressLines || [];
    
    // 清理每行地址文本
    const cleanAddressLines = addressLines.map(line => 
      line.replace(/[^\x20-\x7E\u00C0-\u017F\u4e00-\u9fff]/g, '') // 只保留基本拉丁字符、扩展拉丁字符和中文字符
          .replace(/\s+/g, ' ') // 合并多个空格
          .trim()
    ).filter(line => line.length > 0); // 过滤空行
    
    // 计算总高度
    const lineHeight = 18;
    const totalAddressHeight = cleanAddressLines.length * lineHeight + 10;
    
    // 移除背景与装饰条，保持黑白
    
    currentY += 10;
    
    // 逐行渲染交付地址
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont());
    
    cleanAddressLines.forEach((line, index) => {
      this.doc.text(line, PAGE_CONFIG.margin + 15, currentY, {
        width: PAGE_CONFIG.contentWidth - 30,
        align: 'left'
      });
      currentY += lineHeight;
    });
    
    // 地址类型标签 - 清理标签文本
    if (deliveryInfo.label) {
      const cleanLabel = deliveryInfo.label
        .replace(/[^\x20-\x7E\u00C0-\u017F\u4e00-\u9fff]/g, '')
        .trim();
      
      if (cleanLabel) {
        currentY += 5;
        this.doc.fontSize(FONT_SIZES.small)
               .fillColor(COLORS.text)
               .font(this.getFont(true))
               .text(cleanLabel, PAGE_CONFIG.margin + 15, currentY);
        currentY += 15;
      }
    }
    
    console.log('交付地址添加完成，高度:', currentY - startY + 10);
    return currentY - startY + 10;
  }

  // 添加项目表格 - 基于InvoicePreview的items-table，确保完全一致
  addItemsTable(formData, y, invoiceMode = 'fr', currencyCode = 'EUR') {
    const startY = y;
    let currentY = y + 15;
    
    // 表格标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Détail des prestations', PAGE_CONFIG.margin, currentY);
    
    currentY += 25;
    
    // 表格配置 - 与InvoicePreview保持一致的列宽
    const tableX = PAGE_CONFIG.margin;
    const colWidths = {
      description: 220,  // 描述列
      quantity: 60,      // 数量列
      unitPrice: 90,     // 单价列
      tvaRate: 60,       // TVA率列
      total: 90          // 总计列
    };
    
    // 头部边框（黑白）
    this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, 25)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();
    
    // 头部文字 - 与InvoicePreview完全一致
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont(true));
    
    let colX = tableX + 8;
    this.doc.text('Description', colX, currentY + 8);
    colX += colWidths.description;
    this.doc.text('Qté', colX, currentY + 8, { align: 'center', width: colWidths.quantity });
    colX += colWidths.quantity;
    this.doc.text('Prix unitaire', colX, currentY + 8, { align: 'right', width: colWidths.unitPrice - 8 });
    colX += colWidths.unitPrice;
    this.doc.text('TVA', colX, currentY + 8, { align: 'center', width: colWidths.tvaRate });
    colX += colWidths.tvaRate;
    this.doc.text('Total HT', colX, currentY + 8, { align: 'right', width: colWidths.total - 8 });
    
    currentY += 25;
    
    // 表格内容 - 确保与InvoicePreview的计算逻辑一致
    // 修复：检查多个可能的数据源
    const items = formData.items || formData.InvoiceItems || [];
    console.log('PDF生成器 - 发票项目数据检查:');
    console.log('  formData.items存在:', !!formData.items, '长度:', formData.items?.length || 0);
    console.log('  formData.InvoiceItems存在:', !!formData.InvoiceItems, '长度:', formData.InvoiceItems?.length || 0);
    console.log('  最终使用的items长度:', items.length);
    
    if (items && items.length > 0) {
      items.forEach((item, index) => {
        // 计算项目总计 - 与InvoicePreview保持一致
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemTotal = quantity * unitPrice;
        const rowHeight = 24; // 将行高从30压缩到24，以减少分页并提升紧凑度
        
        // 行边框（黑白）
        this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, rowHeight)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
        
        // 行内容 - 改进对齐和格式
        this.doc.fontSize(FONT_SIZES.body)
               .fillColor(COLORS.text)
               .font(this.getFont());
        
        colX = tableX + 8;
        // 描述 - 支持多行文本
        const descriptionHeight = this.doc.heightOfString(item.description || '', {
          width: colWidths.description - 16
        });
        this.doc.text(item.description || '', colX, currentY + 8, {
          width: colWidths.description - 16,
          height: rowHeight - 16,
          ellipsis: true
        });
        
        colX += colWidths.description;
        // 数量 - 居中对齐，确保格式与InvoicePreview一致
        this.doc.text(quantity.toString(), colX, currentY + 8, { 
          align: 'center', 
          width: colWidths.quantity 
        });
        
        colX += colWidths.quantity;
        // 单价 - 右对齐，使用与InvoicePreview一致的货币格式
        this.doc.text(formatCurrencyUnified(unitPrice, currencyCode, invoiceMode), colX, currentY + 8, { 
          align: 'right', 
          width: colWidths.unitPrice - 8 
        });
        
        colX += colWidths.unitPrice;
        // TVA率 - 居中对齐，使用与InvoicePreview一致的百分比格式
        const tvaRate = parseFloat(item.tvaRate || item.taxRate) || 0;
        this.doc.text(formatPercentageUnified(tvaRate, invoiceMode), colX, currentY + 8, { 
          align: 'center', 
          width: colWidths.tvaRate 
        });
        
        colX += colWidths.tvaRate;
        // 总计 - 右对齐，加粗显示
        this.doc.font(this.getFont(true))
               .text(formatCurrencyUnified(itemTotal, currencyCode, invoiceMode), colX, currentY + 8, { 
                 align: 'right', 
                 width: colWidths.total - 8 
               });
        
        currentY += rowHeight;
      });
    }
    
    // 表格底部边框
    // 底部边框线（黑白）
    this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, 1)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();
    
    return currentY - startY + 10;
  }

  // 受限高度的项目表格渲染（支持续页与摘要）
  // options: { startIndex=0, maxHeight, showSummaryIfOverflow=true }
  addItemsTableLimited(formData, y, invoiceMode = 'fr', currencyCode = 'EUR', options = {}) {
    const startIndex = options.startIndex || 0;
    const maxHeight = options.maxHeight || 0;
    const showSummaryIfOverflow = options.showSummaryIfOverflow !== false;

    const startY = y;
    let currentY = y + 15;

    // 标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Détail des prestations', PAGE_CONFIG.margin, currentY);
    currentY += 25;

    const tableX = PAGE_CONFIG.margin;
    const colWidths = { description: 220, quantity: 60, unitPrice: 90, tvaRate: 60, total: 90 };

    // 头部（黑白边框，无填充）
    this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, 25).strokeColor(COLORS.border).lineWidth(1).stroke();

    this.doc.fontSize(FONT_SIZES.body).fillColor(COLORS.text).font(this.getFont(true));
    let colX = tableX + 8;
    this.doc.text('Description', colX, currentY + 8);
    colX += colWidths.description;
    this.doc.text('Qté', colX, currentY + 8, { align: 'center', width: colWidths.quantity });
    colX += colWidths.quantity;
    this.doc.text('Prix unitaire', colX, currentY + 8, { align: 'right', width: colWidths.unitPrice - 8 });
    colX += colWidths.unitPrice;
    this.doc.text('TVA', colX, currentY + 8, { align: 'center', width: colWidths.tvaRate });
    colX += colWidths.tvaRate;
    this.doc.text('Total HT', colX, currentY + 8, { align: 'right', width: colWidths.total - 8 });

    currentY += 25;

    const items = formData.items || formData.InvoiceItems || [];
    const rowHeight = 24;
    const headerAndFooter = 25 + 10; // 头部25 + 底部边框10
    const usableHeight = Math.max(0, maxHeight - (currentY - startY) - headerAndFooter);
    const maxRows = usableHeight > 0 ? Math.floor(usableHeight / rowHeight) : 0;

    let rendered = 0;
    const endIndex = Math.min(items.length, startIndex + maxRows);

    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = quantity * unitPrice;

      // 行边框（黑白）
      this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();

      this.doc.fontSize(FONT_SIZES.body).fillColor(COLORS.text).font(this.getFont());
      colX = tableX + 8;
      this.doc.text(item.description || '', colX, currentY + 8, {
        width: colWidths.description - 16,
        height: rowHeight - 16,
        ellipsis: true
      });
      colX += colWidths.description;
      this.doc.text(quantity.toString(), colX, currentY + 8, { align: 'center', width: colWidths.quantity });
      colX += colWidths.quantity;
      this.doc.text(formatCurrencyUnified(unitPrice, currencyCode, invoiceMode), colX, currentY + 8, { align: 'right', width: colWidths.unitPrice - 8 });
      colX += colWidths.unitPrice;
      const tvaRate = parseFloat(item.tvaRate || item.taxRate) || 0;
      this.doc.text(formatPercentageUnified(tvaRate, invoiceMode), colX, currentY + 8, { align: 'center', width: colWidths.tvaRate });
      colX += colWidths.tvaRate;
      this.doc.font(this.getFont(true)).text(formatCurrencyUnified(itemTotal, currencyCode, invoiceMode), colX, currentY + 8, { align: 'right', width: colWidths.total - 8 });

      currentY += rowHeight;
      rendered += 1;
    }

    // 底部边框（黑白）
    this.doc.rect(tableX, currentY, PAGE_CONFIG.contentWidth, 1).strokeColor(COLORS.border).lineWidth(1).stroke();

    const overflowCount = items.length - endIndex;
    if (overflowCount > 0 && showSummaryIfOverflow) {
      this.doc.fontSize(FONT_SIZES.small).fillColor(COLORS.text).font(this.getFont(true));
      this.doc.text(`+ ${overflowCount} lignes supplémentaires`, PAGE_CONFIG.margin, currentY + 6);
      currentY += 18;
    }

    return {
      height: currentY - startY + 10,
      nextIndex: endIndex,
      renderedCount: rendered,
      overflowCount
    };
  }

  // 添加总计部分 - 基于InvoicePreview的totals-section，确保计算逻辑完全一致
  addTotalsSection(formData, y, invoiceMode = 'fr', currencyCode = 'EUR') {
    const startY = y;
    let currentY = y + 30;
    
    // 计算总计 - 与InvoicePreview的计算逻辑完全一致
    const items = formData.items || formData.InvoiceItems || [];
    let subtotal = 0;
    let totalTVA = 0;
    
    // 按TVA率分组计算 - 与InvoicePreview保持一致
    const tvaGroups = {};
    
    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = quantity * unitPrice;
      const tvaRate = parseFloat(item.tvaRate || item.taxRate) || 0;
      
      subtotal += itemTotal;
      
      // 按TVA率分组
      if (!tvaGroups[tvaRate]) {
        tvaGroups[tvaRate] = {
          rate: tvaRate,
          base: 0,
          amount: 0
        };
      }
      
      tvaGroups[tvaRate].base += itemTotal;
      tvaGroups[tvaRate].amount += itemTotal * (tvaRate / 100);
      totalTVA += itemTotal * (tvaRate / 100);
    });
    
    const totalTTC = subtotal + totalTVA;
    
    // 总计区域配置
    const totalsX = PAGE_CONFIG.contentWidth - 200;
    const labelWidth = 120;
    const valueWidth = 80;
    
    // 边框（黑白），移除背景填充
    const totalsHeight = Object.keys(tvaGroups).length * 25 + 100;
    this.doc.rect(totalsX, currentY - 10, 200, totalsHeight)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();
    
    // 小计 - 与InvoicePreview格式一致
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont());
    
    this.doc.text('Sous-total HT :', totalsX + 10, currentY, { width: labelWidth });
    this.doc.text(formatCurrencyUnified(subtotal, currencyCode, invoiceMode), totalsX + labelWidth, currentY, { 
      width: valueWidth, 
      align: 'right' 
    });
    
    currentY += 25;
    
    // TVA详细信息 - 按税率分组显示，与InvoicePreview一致
    Object.values(tvaGroups).forEach(group => {
      if (group.rate > 0) {
        this.doc.text(`TVA ${formatPercentageUnified(group.rate, invoiceMode)} :`, totalsX + 10, currentY, { width: labelWidth });
        this.doc.text(formatCurrencyUnified(group.amount, currencyCode, invoiceMode), totalsX + labelWidth, currentY, { 
          width: valueWidth, 
          align: 'right' 
        });
        currentY += 20;
      }
    });
    
    // 分隔线
    this.doc.moveTo(totalsX + 10, currentY + 5)
           .lineTo(totalsX + 190, currentY + 5)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();
    
    currentY += 15;
    
    // 总计 TTC - 加粗显示，与InvoicePreview样式一致
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true));
    
    this.doc.text('Total TTC :', totalsX + 10, currentY, { width: labelWidth });
    this.doc.text(formatCurrencyUnified(totalTTC, currencyCode, invoiceMode), totalsX + labelWidth, currentY, { 
      width: valueWidth, 
      align: 'right' 
    });
    
    return currentY - startY + 40;
  }

  // 计算总计区域高度（用于预算和定位）
  computeTotalsHeight(formData, invoiceMode = 'fr') {
    const items = formData.items || formData.InvoiceItems || [];
    const tvaGroups = {};
    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = quantity * unitPrice;
      const tvaRate = parseFloat(item.tvaRate || item.taxRate) || 0;
      if (!tvaGroups[tvaRate]) {
        tvaGroups[tvaRate] = { rate: tvaRate, base: 0, amount: 0 };
      }
      tvaGroups[tvaRate].base += itemTotal;
      tvaGroups[tvaRate].amount += itemTotal * (tvaRate / 100);
    });
    const totalsHeight = Object.keys(tvaGroups).length * 25 + 100;
    return totalsHeight;
  }

  // 第二页底部的银行与TVA紧凑信息块
  addBankAndTVACompactSecondPage(invoiceMode, formData, userData, y, maxHeight) {
    if (invoiceMode !== 'fr') return 0;

    const tvaInfo = getTVAInfoText(invoiceMode, formData);
    const bankInfo = userData.Company?.bankInfo || {};
    const showBank = !!(bankInfo.iban || bankInfo.bic || bankInfo.bankName || bankInfo.accountHolder);
    if (!tvaInfo && !showBank) return 0;

    const startY = y;
    let currentY = y;

    const columnGap = 20;
    const columnWidth = (PAGE_CONFIG.contentWidth - columnGap) / 2;
    const leftX = PAGE_CONFIG.margin;
    const rightX = PAGE_CONFIG.margin + columnWidth + columnGap;

    const tvaHeight = tvaInfo ? this.doc.heightOfString(tvaInfo, { width: columnWidth - 20 }) + 28 : 0;
    const bankLines = [];
    if (showBank) {
      bankLines.push(`${getFrenchLabel('bankInformation')}`);
      if (bankInfo.iban) bankLines.push(`IBAN: ${bankInfo.iban}`);
      if (bankInfo.bic) bankLines.push(`BIC: ${bankInfo.bic}`);
      if (bankInfo.bankName) bankLines.push(`Banque: ${bankInfo.bankName}`);
      if (bankInfo.accountHolder) bankLines.push(`Titulaire: ${bankInfo.accountHolder}`);
    }
    const bankLineHeight = 12;
    let bankHeight = bankLines.length > 0 ? (bankLines.length * bankLineHeight + 18) : 0;

    // 限制高度：如果空间不足，仅展示 IBAN/BIC 两行
    const containerHeight = Math.min(Math.max(tvaHeight, bankHeight) + 20, maxHeight || (PAGE_CONFIG.contentHeight * 0.2));
    if (bankHeight > containerHeight - 20) {
      const compactBank = [];
      compactBank.push(`${getFrenchLabel('bankInformation')}`);
      if (bankInfo.iban) compactBank.push(`IBAN: ${bankInfo.iban}`);
      if (bankInfo.bic) compactBank.push(`BIC: ${bankInfo.bic}`);
      // 使用紧凑版
      bankHeight = compactBank.length * bankLineHeight + 18;
      bankLines.splice(0, bankLines.length, ...compactBank);
    }

    // 容器边框（黑白），移除背景填充
    this.doc.rect(PAGE_CONFIG.margin, currentY, PAGE_CONFIG.contentWidth, containerHeight)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();

    // 左列：TVA
    if (tvaInfo) {
      this.doc.fontSize(FONT_SIZES.subtitle).fillColor(COLORS.text).font(this.getFont(true)).text('Information TVA', leftX + 10, currentY + 8);
      this.doc.fontSize(FONT_SIZES.body).fillColor(COLORS.text).font(this.getFont()).text(tvaInfo, leftX + 10, currentY + 25, { width: columnWidth - 20 });
    }

    // 右列：银行
    if (bankLines.length > 0) {
      this.doc.fontSize(FONT_SIZES.subtitle).fillColor(COLORS.primary).font(this.getFont(true)).text(getFrenchLabel('bankInformation'), rightX + 10, currentY + 8);
      this.doc.fontSize(FONT_SIZES.body).fillColor(COLORS.text).font(this.getFont());
      let by = currentY + 25;
      bankLines.forEach(line => {
        this.doc.text(line, rightX + 10, by, { width: columnWidth - 20 });
        by += bankLineHeight;
      });
    }

    return containerHeight + 8;
  }

  // 添加法国法律条款 - 基于InvoicePreview的legal-clauses
  // 添加压缩版法律条款 - 优化为单页显示
  addFrenchLegalClausesCompact(invoiceMode, formData, clientData, y) {
    if (invoiceMode !== 'fr') return 0;
    
    const startY = y;
    let currentY = y + 15;  // 减少顶部间距
    
    // 法律条款标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Conditions légales', PAGE_CONFIG.margin, currentY);
    
    currentY += 15;  // 减少标题后间距
    
    // 获取付款期限，默认30天
    const paymentTerms = formData.paymentTerms || '30 jours';
    // 判断是否为专业客户（B2B）
    const isProfessional = !!(
      formData?.isProfessional ||
      formData?.clientType === 'professionnel' ||
      formData?.customerType === 'professionnel' ||
      clientData?.isProfessional ||
      clientData?.clientType === 'professionnel' ||
      clientData?.type === 'professionnel' ||
      clientData?.isCompany ||
      clientData?.vatNumber
    );
    
    // 压缩版法律条款内容 - 合并相关条款，使用更小字体
    const paymentClause = isProfessional
      ? `Conditions de paiement: Paiement à ${paymentTerms}. En cas de retard, des pénalités de retard au taux de 3 fois le taux d'intérêt légal en vigueur seront appliquées de plein droit, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (articles L441-10 et D441-5 du Code de commerce).`
      : `Conditions de paiement: Paiement à ${paymentTerms}. En cas de retard, des pénalités de retard peuvent être appliquées conformément à la loi. L'indemnité forfaitaire de 40€ pour frais de recouvrement ne s'applique pas aux consommateurs.`;

    const compactLegalText = `Identité du prestataire: Le prestataire certifie l'exactitude des informations figurant sur cette facture conformément à l'article 289 du Code général des impôts. ${paymentClause} Clause de réserve de propriété: Les marchandises demeurent la propriété du vendeur jusqu'au paiement intégral (loi n°80-335 du 12 mai 1980). Garantie de conformité: Prestations conformes aux règles de l'art. Réclamations sous 8 jours. Vices cachés: Garantie selon articles 1641-1649 du Code civil. Règlement des litiges: Tribunaux compétents du ressort du siège social. Droit français applicable. Protection des données: Traitement conforme RGPD. Droits d'accès, rectification, suppression. Délai de prescription: 5 ans selon l'article L110-4 du Code de commerce.`;
    
    this.doc.fontSize(FONT_SIZES.tiny)  // 使用最小字体
           .fillColor(COLORS.text)
           .font(this.getFont())
           .text(compactLegalText, PAGE_CONFIG.margin, currentY, {
             width: PAGE_CONFIG.contentWidth,
             align: 'justify',
             lineGap: 2  // 减少行间距
           });
    
    const textHeight = this.doc.heightOfString(compactLegalText, {
      width: PAGE_CONFIG.contentWidth,
      lineGap: 2
    });
    
    return textHeight + 20;  // 返回使用的总高度
  }

  // 保留原始法律条款函数 - 改进版本，优化分页逻辑
  addFrenchLegalClauses(invoiceMode, formData, clientData, y) {
    if (invoiceMode !== 'fr') return 0;
    
    const startY = y;
    let currentY = y;
    
    // 计算当前页面剩余空间
    const remainingSpace = PAGE_CONFIG.height - PAGE_CONFIG.margin - currentY;
    const titleHeight = 25;
    
    // 如果当前页面剩余空间足够放置标题和至少2个条款，则在当前页开始
    // 否则直接新建页面
    if (remainingSpace < titleHeight + 120) { // 至少需要标题+2个条款的空间
      this.doc.addPage();
      currentY = PAGE_CONFIG.margin;
    }
    
    // 法律条款标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Conditions légales', PAGE_CONFIG.margin, currentY);
    
    currentY += 25;
    
    // 获取付款期限，默认30天
    const paymentTerms = formData.paymentTerms || '30 jours';
    // 判断是否为专业客户（B2B）
    const isProfessional = !!(
      formData?.isProfessional ||
      formData?.clientType === 'professionnel' ||
      formData?.customerType === 'professionnel' ||
      clientData?.isProfessional ||
      clientData?.clientType === 'professionnel' ||
      clientData?.type === 'professionnel' ||
      clientData?.isCompany ||
      clientData?.vatNumber
    );
    
    // 法律条款内容 - 更完整的法国法律要求
    const legalClauses = [
      {
        title: "Identité du prestataire",
        content: "Le prestataire certifie l'exactitude des informations figurant sur cette facture conformément à l'article 289 du Code général des impôts. Toutes les mentions légales obligatoires sont présentes sur cette facture."
      },
      {
        title: "Conditions de paiement",
        content: isProfessional
          ? `Paiement à ${paymentTerms}. En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal en vigueur seront appliquées de plein droit, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (articles L441-10 et D441-5 du Code de commerce).`
          : `Paiement à ${paymentTerms}. En cas de retard de paiement, des pénalités de retard peuvent être appliquées conformément à la loi. L'indemnité forfaitaire de 40€ pour frais de recouvrement ne s'applique pas aux consommateurs.`
      },
      {
        title: "Clause de réserve de propriété",
        content: "Les marchandises demeurent la propriété du vendeur jusqu'au paiement intégral du prix, conformément à la loi n°80-335 du 12 mai 1980. Le défaut de paiement à l'échéance rend exigible l'intégralité des sommes dues."
      },
      {
        title: "Garantie de conformité", 
        content: "Les prestations sont réalisées conformément aux règles de l'art et aux normes en vigueur. Le prestataire garantit la conformité de ses prestations aux spécifications convenues. Toute réclamation doit être formulée par écrit dans les 8 jours suivant la livraison."
      },
      {
        title: "Vices cachés",
        content: "Conformément aux articles 1641 à 1649 du Code civil, le prestataire est tenu de la garantie à raison des défauts cachés qui rendent la chose impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise."
      },
      {
        title: "Règlement des litiges",
        content: "Tout litige relatif à l'interprétation et à l'exécution des présentes sera soumis aux tribunaux compétents du ressort du siège social du prestataire. Le droit français est seul applicable."
      },
      {
        title: "Protection des données",
        content: "Conformément au RGPD et à la loi Informatique et Libertés, les données personnelles collectées sont traitées pour les besoins de la relation commerciale. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données."
      },
      {
        title: "Délai de prescription",
        content: "Conformément à l'article L110-4 du Code de commerce, toute action judiciaire relative aux obligations nées du présent contrat se prescrit par 5 ans à compter de la naissance de l'obligation."
      }
    ];
    
    this.doc.fontSize(FONT_SIZES.small)
           .fillColor(COLORS.text)
           .font(this.getFont());
    
    legalClauses.forEach((clause, index) => {
      // 计算当前条款所需的高度
      const titleHeight = 15;
      const contentHeight = this.doc.heightOfString(clause.content, {
        width: PAGE_CONFIG.contentWidth
      });
      const clauseHeight = titleHeight + contentHeight + 15; // 包括间距
      
      // 检查是否需要新页面
      if (currentY + clauseHeight > PAGE_CONFIG.height - PAGE_CONFIG.margin) {
        this.doc.addPage();
        currentY = PAGE_CONFIG.margin;
      }
      
      // 条款标题
      this.doc.font(this.getFont(true))
             .text(`${clause.title}:`, PAGE_CONFIG.margin, currentY);
      currentY += titleHeight;
      
      // 条款内容
      this.doc.font(this.getFont())
             .text(clause.content, PAGE_CONFIG.margin, currentY, {
               width: PAGE_CONFIG.contentWidth,
               align: 'justify'
             });
      
      currentY += contentHeight + 15; // 添加条款间距
    });
    
    return currentY - startY;
  }

  // 全量法律条款的双列压缩布局（不新增页面）
  // 在当前页面剩余高度内以两列排版完整条款，避免产生第三页
  addFrenchLegalClausesTwoColumn(invoiceMode, formData, clientData, y, maxHeight) {
    if (invoiceMode !== 'fr') return 0;

    const startY = y;
    let currentY = y;

    // 标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text('Conditions légales', PAGE_CONFIG.margin, currentY);

    currentY += 15;

    const paymentTerms = formData.paymentTerms || '30 jours';
    const isProfessional = !!(
      formData?.isProfessional ||
      formData?.clientType === 'professionnel' ||
      formData?.customerType === 'professionnel' ||
      clientData?.isProfessional ||
      clientData?.clientType === 'professionnel' ||
      clientData?.type === 'professionnel' ||
      clientData?.isCompany ||
      clientData?.vatNumber
    );

    const legalClauses = [
      {
        title: "Identité du prestataire",
        content: "Le prestataire certifie l'exactitude des informations figurant sur cette facture conformément à l'article 289 du Code général des impôts. Toutes les mentions légales obligatoires sont présentes sur cette facture."
      },
      {
        title: "Conditions de paiement",
        content: isProfessional
          ? `Paiement à ${paymentTerms}. En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal en vigueur seront appliquées de plein droit, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (articles L441-10 et D441-5 du Code de commerce).`
          : `Paiement à ${paymentTerms}. En cas de retard de paiement, des pénalités de retard peuvent être appliquées conformément à la loi. L'indemnité forfaitaire de 40€ pour frais de recouvrement ne s'applique pas aux consommateurs.`
      },
      {
        title: "Clause de réserve de propriété",
        content: "Les marchandises demeurent la propriété du vendeur jusqu'au paiement intégral du prix, conformément à la loi n°80-335 du 12 mai 1980. Le défaut de paiement à l'échéance rend exigible l'intégralité des sommes dues."
      },
      {
        title: "Garantie de conformité",
        content: "Les prestations sont réalisées conformément aux règles de l'art et aux normes en vigueur. Le prestataire garantit la conformité de ses prestations aux spécifications convenues. Toute réclamation doit être formulée par écrit dans les 8 jours suivant la livraison."
      },
      {
        title: "Vices cachés",
        content: "Conformément aux articles 1641 à 1649 du Code civil, le prestataire est tenu de la garantie à raison des défauts cachés qui rendent la chose impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise."
      },
      {
        title: "Règlement des litiges",
        content: "Tout litige relatif à l'interprétation et à l'exécution des présentes sera soumis aux tribunaux compétents du ressort du siège social du prestataire. Le droit français est seul applicable."
      },
      {
        title: "Protection des données",
        content: "Conformément au RGPD et à la loi Informatique et Libertés, les données personnelles collectées sont traitées pour les besoins de la relation commerciale. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données."
      },
      {
        title: "Délai de prescription",
        content: "Conformément à l'article L110-4 du Code de commerce, toute action judiciaire relative aux obligations nées du présent contrat se prescrit par 5 ans à compter de la naissance de l'obligation."
      }
    ];

    // 两列参数
    const columnGap = 20;
    const columnWidth = (PAGE_CONFIG.contentWidth - columnGap) / 2;
    const leftX = PAGE_CONFIG.margin;
    const rightX = PAGE_CONFIG.margin + columnWidth + columnGap;

    // 计算当前页面可用高度
    const availableHeight = typeof maxHeight === 'number' && maxHeight > 0
      ? maxHeight
      : (PAGE_CONFIG.height - PAGE_CONFIG.margin - currentY);

    // 列起始Y
    let colYLeft = currentY;
    let colYRight = currentY;
    const colMaxHeight = availableHeight;

    // 写入工具：在给定列中尽量写入标题 + 内容，返回剩余未写内容
    const writeClauseInColumn = (x, y, width, title, content) => {
      let used = 0;

      // 标题（使用 small）
      this.doc.fontSize(FONT_SIZES.small)
             .fillColor(COLORS.text)
             .font(this.getFont(true));
      const tHeight = this.doc.heightOfString(`${title}:`, { width });

      // 内容（使用 tiny，紧凑行距）
      this.doc.font(this.getFont());
      this.doc.fontSize(FONT_SIZES.tiny);
      const options = { width, align: 'justify', lineGap: 1.5 };
      const cHeightFull = this.doc.heightOfString(content, options);

      const totalHeight = tHeight + cHeightFull + 8;
      const remaining = colMaxHeight - (y - currentY);

      if (totalHeight <= remaining) {
        // 全部写入
        this.doc.font(this.getFont(true)).text(`${title}:`, x, y, { width });
        y += tHeight;
        this.doc.font(this.getFont()).text(content, x, y, options);
        used = totalHeight;
        return { usedHeight: used, leftover: '' };
      }

      // 只能写入部分内容：按词逐步拟合到剩余高度
      const words = content.split(/\s+/);
      let fitText = '';
      let leftoverText = content;
      let lastMeasured = 0;

      // 先写标题
      if (tHeight <= remaining) {
        this.doc.font(this.getFont(true)).text(`${title}:`, x, y, { width });
        y += tHeight;
        used += tHeight;
      } else {
        // 标题也放不下，直接返回（剩余高度太小）
        return { usedHeight: used, leftover: `${title}: ${content}` };
      }

      // 拟合内容
      this.doc.font(this.getFont());
      this.doc.fontSize(FONT_SIZES.tiny);
      for (let i = 0; i < words.length; i++) {
        const test = (fitText ? fitText + ' ' : '') + words[i];
        const h = this.doc.heightOfString(test, options);
        if (used + h > remaining) {
          // 不能再加了
          leftoverText = words.slice(i).join(' ');
          break;
        }
        fitText = test;
        lastMeasured = h;
      }

      if (fitText) {
        this.doc.text(fitText, x, y, options);
        used += lastMeasured;
      }

      return { usedHeight: used, leftover: leftoverText };
    };

    // 将条款流式写入左右列，不新增页面
    let pending = legalClauses.map(c => ({ ...c }));
    let leftoverOccurred = false;
    // 左列
    for (let i = 0; i < pending.length; i++) {
      const { title, content } = pending[i];
      const { usedHeight, leftover } = writeClauseInColumn(leftX, colYLeft, columnWidth, title, content);
      colYLeft += usedHeight + 6; // 小间距
      if (leftover) {
        // 将剩余内容继续放到右列
        pending[i].content = leftover;
        // 剩余+后续条款全部转到右列处理
        pending = pending.slice(i);
        leftoverOccurred = true;
        break;
      }
    }
    // 如果左列已完整写入所有条款，则右列不再重复写入
    if (!leftoverOccurred) {
      pending = [];
    }

    // 右列
    for (let i = 0; i < pending.length; i++) {
      const { title, content } = pending[i];
      const { usedHeight, leftover } = writeClauseInColumn(rightX, colYRight, columnWidth, title, content);
      colYRight += usedHeight + 6;
      if (leftover) {
        // 超出右列的部分将被截断（不新增页面），但我们保留完整文本的尝试
        // 为保持合规，请确保填写的常规信息不会占用过多空间
        break;
      }
    }

    // 返回占用高度（按两列最大值计算）
    const usedHeightTotal = Math.max(colYLeft, colYRight) - startY;
    return usedHeightTotal;
  }

  // 添加TVA信息 - 基于InvoicePreview的tva-info
  addTVAInfo(invoiceMode, formData, y) {
    if (invoiceMode !== 'fr') return 0;
    
    const tvaInfo = getTVAInfoText(invoiceMode, formData);
    if (!tvaInfo) return 0;
    
    const startY = y;
    let currentY = y + 15;
    
    // 添加边框（黑白），移除背景填充
    this.doc.rect(PAGE_CONFIG.margin, currentY - 5, PAGE_CONFIG.contentWidth, 50)
           .strokeColor(COLORS.border)
           .lineWidth(1)
           .stroke();
    
    // TVA信息标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.text)
           .font(this.getFont(true))
           .text('Information TVA', PAGE_CONFIG.margin + 10, currentY + 5);
    
    currentY += 15;  // 减少间距从20到15
    
    // TVA声明内容
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont())
           .text(tvaInfo, PAGE_CONFIG.margin + 10, currentY, {
             width: PAGE_CONFIG.contentWidth - 20
           });
    
    const textHeight = this.doc.heightOfString(tvaInfo, {
      width: PAGE_CONFIG.contentWidth - 20
    });
    
    return Math.max(50, textHeight + 30);
  }

  // 添加银行信息 - 基于InvoicePreview的bank-info
  addBankInfo(userData, invoiceMode, y) {
    if (invoiceMode !== 'fr') return 0;
    
    const bankInfo = userData.Company?.bankInfo;
    // 显示银行信息的条件：只要存在任一字段即可（iban/bic/bankName/accountHolder）
    if (!bankInfo) return 0;
    const hasAnyBankField = !!(bankInfo.iban || bankInfo.bic || bankInfo.bankName || bankInfo.accountHolder);
    if (!hasAnyBankField) return 0;
    
    const startY = y;
    let currentY = y + 15;  // 减少间距从20到15
    
    // 银行信息标题
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text(getFrenchLabel('bankInformation'), PAGE_CONFIG.margin, currentY);
    
    currentY += 15;  // 减少间距从20到15
    
    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont());
    
    // IBAN
    if (bankInfo.iban) {
      this.doc.font(this.getFont(true))
             .text('IBAN:', PAGE_CONFIG.margin, currentY);
      this.doc.font(this.getFont())
             .text(bankInfo.iban, PAGE_CONFIG.margin + 50, currentY);
      currentY += 12;  // 减少间距从15到12
    }
    
    // BIC
    if (bankInfo.bic) {
      this.doc.font(this.getFont(true))
             .text('BIC:', PAGE_CONFIG.margin, currentY);
      this.doc.font(this.getFont())
             .text(bankInfo.bic, PAGE_CONFIG.margin + 50, currentY);
      currentY += 12;  // 减少间距从15到12
    }
    
    // 银行名称
    if (bankInfo.bankName) {
      this.doc.font(this.getFont(true))
             .text('Banque:', PAGE_CONFIG.margin, currentY);
      this.doc.font(this.getFont())
             .text(bankInfo.bankName, PAGE_CONFIG.margin + 50, currentY);
      currentY += 12;  // 减少间距从15到12
    }
    
    // 账户持有人
    if (bankInfo.accountHolder) {
      this.doc.font(this.getFont(true))
             .text('Titulaire:', PAGE_CONFIG.margin, currentY);
      this.doc.font(this.getFont())
             .text(bankInfo.accountHolder, PAGE_CONFIG.margin + 50, currentY);
      currentY += 12;  // 减少间距从15到12
    }
    
    return currentY - startY;
  }

  // 合并支付与银行信息到首页的紧凑区块（两列布局）
  addPaymentAndBankSection(invoiceMode, formData, userData, y) {
    if (invoiceMode !== 'fr') return 0;

    const tvaInfo = getTVAInfoText(invoiceMode, formData);
    const bankInfo = userData.Company?.bankInfo || {};
    const showBank = !!(bankInfo.iban || bankInfo.bic || bankInfo.bankName || bankInfo.accountHolder);
    if (!tvaInfo && !showBank) return 0;

    const startY = y;
    let currentY = y + 10;

    const columnGap = 20;
    const columnWidth = (PAGE_CONFIG.contentWidth - columnGap) / 2;
    const leftX = PAGE_CONFIG.margin;
    const rightX = PAGE_CONFIG.margin + columnWidth + columnGap;

    // 计算左右列高度
    const tvaTextHeight = tvaInfo
      ? this.doc.heightOfString(tvaInfo, { width: columnWidth - 20 })
      : 0;

    const bankLines = [];
    if (showBank) {
      bankLines.push(`${getFrenchLabel('bankInformation')}`);
      if (bankInfo.iban) bankLines.push(`IBAN: ${bankInfo.iban}`);
      if (bankInfo.bic) bankLines.push(`BIC: ${bankInfo.bic}`);
      if (bankInfo.bankName) bankLines.push(`Banque: ${bankInfo.bankName}`);
      if (bankInfo.accountHolder) bankLines.push(`Titulaire: ${bankInfo.accountHolder}`);
    }
    const bankLineHeight = 12;
    const bankHeight = bankLines.length > 0 ? (bankLines.length * bankLineHeight + 10) : 0;

    const containerHeight = Math.max(tvaTextHeight + 30, bankHeight + 30);

    // 容器背景
    this.doc.rect(PAGE_CONFIG.margin, currentY - 5, PAGE_CONFIG.contentWidth, containerHeight)
           .fillColor('#f8fafc')
           .fill()
           .strokeColor('#e9ecef')
           .lineWidth(1)
           .stroke();

    // 左列：Information TVA
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor('#1976d2')
           .font(this.getFont(true))
           .text('Information TVA', leftX + 10, currentY + 5);

    if (tvaInfo) {
      this.doc.fontSize(FONT_SIZES.body)
             .fillColor('#1565c0')
             .font(this.getFont())
             .text(tvaInfo, leftX + 10, currentY + 22, { width: columnWidth - 20 });
    }

    // 右列：Informations bancaires
    this.doc.fontSize(FONT_SIZES.subtitle)
           .fillColor(COLORS.primary)
           .font(this.getFont(true))
           .text(getFrenchLabel('bankInformation'), rightX + 10, currentY + 5);

    this.doc.fontSize(FONT_SIZES.body)
           .fillColor(COLORS.text)
           .font(this.getFont());

    let by = currentY + 22;
    bankLines.forEach(line => {
      this.doc.text(line, rightX + 10, by, { width: columnWidth - 20 });
      by += bankLineHeight;
    });

    return containerHeight + 10;
  }

  // 生成完整的PDF发票
  async generateInvoicePDF(invoiceData, userData, clientData, invoiceMode = 'fr') {
    return new Promise((resolve, reject) => {
      try {
        const invoiceNumber = generateInvoiceNumber(invoiceData, invoiceMode);
        const selectedClient = clientData;
        const currencyCode = invoiceData.currency || userData?.Company?.currency || 'EUR';
        
        // 初始化文档
        this.initializeDocument(invoiceNumber);
        
        let currentY = PAGE_CONFIG.margin;
        
        // 1. 头部信息（公司和客户信息）
        const companyHeight = this.addCompanyInfo(userData, PAGE_CONFIG.margin, currentY, PAGE_CONFIG.contentWidth / 2 - 10, invoiceMode, currencyCode);
        const clientHeight = this.addClientInfo(selectedClient, PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth / 2 + 10, currentY, PAGE_CONFIG.contentWidth / 2 - 10);
        
        currentY += Math.max(companyHeight, clientHeight) + 20;  // 减少间距从30到20
        
        // 2. 发票详情
        const detailsHeight = this.addInvoiceDetails(invoiceData, invoiceNumber, invoiceMode, currentY);
        currentY += detailsHeight + 15;  // 减少间距从20到15
        
        // 3. 法国特定字段
        const frenchFieldsHeight = this.addFrenchSpecificFields(invoiceData, invoiceMode, currentY);
        currentY += frenchFieldsHeight;
        
        // 4. 交付地址
        const deliveryHeight = this.addDeliveryAddress(invoiceData, selectedClient, invoiceMode, currentY);
        currentY += deliveryHeight;
        
        // 5. 首页Items受限渲染（为Totals预留空间）
        const reservedTotalsHeight = this.computeTotalsHeight(invoiceData, invoiceMode) + 20;
        const availableHeightPage1 = PAGE_CONFIG.height - PAGE_CONFIG.margin - currentY;
        const itemsMaxHeightPage1 = Math.max(0, availableHeightPage1 - reservedTotalsHeight);
        const itemsLimitedResult = this.addItemsTableLimited(
          invoiceData,
          currentY,
          invoiceMode,
          currencyCode,
          { startIndex: 0, maxHeight: itemsMaxHeightPage1, showSummaryIfOverflow: false }
        );
        currentY += itemsLimitedResult.height;
        
        // 6. 总计固定在首页底部
        const totalsHeightEstimate = this.computeTotalsHeight(invoiceData, invoiceMode);
        const totalsY = PAGE_CONFIG.height - PAGE_CONFIG.margin - (totalsHeightEstimate + 10);
        const totalsHeight = this.addTotalsSection(invoiceData, totalsY, invoiceMode, currencyCode);
        currentY = totalsY + totalsHeight;

        // 7. 第二页：Items续页 + 法律条款 + 银行/TVA（紧凑）
        let nextIndex = itemsLimitedResult.nextIndex;
        const totalItemsCount = (invoiceData.items?.length || invoiceData.InvoiceItems?.length || 0);
        if (nextIndex < totalItemsCount) {
          if (this.pageCount === 1) {
            this.doc.addPage();
            currentY = PAGE_CONFIG.margin;
          }
          const itemsMaxHeightPage2 = Math.floor(PAGE_CONFIG.contentHeight * 0.45);
          const itemsLimitedPage2 = this.addItemsTableLimited(
            invoiceData,
            currentY,
            invoiceMode,
            currencyCode,
            { startIndex: nextIndex, maxHeight: itemsMaxHeightPage2, showSummaryIfOverflow: true }
          );
          currentY += itemsLimitedPage2.height;
          nextIndex = itemsLimitedPage2.nextIndex;
        } else if (this.pageCount === 1) {
          // 无续页Items但仍在第一页时，进入第二页用于法律条款
          this.doc.addPage();
          currentY = PAGE_CONFIG.margin;
        }

        // 法律条款：两列完整文本，预留底部20%用于银行/TVA
        const remainingHeight = PAGE_CONFIG.height - PAGE_CONFIG.margin - currentY;
        const bankTvaReserve = Math.floor(PAGE_CONFIG.contentHeight * 0.2);
        const legalMaxHeight = Math.max(0, remainingHeight - bankTvaReserve - 10);
        const legalHeight = this.addFrenchLegalClausesTwoColumn(invoiceMode, invoiceData, selectedClient, currentY, legalMaxHeight);
        currentY += legalHeight + 8;

        // 银行与TVA（紧凑）放在第二页底部剩余空间
        const bankTvaMaxHeight = PAGE_CONFIG.height - PAGE_CONFIG.margin - currentY;
        const bankTvaHeight = this.addBankAndTVACompactSecondPage(invoiceMode, invoiceData, userData, currentY, bankTvaMaxHeight);
        currentY += bankTvaHeight;
        
        // 收集PDF数据
        const chunks = [];
        this.doc.on('data', chunk => {
          console.log('收到PDF数据块，大小:', chunk.length);
          chunks.push(chunk);
        });
        this.doc.on('end', () => {
          try {
            console.log('PDF文档生成结束，总共收到', chunks.length, '个数据块');
            const pdfBuffer = Buffer.concat(chunks);
            console.log('PDF生成完成，buffer大小:', pdfBuffer.length);
            console.log('PDF buffer类型:', typeof pdfBuffer);
            console.log('PDF buffer是否为Buffer:', Buffer.isBuffer(pdfBuffer));
            
            const result = {
              success: true,
              buffer: pdfBuffer,
              filename: `facture_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`
            };
            
            console.log('准备resolve的结果:', {
              success: result.success,
              bufferLength: result.buffer ? result.buffer.length : 'undefined',
              filename: result.filename
            });
            
            resolve(result);
          } catch (bufferError) {
            console.error('PDF buffer处理错误:', bufferError);
            reject({
              success: false,
              error: bufferError.message
            });
          }
        });
        
        this.doc.on('error', (docError) => {
          console.error('PDF文档生成错误:', docError);
          reject({
            success: false,
            error: docError.message
          });
        });
        
        this.doc.end();
        
      } catch (error) {
        console.error('PDF generation error:', error);
        reject({
          success: false,
          error: error.message
        });
      }
    });
  }
}

// 导出主要函数
// 新的PDF生成函数 - 专门为新的输出服务设计
const generateInvoicePDFNew = async (invoiceData, userData, clientData, invoiceMode = 'fr') => {
  console.log('使用新的PDF生成服务生成发票PDF');
  console.log('发票数据:', JSON.stringify(invoiceData, null, 2));
  console.log('用户数据:', JSON.stringify(userData, null, 2));
  console.log('客户数据:', JSON.stringify(clientData, null, 2));
  console.log('发票模式:', invoiceMode);
  
  try {
    // 数据预处理 - 确保与InvoicePreview完全一致
    const processedInvoiceData = {
      ...invoiceData,
      // 确保发票项目数据结构正确
      items: invoiceData.InvoiceItems || invoiceData.items || [],
      // 确保日期格式正确
      invoiceDate: invoiceData.issueDate || invoiceData.invoiceDate || invoiceData.createdAt,
      serviceDate: invoiceData.serviceDate || invoiceData.deliveryDate,
      dueDate: invoiceData.dueDate,
      // 确保客户数据映射正确
      clientId: invoiceData.clientId,
      // 法国特定字段
      orderReference: invoiceData.orderReference,
      contractReference: invoiceData.contractReference,
      tvaExempt: invoiceData.tvaExempt || false,
      tvaSelfBilling: invoiceData.tvaSelfBilling || invoiceData.autoLiquidation || false,
      // 交付地址相关 - 确保字段映射正确
      deliveryAddress: invoiceData.deliveryAddress,
      deliveryCity: invoiceData.deliveryCity,
      deliveryPostalCode: invoiceData.deliveryPostalCode,
      deliveryCountry: invoiceData.deliveryCountry,
      customDeliveryAddress: invoiceData.customDeliveryAddress,
      deliveryAddressSameAsBilling: invoiceData.deliveryAddressSameAsBilling,
      // 备注
      notes: invoiceData.notes || invoiceData.description
    };

    console.log('处理后的发票数据:', JSON.stringify(processedInvoiceData, null, 2));
    console.log('发票项目数据检查 - 原始数据:');
    console.log('  invoiceData.InvoiceItems:', invoiceData.InvoiceItems?.length || 0, '项');
    console.log('  invoiceData.items:', invoiceData.items?.length || 0, '项');
    console.log('  processedInvoiceData.items:', processedInvoiceData.items?.length || 0, '项');

    // 客户数据预处理 - 确保字段映射正确
    const processedClientData = clientData ? {
      ...clientData,
      // 确保字段映射与InvoicePreview一致
      companyName: clientData.companyName || clientData.company,
      contactName: clientData.contactName || clientData.name,
      sirenNumber: clientData.sirenNumber || clientData.siren,
      siretNumber: clientData.siretNumber || clientData.siret,
      vatNumber: clientData.vatNumber
    } : null;

    console.log('处理后的客户数据:', JSON.stringify(processedClientData, null, 2));

    // 用户数据预处理 - 确保公司信息结构正确
    const processedUserData = {
      ...userData,
      Company: {
        ...(userData.Company || {}),
        name: (userData.Company && userData.Company.name) || userData.companyName || userData.Company?.name,
        address: (userData.Company && userData.Company.address) || userData.address || userData.Company?.address,
        phone: (userData.Company && userData.Company.phone) || userData.phone || userData.Company?.phone,
        email: (userData.Company && userData.Company.email) || userData.email || userData.Company?.email,
        vatNumber: (userData.Company && userData.Company.vatNumber) || userData.vatNumber || userData.Company?.vatNumber,
        sirenNumber: (userData.Company && userData.Company.sirenNumber) || userData.siren || userData.siretNumber || userData.Company?.sirenNumber,
        siretNumber: (userData.Company && userData.Company.siretNumber) || userData.siretNumber || userData.Company?.siretNumber,
        legalForm: (userData.Company && userData.Company.legalForm) || userData.legalForm || userData.Company?.legalForm,
        registeredCapital: (userData.Company && userData.Company.registeredCapital) || userData.capital || userData.Company?.registeredCapital,
        rcsNumber: (userData.Company && userData.Company.rcsNumber) || userData.rcsNumber || userData.Company?.rcsNumber,
        nafCode: (userData.Company && userData.Company.nafCode) || userData.nafCode || userData.Company?.nafCode,
        // 补充银行信息嵌套对象：兼容平铺字段与已有嵌套
        bankInfo: {
          ...(userData.Company?.bankInfo || {}),
          iban: userData.Company?.bankInfo?.iban || userData.bankIBAN || userData.iban,
          bic: userData.Company?.bankInfo?.bic || userData.bankBIC || userData.bic,
          bankName: userData.Company?.bankInfo?.bankName || userData.bankName,
          accountHolder: userData.Company?.bankInfo?.accountHolder || userData.accountHolder || [userData.firstName, userData.lastName].filter(Boolean).join(' ')
        }
      }
    };
    
    console.log('处理后的用户数据:', JSON.stringify(processedUserData, null, 2));
    
    const generator = new PDFInvoiceGenerator();
    const result = await generator.generateInvoicePDF(
      processedInvoiceData, 
      processedUserData, 
      processedClientData, 
      invoiceMode
    );
    
    console.log('PDF生成结果:', result);
    console.log('PDF生成结果类型:', typeof result);
    console.log('PDF生成结果success:', result?.success);
    
    // 检查结果是否成功
    if (!result || result.success === false) {
      const errorMsg = result?.error || 'PDF生成失败';
      console.error('PDF生成失败:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // 提取buffer从结果对象中
    const pdfBuffer = result.buffer;
    
    console.log('PDF buffer类型:', typeof pdfBuffer);
    console.log('PDF buffer是否为Buffer:', Buffer.isBuffer(pdfBuffer));
    console.log('PDF buffer长度:', pdfBuffer ? pdfBuffer.length : 'undefined');
    
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('PDF buffer为空或未定义');
    }
    
    console.log('新PDF生成服务：PDF生成成功，大小:', pdfBuffer.length, 'bytes');
    return {
      success: true,
      buffer: pdfBuffer,
      filename: result.filename
    };
  } catch (error) {
    console.error('新PDF生成服务：PDF生成失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 原有的PDF生成函数 - 保持向后兼容
const generateInvoicePDF = async (invoiceData, userData, clientData, invoiceMode = 'fr') => {
  const generator = new PDFInvoiceGenerator();
  return await generator.generateInvoicePDF(invoiceData, userData, clientData, invoiceMode);
};

module.exports = {
  generateInvoicePDF,
  generateInvoicePDFNew,
  PDFInvoiceGenerator,
  formatCurrency,
  formatDate,
  formatPercentage,
  generateInvoiceNumber,
  getDeliveryAddress,
  getTVAInfoText
};