/**
 * 模拟电子发票服务
 * 用于沙盒模式下模拟法国电子发票API调用
 */

const crypto = require('crypto');

/**
 * 生成随机ID
 */
const generateId = (prefix = '') => {
  return `${prefix}${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * 模拟法国电子发票提交
 */
const submitFrenchInvoice = async (invoiceData) => {
  console.log('[SANDBOX] Submitting French invoice to PDP/PPF sandbox');
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟验证结果
  const isValid = Math.random() > 0.1; // 90% 成功率
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid XML format',
      errorCode: 'FR-XML-001',
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    success: true,
    invoiceId: generateId('FR-'),
    validationCode: 'VALID-FR-2025',
    status: 'submitted',
    timestamp: new Date().toISOString(),
    watermark: 'TEST INVOICE - NOT VALID FOR TAX PURPOSES'
  };
};



/**
 * 模拟法国电子发票状态查询
 */
const getFrenchInvoiceStatus = async (invoiceId) => {
  console.log(`[SANDBOX] Checking French invoice status: ${invoiceId}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 随机返回不同状态
  const statuses = ['submitted', 'processing', 'approved', 'rejected'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    invoiceId,
    status,
    timestamp: new Date().toISOString(),
    details: {
      processingTime: Math.floor(Math.random() * 24) + ' hours',
      validationChecks: ['XML Format', 'Digital Signature', 'VAT Number']
    }
  };
};



/**
 * 模拟法国电子发票取消
 */
const cancelFrenchInvoice = async (invoiceId, reason) => {
  console.log(`[SANDBOX] Cancelling French invoice: ${invoiceId}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 模拟取消结果
  const success = Math.random() > 0.2; // 80% 成功率
  
  return {
    success,
    invoiceId,
    status: success ? 'cancelled' : 'cancel_failed',
    timestamp: new Date().toISOString(),
    reason: success ? 'Invoice cancelled successfully' : 'Cancellation failed: Invoice already processed'
  };
};



module.exports = {
  submitFrenchInvoice,
  getFrenchInvoiceStatus,
  cancelFrenchInvoice
};