const memoryDb = require('./src/config/memoryDatabase');

function debugMemoryPersistence() {
  console.log('=== 内存数据库持久化调试 ===');
  
  // 1. 检查当前内存数据库状态
  console.log('\n1. 当前内存数据库状态:');
  console.log('总发票数:', memoryDb.invoices.length);
  console.log('总客户数:', memoryDb.clients.length);
  console.log('总用户数:', memoryDb.users.length);
  
  // 2. 显示所有发票的详细信息
  console.log('\n2. 所有发票详细信息:');
  memoryDb.invoices.forEach((invoice, index) => {
    console.log(`${index + 1}. ID: ${invoice.id}, 用户: ${invoice.userId}, 状态: ${invoice.status}, 金额: ${invoice.total}, 创建: ${invoice.createdAt}, 支付: ${invoice.paidDate || 'N/A'}`);
  });
  
  // 3. 按创建月份分组
  console.log('\n3. 按创建月份分组:');
  const groupedByMonth = {};
  memoryDb.invoices.forEach(invoice => {
    const month = invoice.createdAt.substring(0, 7); // YYYY-MM
    if (!groupedByMonth[month]) {
      groupedByMonth[month] = [];
    }
    groupedByMonth[month].push(invoice);
  });
  
  Object.keys(groupedByMonth).sort().forEach(month => {
    const invoices = groupedByMonth[month];
    console.log(`${month}: ${invoices.length}张发票`);
    
    // 按状态统计
    const statusCount = {};
    invoices.forEach(inv => {
      statusCount[inv.status] = (statusCount[inv.status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}张`);
    });
  });
  
  // 4. 检查是否有重复ID
  console.log('\n4. 检查重复ID:');
  const idCounts = {};
  memoryDb.invoices.forEach(invoice => {
    idCounts[invoice.id] = (idCounts[invoice.id] || 0) + 1;
  });
  
  const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
  if (duplicateIds.length > 0) {
    console.log('发现重复ID:');
    duplicateIds.forEach(([id, count]) => {
      console.log(`  ID ${id}: ${count}次`);
    });
  } else {
    console.log('没有发现重复ID');
  }
  
  // 5. 检查nextIds状态
  console.log('\n5. nextIds状态:');
  console.log('nextIds:', memoryDb.nextIds);
  
  // 6. 清空数据并重新检查
  console.log('\n6. 清空数据测试:');
  const originalLength = memoryDb.invoices.length;
  memoryDb.invoices.length = 0;
  console.log('清空后发票数:', memoryDb.invoices.length);
  
  // 添加一张测试发票
  const testInvoice = {
    id: 999,
    userId: 1,
    invoiceNumber: 'TEST-001',
    status: 'draft',
    createdAt: '2025-01-26',
    total: 1000,
    items: [{
      description: '测试项目',
      quantity: 1,
      rate: 1000,
      total: 1000
    }]
  };
  
  memoryDb.invoices.push(testInvoice);
  console.log('添加测试发票后数量:', memoryDb.invoices.length);
  
  // 恢复原始数据长度（模拟）
  console.log(`\n原始数据长度: ${originalLength}`);
}

debugMemoryPersistence();