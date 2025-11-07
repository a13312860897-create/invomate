/**
 * 总金额处理工具函数
 * 统一处理发票中的总金额字段，解决 total 和 totalAmount 字段不一致的问题
 */

/**
 * 从发票数据中提取总金额
 * @param {Object} invoiceData - 发票数据对象
 * @returns {number} - 总金额数值
 */
function extractTotalAmount(invoiceData) {
  if (!invoiceData || typeof invoiceData !== 'object') {
    console.warn('[AmountUtils] 无效的发票数据:', invoiceData);
    return 0;
  }

  // 优先级顺序：total > totalAmount > subtotal + taxAmount
  let amount = 0;
  
  // 1. 优先使用 total 字段
  if (invoiceData.total !== undefined && invoiceData.total !== null) {
    amount = parseFloat(invoiceData.total);
    if (!isNaN(amount) && amount > 0) {
      console.log('[AmountUtils] 使用 total 字段:', amount);
      return amount;
    }
  }
  
  // 2. 其次使用 totalAmount 字段
  if (invoiceData.totalAmount !== undefined && invoiceData.totalAmount !== null) {
    amount = parseFloat(invoiceData.totalAmount);
    if (!isNaN(amount) && amount > 0) {
      console.log('[AmountUtils] 使用 totalAmount 字段:', amount);
      return amount;
    }
  }
  
  // 3. 尝试从 subtotal + taxAmount 计算
  const subtotal = parseFloat(invoiceData.subtotal || 0);
  const taxAmount = parseFloat(invoiceData.taxAmount || 0);
  
  if (!isNaN(subtotal) && !isNaN(taxAmount)) {
    amount = subtotal + taxAmount;
    if (amount > 0) {
      console.log('[AmountUtils] 从 subtotal + taxAmount 计算:', amount, '(subtotal:', subtotal, ', taxAmount:', taxAmount, ')');
      return amount;
    }
  }
  
  // 4. 尝试从项目计算总金额
  if (invoiceData.items && Array.isArray(invoiceData.items)) {
    amount = calculateTotalFromItems(invoiceData.items);
    if (amount > 0) {
      console.log('[AmountUtils] 从项目计算总金额:', amount);
      return amount;
    }
  }
  
  // 5. 尝试从 InvoiceItems 计算总金额
  if (invoiceData.InvoiceItems && Array.isArray(invoiceData.InvoiceItems)) {
    amount = calculateTotalFromItems(invoiceData.InvoiceItems);
    if (amount > 0) {
      console.log('[AmountUtils] 从 InvoiceItems 计算总金额:', amount);
      return amount;
    }
  }
  
  console.warn('[AmountUtils] 无法提取有效的总金额，返回 0。发票数据:', {
    total: invoiceData.total,
    totalAmount: invoiceData.totalAmount,
    subtotal: invoiceData.subtotal,
    taxAmount: invoiceData.taxAmount,
    itemsCount: invoiceData.items?.length || 0,
    invoiceItemsCount: invoiceData.InvoiceItems?.length || 0
  });
  
  return 0;
}

/**
 * 从项目列表计算总金额
 * @param {Array} items - 项目列表
 * @returns {number} - 计算出的总金额
 */
function calculateTotalFromItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  let subtotal = 0;
  let totalTax = 0;
  
  items.forEach((item, index) => {
    const quantity = parseFloat(item.quantity || 1);
    const unitPrice = parseFloat(item.unitPrice || item.unitPriceHT || 0);
    const taxRate = parseFloat(item.taxRate || item.tvaRate || 0);
    
    if (isNaN(quantity) || isNaN(unitPrice)) {
      console.warn(`[AmountUtils] 项目 ${index} 数据无效:`, { quantity, unitPrice });
      return;
    }
    
    const itemSubtotal = quantity * unitPrice;
    const itemTax = itemSubtotal * (taxRate / 100);
    
    subtotal += itemSubtotal;
    totalTax += itemTax;
  });
  
  return subtotal + totalTax;
}

/**
 * 格式化金额为货币字符串
 * @param {number} amount - 金额数值
 * @param {string} currency - 货币代码，默认为 'EUR'
 * @returns {string} - 格式化后的货币字符串
 */
function formatCurrency(amount, currency = 'EUR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0.00';
  }
  
  const numAmount = parseFloat(amount);
  
  switch (currency.toUpperCase()) {
    case 'EUR':
      return `€${numAmount.toFixed(2)}`;
    case 'USD':
      return `$${numAmount.toFixed(2)}`;
    case 'GBP':
      return `£${numAmount.toFixed(2)}`;
    default:
      return `${currency} ${numAmount.toFixed(2)}`;
  }
}

/**
 * 验证并标准化发票数据中的总金额字段
 * @param {Object} invoiceData - 发票数据对象
 * @returns {Object} - 标准化后的发票数据
 */
function normalizeInvoiceAmounts(invoiceData) {
  if (!invoiceData || typeof invoiceData !== 'object') {
    return invoiceData;
  }
  
  const normalizedData = { ...invoiceData };
  const totalAmount = extractTotalAmount(invoiceData);
  
  // 统一设置 total 和 totalAmount 字段
  normalizedData.total = totalAmount;
  normalizedData.totalAmount = totalAmount;
  
  console.log('[AmountUtils] 标准化总金额:', {
    原始total: invoiceData.total,
    原始totalAmount: invoiceData.totalAmount,
    标准化后: totalAmount
  });
  
  return normalizedData;
}

/**
 * 获取发票的显示金额（用于邮件等场景）
 * @param {Object} invoiceData - 发票数据对象
 * @param {string} currency - 货币代码
 * @returns {string} - 格式化的显示金额
 */
function getDisplayAmount(invoiceData, currency = 'EUR') {
  const amount = extractTotalAmount(invoiceData);
  return formatCurrency(amount, currency);
}

module.exports = {
  extractTotalAmount,
  calculateTotalFromItems,
  formatCurrency,
  normalizeInvoiceAmounts,
  getDisplayAmount
};