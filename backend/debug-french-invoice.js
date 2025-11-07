const memoryDb = require('./src/config/memoryDatabase');
const InvoiceNumberService = require('./src/services/invoiceNumberService');

async function debugFrenchInvoice() {
  console.log('=== 法国发票编号调试 ===');

  // 获取用户设置
  const userId = 1;
  const settings = memoryDb.findSettingsByUserId(userId);
  console.log('用户设置:', JSON.stringify(settings, null, 2));

  // 获取所有发票
  const allInvoices = memoryDb.findAllInvoices();
  console.log('\n所有发票:');
  allInvoices.forEach(invoice => {
    console.log(`ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}, 用户: ${invoice.userId}, 时间: ${invoice.createdAt}`);
  });

  // 检查是否存在 FR-2025-000001
  const existingFrenchInvoice = memoryDb.findInvoiceByNumber('FR-2025-000001');
  console.log('\n检查 FR-2025-000001 是否存在:', existingFrenchInvoice);

  // 测试发票编号生成
  const invoiceNumberService = new InvoiceNumberService(memoryDb);

  console.log('\n=== 测试法国发票编号生成 ===');
  try {
    const nextFrenchNumber = await invoiceNumberService.getNextInvoiceNumber(userId, 'french');
    console.log('生成的法国发票编号:', nextFrenchNumber);
  } catch (error) {
    console.error('生成法国发票编号失败:', error);
  }

  console.log('\n=== 测试标准发票编号生成 ===');
  try {
    const nextStandardNumber = await invoiceNumberService.getNextInvoiceNumber(userId, 'standard');
    console.log('生成的标准发票编号:', nextStandardNumber);
  } catch (error) {
    console.error('生成标准发票编号失败:', error);
  }

  // 检查是否会产生重复
  const isDuplicate = await invoiceNumberService.isInvoiceNumberExists('FR-2025-000001', userId);
  console.log('\nFR-2025-000001 是否重复:', isDuplicate);

  // 如果不重复，添加到数据库
  if (!isDuplicate) {
    console.log('添加测试发票到数据库...');
    const testInvoice = {
      id: 999,
      userId: userId,
      invoiceNumber: 'FR-2025-000001',
      clientId: 4,
      issueDate: '2025-11-02',
      createdAt: new Date(),
      items: []
    };
    
    memoryDb.createInvoice(testInvoice);
    
    // 再次检查
    const afterAdd = memoryDb.findInvoiceByNumber('FR-2025-000001');
    console.log('添加后检查:', afterAdd ? '存在' : '不存在');
    
    // 再次生成编号
    const nextAfterAdd = await invoiceNumberService.getNextInvoiceNumber(userId, 'french');
    console.log('添加后生成的下一个编号:', nextAfterAdd);
  }
}

debugFrenchInvoice().catch(console.error);