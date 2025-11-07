const memoryDb = require('./src/config/memoryDatabase');

async function resetAndCreateTestInvoices() {
  try {
    console.log('=== 重置发票数据并创建测试发票 ===');
    
    // 1. 清除所有现有发票
    console.log('清除所有现有发票...');
    memoryDb.invoices = [];
    console.log('✅ 已清除所有发票');
    
    // 2. 创建10张非九月份的发票（2025年8月）
    console.log('\n创建10张非九月份的发票（2025年8月）...');
    const nonSeptemberInvoices = [];
    for (let i = 1; i <= 10; i++) {
      const invoice = {
        id: memoryDb.generateId('invoices'),
        userId: 1,
        clientId: 1,
        invoiceNumber: `INV-2025-08-${String(i).padStart(3, '0')}`,
        status: ['paid', 'pending', 'draft'][Math.floor(Math.random() * 3)],
        total: Math.floor(Math.random() * 5000) + 1000,
        currency: 'EUR',
        issueDate: new Date(`2025-08-${Math.floor(Math.random() * 28) + 1}`),
        dueDate: new Date(`2025-09-${Math.floor(Math.random() * 28) + 1}`),
        createdAt: new Date(`2025-08-${Math.floor(Math.random() * 28) + 1}`),
        updatedAt: new Date(),
        items: [{
          description: `服务项目 ${i}`,
          quantity: 1,
          unitPrice: Math.floor(Math.random() * 5000) + 1000,
          total: Math.floor(Math.random() * 5000) + 1000
        }]
      };
      
      // 如果是已支付状态，添加支付日期
      if (invoice.status === 'paid') {
        invoice.paidDate = new Date(`2025-08-${Math.floor(Math.random() * 28) + 1}`);
      }
      
      nonSeptemberInvoices.push(invoice);
      memoryDb.invoices.push(invoice);
    }
    console.log(`✅ 已创建 ${nonSeptemberInvoices.length} 张8月份发票`);
    
    // 3. 创建15张九月份的发票，按指定状态分布
    console.log('\n创建15张九月份的发票...');
    const septemberInvoices = [];
    
    // 状态分布：1张待付款，2张已逾期，3张草稿，4张已发送，5张已支付
    const statusDistribution = [
      { status: 'pending', count: 1 },
      { status: 'overdue', count: 2 },
      { status: 'draft', count: 3 },
      { status: 'sent', count: 4 },
      { status: 'paid', count: 5 }
    ];
    
    let invoiceCounter = 1;
    
    for (const { status, count } of statusDistribution) {
      for (let i = 0; i < count; i++) {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
        const invoice = {
          id: memoryDb.generateId('invoices'),
          userId: 1,
          clientId: 1,
          invoiceNumber: `INV-2025-09-${String(invoiceCounter).padStart(3, '0')}`,
          status: status,
          total: Math.floor(Math.random() * 8000) + 2000,
          currency: 'EUR',
          issueDate: new Date(`2025-09-${dayOfMonth}`),
          dueDate: new Date(`2025-10-${dayOfMonth}`),
          createdAt: new Date(`2025-09-${dayOfMonth}`),
          updatedAt: new Date(),
          items: [{
            description: `九月服务项目 ${invoiceCounter}`,
            quantity: 1,
            unitPrice: Math.floor(Math.random() * 8000) + 2000,
            total: Math.floor(Math.random() * 8000) + 2000
          }]
        };
        
        // 根据状态设置特定字段
        if (status === 'paid') {
          invoice.paidDate = new Date(`2025-09-${Math.floor(Math.random() * 28) + 1}`);
        } else if (status === 'overdue') {
          // 设置逾期日期为过去的日期
          invoice.dueDate = new Date(`2025-09-${Math.floor(Math.random() * 15) + 1}`);
        }
        
        septemberInvoices.push(invoice);
        memoryDb.invoices.push(invoice);
        invoiceCounter++;
      }
    }
    
    console.log(`✅ 已创建 ${septemberInvoices.length} 张9月份发票`);
    
    // 4. 显示创建结果统计
    console.log('\n=== 创建结果统计 ===');
    console.log(`总发票数: ${memoryDb.invoices.length}`);
    console.log(`8月份发票: ${nonSeptemberInvoices.length} 张`);
    console.log(`9月份发票: ${septemberInvoices.length} 张`);
    
    // 统计9月份发票状态分布
    const septemberStatusCount = {};
    septemberInvoices.forEach(invoice => {
      septemberStatusCount[invoice.status] = (septemberStatusCount[invoice.status] || 0) + 1;
    });
    
    console.log('\n9月份发票状态分布:');
    Object.entries(septemberStatusCount).forEach(([status, count]) => {
      const statusLabels = {
        'paid': '已支付',
        'pending': '待付款',
        'overdue': '逾期',
        'draft': '草稿',
        'sent': '已发送'
      };
      console.log(`  ${statusLabels[status] || status}: ${count} 张`);
    });
    
    console.log('\n✅ 测试数据创建完成！');
    
  } catch (error) {
    console.error('创建测试数据时出错:', error);
  }
}

// 运行脚本
resetAndCreateTestInvoices();