// 创建十月份测试发票的脚本
require('dotenv').config();
const { getDatabase } = require('./src/config/dbFactory');

async function createOctoberTestInvoices() {
  try {
    console.log('开始创建十月份测试发票...');
    
    const { sequelize } = getDatabase();
    
    // 获取测试用户ID (默认为1)
    const userId = 1;
    
    // 获取现有客户
    const clients = sequelize.findClientsByUserId ? sequelize.findClientsByUserId(userId) : [];
    console.log(`找到 ${clients.length} 个客户`);
    
    if (clients.length === 0) {
      console.log('❌ 没有找到客户，无法创建发票');
      return;
    }
    
    // 创建两张十月份发票
    const octoberInvoices = [
      {
        userId: userId,
        clientId: clients[0].id,
        invoiceNumber: 'INV-2025-10-001',
        issueDate: '2025-10-05',
        dueDate: '2025-11-05',
        status: 'sent',
        subtotal: 1200.00,
        taxAmount: 240.00,
        totalAmount: 1440.00,
        currency: 'EUR',
        notes: '十月份测试发票 #1 - 网站开发服务',
        paymentTerms: '30天',
        invoiceMode: 'intl'
      },
      {
        userId: userId,
        clientId: clients[1] ? clients[1].id : clients[0].id,
        invoiceNumber: 'INV-2025-10-002',
        issueDate: '2025-10-15',
        dueDate: '2025-11-15',
        status: 'paid',
        subtotal: 800.00,
        taxAmount: 160.00,
        totalAmount: 960.00,
        currency: 'EUR',
        notes: '十月份测试发票 #2 - 咨询服务',
        paymentTerms: '30天',
        invoiceMode: 'intl'
      }
    ];
    
    const createdInvoices = [];
    
    for (const invoiceData of octoberInvoices) {
      const invoice = sequelize.createInvoice(invoiceData);
      createdInvoices.push(invoice);
      
      // 为每张发票创建发票项目
      const items = [
        {
          invoiceId: invoice.id,
          description: invoiceData.notes.includes('#1') ? '网站开发' : '咨询服务',
          quantity: 1,
          unitPrice: invoiceData.subtotal,
          totalPrice: invoiceData.subtotal,
          taxRate: 20
        }
      ];
      
      for (const itemData of items) {
        sequelize.createInvoiceItem(itemData);
      }
      
      console.log(`✅ 创建发票: ${invoice.invoiceNumber} (${invoice.status}) - €${invoice.totalAmount}`);
    }
    
    // 验证创建结果
    const allInvoices = sequelize.findInvoicesByUserId(userId);
    console.log(`\n📊 创建完成统计:`);
    console.log(`- 总发票数量: ${allInvoices.length}`);
    console.log(`- 十月份发票: ${allInvoices.filter(inv => inv.issueDate.startsWith('2025-10')).length}`);
    
    // 显示发票详情
    console.log('\n📋 发票详情:');
    allInvoices.forEach(invoice => {
      console.log(`  ${invoice.invoiceNumber}: ${invoice.issueDate} - €${invoice.totalAmount} (${invoice.status})`);
    });
    
    console.log('\n🎉 十月份测试发票创建完成！');
    
  } catch (error) {
    console.error('❌ 创建测试发票时出错:', error);
    process.exit(1);
  }
}

// 运行脚本
createOctoberTestInvoices();