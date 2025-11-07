const { Invoice } = require('./src/models');
const memoryDb = require('./src/config/memoryDatabase');

async function checkOctoberData() {
  try {
    console.log('=== 检查十月份数据 ===');
    
    // 检查数据库类型
    const dbType = process.env.DB_TYPE || 'memory';
    console.log(`使用 ${dbType} 数据库`);
    
    let allInvoices = [];
    
    if (dbType === 'memory') {
      // 内存数据库模式 - 直接从内存获取数据
      allInvoices = memoryDb.invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        totalAmount: invoice.totalAmount || invoice.total,
        status: invoice.status
      }));
    } else {
      // PostgreSQL模式
      allInvoices = await Invoice.findAll({
        order: [['issueDate', 'DESC']]
      });
    }
    
    console.log('所有发票数据:');
    allInvoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const month = date.toISOString().slice(0, 7);
      console.log(`ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}, 日期: ${invoice.issueDate}, 月份: ${month}, 金额: ${invoice.totalAmount || invoice.total}, 状态: ${invoice.status}`);
    });
    
    // 检查十月份数据
    const octoberInvoices = allInvoices.filter(invoice => {
      const month = new Date(invoice.issueDate).toISOString().slice(0, 7);
      return month === '2025-10';
    });
    
    console.log('\n=== 十月份发票数据 ===');
    console.log(`十月份发票总数: ${octoberInvoices.length}`);
    
    if (octoberInvoices.length > 0) {
      const totalRevenue = octoberInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.total || 0), 0);
      console.log(`十月份总收入: ${totalRevenue}`);
      
      octoberInvoices.forEach(invoice => {
        console.log(`- ${invoice.invoiceNumber}: ${invoice.totalAmount || invoice.total} (${invoice.status})`);
      });
    } else {
      console.log('没有找到十月份的发票数据');
    }
    
    // 检查九月份数据作为对比
    const septemberInvoices = allInvoices.filter(invoice => {
      const month = new Date(invoice.issueDate).toISOString().slice(0, 7);
      return month === '2025-09';
    });
    
    console.log('\n=== 九月份发票数据（对比） ===');
    console.log(`九月份发票总数: ${septemberInvoices.length}`);
    
    if (septemberInvoices.length > 0) {
      const totalRevenue = septemberInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || inv.total || 0), 0);
      console.log(`九月份总收入: ${totalRevenue}`);
    }
    
  } catch (error) {
    console.error('检查数据时出错:', error);
  }
}

checkOctoberData();