const { createTestInvoices } = require('./create-test-invoices');

createTestInvoices().then(() => console.log('测试发票创建完成')).catch(err => console.error('错误:', err));