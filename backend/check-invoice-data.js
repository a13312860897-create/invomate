const memoryDb = require('./src/config/memoryDatabase');

async function checkInvoiceData() {
  try {
    console.log('🔍 检查内存数据库中的发票数据...');
    
    // 获取所有发票
    const invoices = memoryDb.invoices || [];
    console.log(`📊 总发票数量: ${invoices.length}`);
    
    if (invoices.length > 0) {
      console.log('\n📋 发票详情:');
      invoices.forEach((invoice, index) => {
        console.log(`发票 ${index + 1}:`);
        console.log(`  - ID: ${invoice.id}`);
        console.log(`  - 用户ID: ${invoice.userId}`);
        console.log(`  - 金额: ${invoice.amount || invoice.total}`);
        console.log(`  - 状态: ${invoice.status}`);
        console.log(`  - 创建日期: ${invoice.createdAt || invoice.date}`);
        console.log(`  - 到期日期: ${invoice.dueDate}`);
        console.log('---');
      });
      
      // 统计已支付发票
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      console.log(`\n💰 已支付发票数量: ${paidInvoices.length}`);
      
      if (paidInvoices.length > 0) {
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || parseFloat(inv.total) || 0), 0);
        console.log(`💵 总收入: ${totalRevenue}`);
        
        // 按月份分组
        const monthlyData = {};
        paidInvoices.forEach(invoice => {
          const date = new Date(invoice.createdAt || invoice.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              revenue: 0,
              count: 0
            };
          }
          
          monthlyData[monthKey].revenue += parseFloat(invoice.amount) || parseFloat(invoice.total) || 0;
          monthlyData[monthKey].count += 1;
        });
        
        console.log('\n📈 按月收入统计:');
        Object.values(monthlyData).forEach(month => {
          console.log(`  ${month.month}: ${month.revenue} (${month.count} 张发票)`);
        });
      }
    } else {
      console.log('⚠️ 数据库中没有发票数据');
      
      // 检查用户数据
      const users = memoryDb.users || [];
      console.log(`👥 用户数量: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n👤 用户列表:');
        users.forEach((user, index) => {
          console.log(`用户 ${index + 1}: ${user.email} (ID: ${user.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据时出错:', error);
  }
}

checkInvoiceData();