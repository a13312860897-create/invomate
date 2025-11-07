// 统一格式化与公司/法律信息映射辅助函数
const { formatCurrency: legacyFormatCurrency } = require('./amountUtils');

// 统一金额格式化（根据发票模式切换）
function formatCurrencyUnified(amount, currency = 'EUR', invoiceMode = 'fr') {
  const num = Number(amount ?? 0);
  if (invoiceMode === 'fr') {
    try {
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
      return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
    } catch (e) {
      return `${currency} ${num.toFixed(2)}`;
    }
  }
  return legacyFormatCurrency(num, currency);
}

// 统一百分比格式化（根据发票模式切换）
function formatPercentageUnified(value, invoiceMode = 'fr') {
  const rate = Number(value ?? 0);
  if (invoiceMode === 'fr') {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(rate / 100);
    } catch (e) {
      return `${rate.toFixed(1)} %`;
    }
  }
  return `${rate} %`;
}

// 统一公司与法律信息映射
function mapCompanyLegalInfo(userData = {}) {
  const company = userData.Company || {};
  const mapped = {
    companyName: userData.companyName || company.name || company.companyName || '',
    address: userData.address || company.address || '',
    city: userData.city || company.city || '',
    postalCode: userData.postalCode || company.postalCode || '',
    country: userData.country || company.country || '',
    phone: userData.phone || company.phone || '',
    email: userData.email || company.email || '',
    vatNumber: userData.vatNumber || company.vatNumber || '',
    siren: userData.siren || userData.sirenNumber || company.sirenNumber || company.siren || '',
    siret: userData.siret || userData.siretNumber || company.siretNumber || company.siret || '',
    legalForm: userData.legalForm || company.legalForm || '',
    registeredCapital: normalizeNumber(userData.registeredCapital || userData.capital || company.registeredCapital || 0),
    rcsNumber: userData.rcsNumber || company.rcsNumber || '',
    nafCode: userData.nafCode || company.nafCode || ''
  };
  return mapped;
}

function normalizeNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') {
    // 替换逗号为点，去除空格和货币符号
    const clean = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

module.exports = {
  formatCurrencyUnified,
  formatPercentageUnified,
  mapCompanyLegalInfo
};