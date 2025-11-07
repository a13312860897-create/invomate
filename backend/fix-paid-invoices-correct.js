const memoryDb = require('./src/config/memoryDatabase');

async function fixPaidInvoicesCorrect() {
  try {
    console.log('🔧 正确修复已支付发票的paidDate字段...');
    
    // 获取所有发票
    const allInvoices = memoryDb.findAllInvoices();
    console.log(`📊 总发票数量: ${allInvoices.length}`);
    
    // 找到所有已支付但没有paidDate的发票
    const paidInvoicesWithoutDate = allInvoices.filter(inv => 
      inv.status === 'paid' && !inv.paidDate
    );
    
    console.log(`🔍 找到 ${paidInvoicesWithoutDate.length} 张已支付但没有paidDate的发票`);
    
    // 修复这些发票
    paidInvoicesWithoutDate.forEach((invoice, index) => {
      const paidDate = new Date();
      paidDate.setDate(paidDate.getDate() - (index * 5)); // 分别在5天前、10天前等支付
      
      const updatedInvoice = memoryDb.updateInvoice(invoice.id, {
        paidDate: paidDate.toISOString()
      });
      
      console.log(`✅ 发票 ${invoice.id} 设置paidDate: ${paidDate.toISOString().slice(0, 10)}`);
    });
    
    // 将更多发票标记为已支付，用于测试
    const unpaidInvoices = allInvoices.filter(inv => inv.status !== 'paid').slice(0, 3);
    console.log(`\n🎯 将 ${unpaidInvoices.length} 张发票标记为已支付...`);
    
    unpaidInvoices.forEach((invoice, index) => {
      const paidDate = new Date();
      paidDate.setDate(paidDate.getDate() - (index * 7 + 15)); // 分别在15天前、22天前、29天前支付
      
      const updatedInvoice = memoryDb.updateInvoice(invoice.id, {
        status: 'paid',
        paidDate: paidDate.toISOString()
      });
      
      console.log(`✅ 发票 ${invoice.id} 标记为已支付，支付日期: ${paidDate.toISOString().slice(0, 10)}`);
    });
    
    // 验证修复结果
    console.log('\n📋 验证修复结果...');
    const finalPaidInvoices = memoryDb.findAllInvoices().filter(inv => inv.status === 'paid');
    console.log(`💰 最终已支付发票数量: ${finalPaidInvoices.length}`);
    
    finalPaidInvoices.forEach((invoice, index) => {
      console.log(`发票 ${index + 1}:`);
      console.log(`  - ID: ${invoice.id}`);
      console.log(`  - 金额: ${invoice.totalAmount || invoice.total || invoice.amount}`);
      console.log(`  - 状态: ${invoice.status}`);
      console.log(`  - 支付日期: ${invoice.paidDate ? invoice.paidDate.slice(0, 10) : '未设置'}`);
      console.log('---');
    });
    
    console.log('\n✨ 修复完成！现在Revenue图表应该有数据了。');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixPaidInvoicesCorrect();