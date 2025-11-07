/**
 * 创建测试发票数据
 * 用于内存模式下测试数据一致性
 */

const { getDatabase } = require('../src/config/dbFactory');
const { Invoice, Client, User } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function createTestInvoices() {
  try {
    console.log('开始创建测试发票数据...');
    
    const db = getDatabase();
    
    // 获取第一个用户
    let user;
    const memoryDb = require('../src/config/memoryDatabase');
    
    // 首先尝试从内存数据库获取用户
    const users = memoryDb.findAllUsers();
    if (users.length > 0) {
      user = users[0];
      console.log('从内存数据库找到用户:', user.email, 'ID:', user.id);
    } else {
      console.log('内存数据库中没有用户');
      return;
    }
    
    if (!user) {
      console.log('未找到用户，跳过测试数据创建');
      return;
    }
    
    // 获取客户
    const clients = memoryDb.findClientsByUserId(user.id).slice(0, 3);
    console.log(`找到 ${clients.length} 个客户`);
    
    if (!clients || clients.length === 0) {
      console.log('未找到客户，跳过测试数据创建');
      return;
    }
    
    // 创建不同状态的测试发票，包含一些逾期发票
    const now = new Date();
    const testInvoices = [
      {
        invoiceNumber: 'INV-2024-001',
        clientId: clients[0].id,
        userId: user.id,
        amount: 1500.00,
        tax: 150.00,
        totalAmount: 1650.00,
        status: 'draft',
        issueDate: new Date('2024-10-01'),
        dueDate: new Date('2024-10-31'),
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-01')
      },
      {
        invoiceNumber: 'INV-2024-002',
        clientId: clients[1].id,
        userId: user.id,
        amount: 2500.00,
        tax: 250.00,
        totalAmount: 2750.00,
        status: 'sent',
        issueDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-30'), // 已过期
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-01')
      },
      {
        invoiceNumber: 'INV-2024-003',
        clientId: clients[2].id,
        userId: user.id,
        amount: 3200.00,
        tax: 320.00,
        totalAmount: 3520.00,
        status: 'sent',
        issueDate: new Date('2024-08-01'),
        dueDate: new Date('2024-08-31'), // 已过期
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-08-01')
      },
      {
        invoiceNumber: 'INV-2024-004',
        clientId: clients[0].id,
        userId: user.id,
        amount: 1800.00,
        tax: 180.00,
        totalAmount: 1980.00,
        status: 'paid',
        issueDate: new Date('2024-10-12'),
        dueDate: new Date('2024-10-31'),
        paidDate: new Date('2024-10-21'),
        paidAt: new Date('2024-10-21T16:45:00.000Z'),
        createdAt: new Date('2024-10-12'),
        updatedAt: new Date('2024-10-21')
      },
      {
        invoiceNumber: 'INV-2025-001',
        clientId: clients[1].id,
        userId: user.id,
        amount: 2200.00,
        tax: 220.00,
        totalAmount: 2420.00,
        status: 'sent',
        issueDate: now,
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30天后到期
        createdAt: now,
        updatedAt: now
      },
      {
        invoiceNumber: 'INV-2024-005',
        clientId: clients[2].id,
        userId: user.id,
        amount: 1600.00,
        tax: 160.00,
        totalAmount: 1760.00,
        status: 'sent',
        issueDate: new Date('2024-07-01'),
        dueDate: new Date('2024-07-31'), // 已过期
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-01')
      }
    ];
    
    // 检查是否已存在测试发票
    for (const invoiceData of testInvoices) {
      try {
        // 检查发票是否已存在
        const invoices = memoryDb.findAllInvoices();
        const existing = invoices.find(inv => inv.invoiceNumber === invoiceData.invoiceNumber);
        
        if (!existing) {
          // 添加userId到发票数据
          const invoiceDataWithUserId = {
            ...invoiceData,
            userId: user.id
          };
          
          const createdInvoice = memoryDb.createInvoice(invoiceDataWithUserId);
          console.log(`创建测试发票: ${invoiceData.invoiceNumber} - 状态: ${invoiceData.status} - 金额: ${invoiceData.totalAmount}`);
          
          // 为每个发票创建测试发票项目
          const invoiceItems = [
            {
              invoiceId: createdInvoice.id,
              description: `服务项目 1 - ${invoiceData.invoiceNumber}`,
              quantity: 1,
              unitPrice: invoiceData.amount * 0.6, // 60% 的金额
              totalPrice: invoiceData.amount * 0.6
            },
            {
              invoiceId: createdInvoice.id,
              description: `服务项目 2 - ${invoiceData.invoiceNumber}`,
              quantity: 2,
              unitPrice: invoiceData.amount * 0.2, // 40% 的金额分成2个单位
              totalPrice: invoiceData.amount * 0.4
            }
          ];
          
          // 创建发票项目
          invoiceItems.forEach(item => {
            memoryDb.createInvoiceItem(item);
            console.log(`  - 创建发票项目: ${item.description} - 数量: ${item.quantity} - 单价: ${item.unitPrice}`);
          });
          
        } else {
          console.log(`测试发票已存在: ${invoiceData.invoiceNumber}`);
        }
      } catch (error) {
        console.error(`创建发票 ${invoiceData.invoiceNumber} 失败:`, error.message);
      }
    }
    
    console.log('测试发票数据创建完成');
    
    // 验证创建的发票
    const invoices = memoryDb.findAllInvoices();
    
    console.log(`\n=== 测试发票数据创建完成 ===`);
    console.log(`总发票数: ${invoices.length}`);
    
    const statusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('状态分布:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    const totalRevenue = invoices.reduce((sum, inv) => {
      return sum + (inv.totalAmount || 0);
    }, 0);
    
    console.log(`总收入: ${totalRevenue.toFixed(2)}`);
    
  } catch (error) {
    console.error('创建测试发票数据失败:', error);
  }
}

module.exports = {
  createTestInvoices
};