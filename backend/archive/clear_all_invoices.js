// 清除所有发票数据的脚本
require('dotenv').config();
const { getDatabase } = require('./src/config/dbFactory');

async function clearAllInvoices() {
  try {
    console.log('开始清除所有发票数据...');
    
    const { sequelize } = getDatabase();
    
    // 获取当前数据统计
    const invoicesBefore = sequelize.findAllInvoices ? sequelize.findAllInvoices() : [];
    const clientsBefore = sequelize.findAllClients ? sequelize.findAllClients() : [];
    
    console.log(`清除前统计:`);
    console.log(`- 发票数量: ${invoicesBefore.length}`);
    console.log(`- 客户数量: ${clientsBefore.length}`);
    
    // 清除发票数据
    if (sequelize.invoices) {
      sequelize.invoices.length = 0;
      console.log('✅ 已清除所有发票');
    }
    
    // 清除发票项目数据
    if (sequelize.invoiceItems) {
      sequelize.invoiceItems.length = 0;
      console.log('✅ 已清除所有发票项目');
    }
    
    // 清除支付记录
    if (sequelize.payments) {
      sequelize.payments.length = 0;
      console.log('✅ 已清除所有支付记录');
    }
    
    // 清除提醒日志
    if (sequelize.reminderLogs) {
      sequelize.reminderLogs.length = 0;
      console.log('✅ 已清除所有提醒日志');
    }
    
    // 重置ID计数器
    if (sequelize.nextIds) {
      sequelize.nextIds.invoices = 1;
      sequelize.nextIds.invoiceItems = 1;
      sequelize.nextIds.payments = 1;
      sequelize.nextIds.reminderLogs = 1;
      console.log('✅ 已重置ID计数器');
    }
    
    // 验证清除结果
    const invoicesAfter = sequelize.findAllInvoices ? sequelize.findAllInvoices() : [];
    const clientsAfter = sequelize.findAllClients ? sequelize.findAllClients() : [];
    
    console.log(`\n清除后统计:`);
    console.log(`- 发票数量: ${invoicesAfter.length}`);
    console.log(`- 客户数量: ${clientsAfter.length}`);
    
    console.log('\n🎉 所有发票数据已成功清除！');
    
  } catch (error) {
    console.error('❌ 清除发票数据时出错:', error);
    process.exit(1);
  }
}

// 运行脚本
clearAllInvoices();