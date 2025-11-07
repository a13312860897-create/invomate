const { getDatabase } = require('./src/config/dbFactory');
const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 检查测试发票创建脚本执行情况 ===\n');

async function checkTestInvoicesExecution() {
  try {
    // 检查数据库模式
    const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE;
    console.log('1. 数据库模式:', isMemoryMode ? '内存模式' : 'Sequelize模式');
    
    // 检查内存数据库状态
    console.log('\n2. 内存数据库当前状态:');
    console.log('   发票总数:', memoryDb.invoices.length);
    
    if (memoryDb.invoices.length > 0) {
      console.log('   发票详情:');
      memoryDb.invoices.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}`);
        console.log(`      状态: ${invoice.status}, 金额: ${invoice.total}`);
        console.log(`      创建时间: ${invoice.createdAt}`);
        console.log(`      发票日期: ${invoice.issueDate}`);
        if (invoice.paidDate) {
          console.log(`      支付日期: ${invoice.paidDate}`);
        }
        console.log('');
      });
    }
    
    // 尝试手动执行create-test-invoices脚本
    console.log('\n3. 手动执行create-test-invoices脚本:');
    if (isMemoryMode) {
      try {
        const { createTestInvoices } = require('./scripts/create-test-invoices');
        console.log('   脚本加载成功，开始执行...');
        await createTestInvoices();
        console.log('   脚本执行完成');
        
        // 检查执行后的状态
        console.log('\n4. 脚本执行后的内存数据库状态:');
        console.log('   发票总数:', memoryDb.invoices.length);
        
        // 按月份统计
        const monthlyStats = {};
        memoryDb.invoices.forEach(invoice => {
          if (invoice.createdAt) {
            const month = new Date(invoice.createdAt).toISOString().slice(0, 7);
            if (!monthlyStats[month]) {
              monthlyStats[month] = { total: 0, paid: 0, pending: 0, draft: 0, sent: 0 };
            }
            monthlyStats[month].total++;
            monthlyStats[month][invoice.status] = (monthlyStats[month][invoice.status] || 0) + 1;
          }
        });
        
        console.log('   按月份统计:');
        Object.entries(monthlyStats).forEach(([month, stats]) => {
          console.log(`   ${month}: 总计${stats.total}张 (paid: ${stats.paid || 0}, pending: ${stats.pending || 0}, draft: ${stats.draft || 0}, sent: ${stats.sent || 0})`);
        });
        
      } catch (error) {
        console.error('   脚本执行失败:', error.message);
        console.error('   错误详情:', error);
      }
    } else {
      console.log('   非内存模式，跳过测试发票创建');
    }
    
    // 检查2025年9月的发票
    console.log('\n5. 2025年9月发票详情:');
    const septemberInvoices = memoryDb.invoices.filter(invoice => {
      if (invoice.createdAt) {
        const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
        return createdMonth === '2025-09';
      }
      return false;
    });
    
    console.log(`   2025年9月发票数量: ${septemberInvoices.length}`);
    septemberInvoices.forEach(invoice => {
      console.log(`   - ${invoice.invoiceNumber}: ${invoice.status}, ¥${invoice.total}, 创建于${invoice.createdAt}`);
    });
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

checkTestInvoicesExecution();