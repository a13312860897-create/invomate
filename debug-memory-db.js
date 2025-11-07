// 直接测试内存数据库的发票数据
const path = require('path');

// 模拟后端环境
process.env.NODE_ENV = 'development';
process.env.DB_TYPE = 'memory';

// 引入内存数据库
const memoryDb = require('./backend/src/config/memoryDatabase');

function debugMemoryDatabase() {
  console.log('🔍 调试内存数据库\n');

  // 1. 获取所有发票
  const allInvoices = memoryDb.findAllInvoices();
  console.log(`📋 总发票数: ${allInvoices.length}`);

  // 2. 过滤用户ID为1的发票
  const userInvoices = allInvoices.filter(inv => inv.userId === 1);
  console.log(`👤 用户1的发票数: ${userInvoices.length}`);

  // 3. 过滤已支付发票
  const paidInvoices = userInvoices.filter(inv => inv.status === 'paid');
  console.log(`💰 已支付发票数: ${paidInvoices.length}`);

  if (paidInvoices.length > 0) {
    console.log('\n💳 已支付发票详情:');
    paidInvoices.forEach((invoice, index) => {
      console.log(`  ${index + 1}. ID: ${invoice.id}`);
      console.log(`     用户ID: ${invoice.userId}`);
      console.log(`     状态: ${invoice.status}`);
      console.log(`     支付日期: ${invoice.paidDate}`);
      console.log(`     金额字段:`);
      console.log(`       - total: ${invoice.total}`);
      console.log(`       - totalAmount: ${invoice.totalAmount}`);
      console.log(`       - amount: ${invoice.amount}`);
      console.log('');
    });

    // 4. 测试日期过滤逻辑
    console.log('📅 测试日期过滤逻辑:');
    
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';
    
    console.log(`   日期范围: ${startDate} 到 ${endDate}`);
    
    const filteredInvoices = paidInvoices.filter(inv => {
      if (!inv.paidDate) return false;
      const paidDate = new Date(inv.paidDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      console.log(`   检查发票 ${inv.id}:`);
      console.log(`     支付日期: ${paidDate.toISOString()}`);
      console.log(`     开始日期: ${start.toISOString()}`);
      console.log(`     结束日期: ${end.toISOString()}`);
      console.log(`     paidDate >= start: ${paidDate >= start}`);
      console.log(`     paidDate <= end: ${paidDate <= end}`);
      
      const result = paidDate >= start && paidDate <= end;
      console.log(`     匹配结果: ${result}`);
      console.log('');
      
      return result;
    });
    
    console.log(`🎯 10月份匹配的发票数: ${filteredInvoices.length}`);
    
    if (filteredInvoices.length > 0) {
      const totalRevenue = filteredInvoices.reduce((sum, inv) => {
        const amount = parseFloat(inv.totalAmount || inv.total) || 0;
        console.log(`   发票 ${inv.id} 金额: ${amount}`);
        return sum + amount;
      }, 0);
      
      console.log(`💰 10月份总收入: ${totalRevenue}`);
    }
  }
}

debugMemoryDatabase();