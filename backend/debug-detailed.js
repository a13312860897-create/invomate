const memoryDb = require('./src/config/memoryDatabase');
const InvoiceNumberService = require('./src/services/invoiceNumberService');

async function detailedDebug() {
  console.log('=== 详细调试发票编号问题 ===');

  const userId = 1;
  const invoiceNumberService = new InvoiceNumberService(memoryDb);

  // 1. 检查内存数据库中的所有发票
  console.log('\n1. 内存数据库中的所有发票:');
  const allInvoices = memoryDb.findAllInvoices();
  allInvoices.forEach(invoice => {
    console.log(`  ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}, 用户: ${invoice.userId}`);
  });

  // 2. 专门查找 FR-2025-000001
  console.log('\n2. 查找 FR-2025-000001:');
  const frInvoice = memoryDb.findInvoiceByNumber('FR-2025-000001');
  console.log('  结果:', frInvoice);

  // 3. 查找所有法国格式的发票
  console.log('\n3. 所有法国格式发票:');
  const frenchInvoices = allInvoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith('FR-'));
  console.log('  法国格式发票数量:', frenchInvoices.length);
  frenchInvoices.forEach(invoice => {
    console.log(`  ${invoice.invoiceNumber} (ID: ${invoice.id}, 用户: ${invoice.userId})`);
  });

  // 4. 测试发票编号服务的检查方法
  console.log('\n4. 测试发票编号存在性检查:');
  const exists = await invoiceNumberService.isInvoiceNumberExists('FR-2025-000001', userId);
  console.log('  FR-2025-000001 存在性:', exists);

  // 5. 尝试生成新的法国发票编号
  console.log('\n5. 生成新的法国发票编号:');
  try {
    const newNumber = await invoiceNumberService.getNextInvoiceNumber(userId, 'french');
    console.log('  生成的编号:', newNumber);
  } catch (error) {
    console.error('  生成失败:', error.message);
  }

  // 6. 模拟创建发票的过程
  console.log('\n6. 模拟创建发票过程:');
  
  // 检查用户设置
  const settings = memoryDb.findSettingsByUserId(userId);
  console.log('  用户设置模式:', settings?.invoiceMode);
  
  // 根据设置确定格式
  const format = settings?.invoiceMode === 'fr' ? 'french' : 'standard';
  console.log('  确定的格式:', format);
  
  // 生成编号
  const generatedNumber = await invoiceNumberService.getNextInvoiceNumber(userId, format);
  console.log('  生成的编号:', generatedNumber);
  
  // 检查是否重复
  const isDuplicate = await invoiceNumberService.isInvoiceNumberExists(generatedNumber, userId);
  console.log('  是否重复:', isDuplicate);

  // 7. 检查内存数据库的 findInvoiceByNumber 方法
  console.log('\n7. 测试 findInvoiceByNumber 方法:');
  console.log('  查找 INV-2024-001:', memoryDb.findInvoiceByNumber('INV-2024-001') ? '找到' : '未找到');
  console.log('  查找 FR-2025-000001:', memoryDb.findInvoiceByNumber('FR-2025-000001') ? '找到' : '未找到');
  console.log('  查找不存在的编号:', memoryDb.findInvoiceByNumber('NONEXISTENT') ? '找到' : '未找到');
}

detailedDebug().catch(console.error);