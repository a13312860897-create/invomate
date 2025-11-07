/**
 * 模拟发票服务
 * 用于沙盒模式下模拟发票操作
 */

const crypto = require('crypto');

/**
 * 生成随机ID
 */
const generateId = (prefix = '') => {
  return `${prefix}${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * 模拟发票创建
 */
const createInvoice = async (invoiceData) => {
  console.log('[SANDBOX] Creating mock invoice');
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 生成模拟发票数据
  const mockInvoice = {
    id: generateId('INV-'),
    invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    status: 'draft',
    ...invoiceData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSandbox: true,
    watermark: 'TEST INVOICE - NOT VALID FOR FINANCIAL PURPOSES'
  };
  
  return {
    success: true,
    invoice: mockInvoice,
    message: 'Mock invoice created successfully'
  };
};

/**
 * 模拟发票更新
 */
const updateInvoice = async (id, updateData) => {
  console.log(`[SANDBOX] Updating mock invoice: ${id}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 模拟更新结果
  const mockInvoice = {
    id,
    ...updateData,
    updatedAt: new Date().toISOString(),
    isSandbox: true,
    watermark: 'TEST INVOICE - NOT VALID FOR FINANCIAL PURPOSES'
  };
  
  return {
    success: true,
    invoice: mockInvoice,
    message: 'Mock invoice updated successfully'
  };
};

/**
 * 模拟发票删除
 */
const deleteInvoice = async (id) => {
  console.log(`[SANDBOX] Deleting mock invoice: ${id}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 模拟删除结果
  return {
    success: true,
    message: 'Mock invoice deleted successfully'
  };
};

/**
 * 模拟获取发票
 */
const getInvoice = async (id) => {
  console.log(`[SANDBOX] Getting mock invoice: ${id}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 模拟发票数据
  const mockInvoice = {
    id,
    invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    status: 'draft',
    clientId: generateId('CLIENT-'),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: Math.floor(Math.random() * 1000) + 100,
    taxAmount: Math.floor(Math.random() * 200) + 20,
    total: Math.floor(Math.random() * 1200) + 120,
    notes: 'Test invoice notes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSandbox: true,
    watermark: 'TEST INVOICE - NOT VALID FOR FINANCIAL PURPOSES',
    items: [
      {
        id: generateId('ITEM-'),
        description: 'Test item 1',
        quantity: 1,
        unitPrice: 100,
        taxRate: 20,
        taxAmount: 20,
        total: 120
      },
      {
        id: generateId('ITEM-'),
        description: 'Test item 2',
        quantity: 2,
        unitPrice: 50,
        taxRate: 10,
        taxAmount: 10,
        total: 110
      }
    ],
    client: {
      id: generateId('CLIENT-'),
      name: 'Test Client',
      company: 'Test Company',
      address: '123 Test Street, Test City',
      country: 'France',
      vatNumber: 'FR12345678901',
      siren: '123456789',
      siret: '12345678901234'
    }
  };
  
  return {
    success: true,
    invoice: mockInvoice
  };
};

/**
 * 模拟获取发票列表
 */
const getInvoices = async (filters = {}) => {
  console.log('[SANDBOX] Getting mock invoices list');
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // 生成模拟发票列表
  const mockInvoices = [];
  const count = filters.limit || 10;
  
  for (let i = 0; i < count; i++) {
    const statusOptions = ['draft', 'sent', 'paid', 'overdue'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    mockInvoices.push({
      id: generateId('INV-'),
      invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      status,
      clientId: generateId('CLIENT-'),
      issueDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: Math.floor(Math.random() * 1000) + 100,
      taxAmount: Math.floor(Math.random() * 200) + 20,
      total: Math.floor(Math.random() * 1200) + 120,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      isSandbox: true,
      watermark: 'TEST INVOICE - NOT VALID FOR FINANCIAL PURPOSES',
      client: {
        id: generateId('CLIENT-'),
        name: `Test Client ${i + 1}`,
        company: `Test Company ${i + 1}`,
        country: 'France',
        vatNumber: `FR${String(i + 1).padStart(11, '0')}`,
        siren: `${String(i + 1).padStart(9, '0')}`,
        siret: `${String(i + 1).padStart(14, '0')}`
      }
    });
  }
  
  return {
    success: true,
    invoices: mockInvoices,
    total: count,
    message: 'Mock invoices retrieved successfully'
  };
};

/**
 * 模拟发票状态更新
 */
const updateInvoiceStatus = async (id, status) => {
  console.log(`[SANDBOX] Updating mock invoice status: ${id} to ${status}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 模拟更新结果
  return {
    success: true,
    id,
    status,
    updatedAt: new Date().toISOString(),
    message: 'Mock invoice status updated successfully'
  };
};

/**
 * 模拟发票PDF生成
 */
const generateInvoicePDF = async (id) => {
  console.log(`[SANDBOX] Generating mock invoice PDF: ${id}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟PDF生成结果
  return {
    success: true,
    pdfUrl: `/generated_pdfs/mock-invoice-${id}.pdf`,
    filename: `mock-invoice-${id}.pdf`,
    message: 'Mock invoice PDF generated successfully'
  };
};

module.exports = {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  getInvoices,
  updateInvoiceStatus,
  generateInvoicePDF
};