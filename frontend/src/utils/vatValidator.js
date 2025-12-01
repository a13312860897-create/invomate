import api from '../services/api';
// VAT号码验证工具

// 欧盟国家VAT号码格式
const VAT_PATTERNS = {
  'AT': /^ATU\d{8}$/, // 奥地利
  'BE': /^BE0\d{9}$/, // 比利时
  'BG': /^BG\d{9,10}$/, // 保加利亚
  'CY': /^CY\d{8}[A-Z]$/, // 塞浦路斯
  'CZ': /^CZ\d{8,10}$/, // 捷克
  'DE': /^DE\d{9}$/, // 德国
  'DK': /^DK\d{8}$/, // 丹麦
  'EE': /^EE\d{9}$/, // 爱沙尼亚
  'EL': /^EL\d{9}$/, // 希腊
  'ES': /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, // 西班牙
  'FI': /^FI\d{8}$/, // 芬兰
  'FR': /^FR[A-Z0-9]{2}\d{9}$/, // 法国
  'GB': /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/, // 英国
  'HR': /^HR\d{11}$/, // 克罗地亚
  'HU': /^HU\d{8}$/, // 匈牙利
  'IE': /^IE\d[A-Z0-9]\d{5}[A-Z]$/, // 爱尔兰
  'IT': /^IT\d{11}$/, // 意大利
  'LT': /^LT\d{9}$|^LT\d{12}$/, // 立陶宛
  'LU': /^LU\d{8}$/, // 卢森堡
  'LV': /^LV\d{11}$/, // 拉脱维亚
  'MT': /^MT\d{8}$/, // 马耳他
  'NL': /^NL\d{9}B\d{2}$/, // 荷兰
  'PL': /^PL\d{10}$/, // 波兰
  'PT': /^PT\d{9}$/, // 葡萄牙
  'RO': /^RO\d{2,10}$/, // 罗马尼亚
  'SE': /^SE\d{12}$/, // 瑞典
  'SI': /^SI\d{8}$/, // 斯洛文尼亚
  'SK': /^SK\d{10}$/ // 斯洛伐克
};

// 法国VAT号码特殊验证
const validateFrenchVAT = (vatNumber) => {
  // 移除FR前缀
  const number = vatNumber.replace(/^FR/, '');
  
  if (number.length !== 11) {
    return false;
  }
  
  // 提取前两位和后九位
  const prefix = number.substring(0, 2);
  const suffix = number.substring(2);
  
  // 检查后九位是否为数字
  if (!/^\d{9}$/.test(suffix)) {
    return false;
  }
  
  // 计算校验码
  const sirenNumber = parseInt(suffix, 10);
  const calculatedPrefix = (12 + 3 * (sirenNumber % 97)) % 97;
  
  // 如果前两位是数字，直接比较
  if (/^\d{2}$/.test(prefix)) {
    return parseInt(prefix, 10) === calculatedPrefix;
  }
  
  // 如果包含字母，需要特殊处理
  // 这里简化处理，实际应用中可能需要更复杂的算法
  return true;
};

// 基本格式验证
export const validateVATFormat = (vatNumber, countryCode) => {
  const normalizedVAT = (vatNumber || '').toUpperCase().replace(/[\s.-]/g, '');
  return { valid: true, normalized: normalizedVAT };
};

// 在线VAT验证（通过VIES系统）
export const validateVATOnline = async (vatNumber, countryCode) => {
  try {
    // 首先进行格式验证
    const formatValidation = validateVATFormat(vatNumber, countryCode);
    if (!formatValidation.valid) {
      return formatValidation;
    }
    
    // 调用后端API进行在线验证（使用统一 axios 实例，享受离线兜底）
    const { data: result } = await api.post('/vat/validate', {
      vatNumber: formatValidation.normalized,
      countryCode
    });
    
    return {
      valid: result.valid,
      normalized: formatValidation.normalized,
      companyName: result.companyName,
      companyAddress: result.companyAddress,
      requestDate: result.requestDate,
      source: 'vies'
    };
  } catch (error) {
    console.error('Online VAT validation error:', error);
    
    // 如果在线验证失败，返回格式验证结果
    const formatValidation = validateVATFormat(vatNumber, countryCode);
    return {
      ...formatValidation,
      warning: 'Online validation unavailable, format validation only',
      source: 'format'
    };
  }
};

