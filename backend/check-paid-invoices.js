const memoryDb = require('./src/config/memoryDatabase');

async function checkPaidInvoices() {
  try {
    console.log('🔍 检查已支付发票的详细信息...');
    
    // 获取所有发票
    const allInvoices = memoryDb.findAllInvoices();
    console.log(`📊 总发票数量: ${allInvoices.length}`);
    
    // 过滤已支付发票
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    console.log(`💰 已支付发票数量: ${paidInvoices.length}`);
    
    if (paidInvoices.length > 0) {
      console.log('\n📋 已支付发票详情:');
      paidInvoices.forEach((invoice, index) => {
        console.log(`发票 ${index + 1}:`);
        console.log(`  - ID: ${invoice.id}`);
        console.log(`  - 用户ID: ${invoice.userId}`);
        console.log(`  - 金额: ${invoice.amount || invoice.totalAmount || invoice.total}`);
        console.log(`  - 状态: ${invoice.status}`);
        console.log(`  - 创建日期: ${invoice.createdAt || invoice.date}`);
        console.log(`  - 支付日期: ${invoice.paidDate || '未设置'}`);
        console.log(`  - 到期日期: ${invoice.dueDate}`);
        console.log('  - 完整对象:', JSON.stringify(invoice, null, 2));
        console.log('---');
      });
    }
    
    // 检查所有发票的状态分布
    console.log('\n📈 发票状态分布:');
    const statusCount = {};
    allInvoices.forEach(invoice => {
      const status = invoice.status || 'undefined';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 张`);
    });
    
    // 模拟创建一些已支付发票用于测试
    console.log('\n🔧 创建测试用的已支付发票...');
    
    // 将一些现有发票标记为已支付
    const testInvoices = allInvoices.slice(0, 3); // 取前3张发票
    testInvoices.forEach((invoice, index) => {
      const paidDate = new Date();
      paidDate.setDate(paidDate.getDate() - (index * 10)); // 分别在10天前、20天前、30天前支付
      
      invoice.status = 'paid';
      invoice.paidDate = paidDate.toISOString();
      
      console.log(`  ✅ 发票 ${invoice.id} 已标记为已支付，支付日期: ${paidDate.toISOString().slice(0, 10)}`);
    });
    
    console.log('\n✨ 测试数据创建完成！现在有更多已支付发票可用于Revenue图表。');
    
  } catch (error) {
    console.error('❌ 检查数据时出错:', error);
  }
}

checkPaidInvoices();