// 主要的VAT验证函数
export const validateVATNumber = async (vatNumber, countryCode = 'FR') => {
  if (!vatNumber) {
    return { valid: false, error: 'VAT number is required' };
  }
  
  try {
    // 尝试在线验证
    const result = await validateVATOnline(vatNumber, countryCode);
    return result;
  } catch (error) {
    // 如果在线验证失败，进行格式验证
    console.error('VAT validation error:', error);
    const formatResult = validateVATFormat(vatNumber, countryCode);
    return {
      ...formatResult,
      warning: 'Online validation failed, format validation only'
    };
  }
};

// 获取国家的VAT号码格式说明
export const getVATFormatDescription = () => {
  return 'Optional VAT number. Format not restricted.';
};

// 提取SIREN号码（仅适用于法国）
export const extractSIRENFromVAT = (frenchVATNumber) => {
  if (!frenchVATNumber || !frenchVATNumber.startsWith('FR')) {
    return null;
  }
  
  const number = frenchVATNumber.replace(/^FR/, '');
  if (number.length !== 11) {
    return null;
  }
  
  // 提取后9位作为SIREN号码
  const siren = number.substring(2);
  
  // 验证SIREN格式（9位数字）
  if (!/^\d{9}$/.test(siren)) {
    return null;
  }
  
  return siren;
};

// 验证SIREN号码
export const validateSIREN = (siren) => {
  if (!siren || typeof siren !== 'string') {
    return { valid: false, error: 'SIREN number is required' };
  }
  
  // 移除空格和特殊字符
  const cleanSiren = siren.replace(/[\s.-]/g, '');
  
  // 检查长度和格式
  if (!/^\d{9}$/.test(cleanSiren)) {
    return { valid: false, error: 'SIREN must be exactly 9 digits' };
  }
  
  // Luhn算法验证（简化版）
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let digit = parseInt(cleanSiren[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = digit - 9;
      }
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(cleanSiren[8], 10);
  
  if (checkDigit !== lastDigit) {
    return { valid: false, error: 'Invalid SIREN checksum' };
  }
  
  return { valid: true, normalized: cleanSiren };
};

// 验证Peppol ID格式
export const validatePeppolId = (peppolId) => {
  if (!peppolId) {
    return { valid: false, error: 'Peppol ID is required' };
  }
  
  // Peppol ID格式: scheme:identifier
  // 常见格式: 0088:1234567890123, 9956:FR12345678901
  const peppolPattern = /^\d{4}:[A-Z0-9]{4,50}$/;
  
  if (!peppolPattern.test(peppolId)) {
    return { 
      valid: false, 
      error: 'Invalid Peppol ID format. Expected format: 0088:1234567890123' 
    };
  }
  
  const [scheme, identifier] = peppolId.split(':');
  
  // 验证常见的scheme
  const validSchemes = [
    '0002', // System Information et Repertoire des Entreprise et des Etablissements (SIRENE)
    '0007', // Organisationsnummer
    '0088', // Global Location Number (GLN)
    '0096', // DUNS Number
    '0135', // SIA Object Identifiers
    '0184', // DIGSTORG
    '9956', // Belgian Crossroad Bank of Enterprises
    '9957'  // French VAT number
  ];
  
  if (!validSchemes.includes(scheme)) {
    return {
      valid: true, // 仍然有效，但给出警告
      warning: `Scheme ${scheme} is not commonly used. Common schemes: ${validSchemes.join(', ')}`,
      normalized: peppolId
    };
  }
  
  return { valid: true, normalized: peppolId };
};

export default {
  validateVATNumber,
  validateVATFormat,
  validateVATOnline,
  getVATFormatDescription,
  extractSIRENFromVAT,
  validateSIREN,
  validatePeppolId
};
