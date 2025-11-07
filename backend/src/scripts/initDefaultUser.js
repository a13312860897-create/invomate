const bcrypt = require('bcryptjs');
const memoryDb = require('../config/memoryDatabase');

// 创建默认用户
async function createDefaultUser() {
  try {
    // 检查是否已存在用户
    const existingUser = memoryDb.findUserByEmail('a13312860897@163.com');
    if (existingUser) {
      console.log('用户已存在:', existingUser.email);
      return existingUser;
    }

    // 创建新用户
    const userData = {
      email: 'a13312860897@163.com',
      password: await bcrypt.hash('Ddtb959322', 10),
      firstName: '用户',
      lastName: '测试',
      companyName: '',
      currency: 'CNY',
      language: 'zh',
      emailVerified: true
    };

    const newUser = memoryDb.createUser(userData);
    console.log('默认用户创建成功:', newUser.email);
    console.log('用户ID:', newUser.id);
    
    // 创建默认客户端数据
    createDefaultClients(newUser.id);
    
    // 创建默认发票模板
    const template = createDefaultTemplates(newUser.id);
    
    // 创建默认发票
    createDefaultInvoices(newUser.id, template.id);
    
    return newUser;
  } catch (error) {
    console.error('创建默认用户失败:', error);
    throw error;
  }
}

// 创建默认客户端数据
function createDefaultClients(userId) {
  try {
    const defaultClients = [
      {
        name: '测试客户1',
        email: 'client1@example.com',
        company: '客户公司1',
        phone: '13800138000',
        address: '北京市朝阳区测试街道1号',
        userId: userId
      },
      {
        name: '测试客户2',
        email: 'client2@example.com',
        company: '客户公司2',
        phone: '13900139000',
        address: '上海市浦东新区测试街道2号',
        userId: userId
      }
    ];

    for (const clientData of defaultClients) {
      memoryDb.createClient(clientData);
    }
    
    console.log('默认客户端数据创建成功');
  } catch (error) {
    console.error('创建默认客户端失败:', error);
  }
}

// 创建默认发票模板
function createDefaultTemplates(userId) {
  try {
    const defaultTemplate = {
      name: '标准发票模板',
      description: '默认的标准发票模板',
      templateConfig: JSON.stringify({
        layout: 'standard',
        showLogo: true,
        showCompanyInfo: true,
        showClientInfo: true,
        showItemDetails: true,
        showTotals: true,
        fields: [
          { name: 'invoiceNumber', label: '发票编号', type: 'text', required: true },
          { name: 'invoiceDate', label: '发票日期', type: 'date', required: true },
          { name: 'dueDate', label: '到期日期', type: 'date', required: true },
          { name: 'items', label: '项目', type: 'array', required: true }
        ]
      }),
      isDefault: true,
      isActive: true,
      userId: userId
    };

    const template = memoryDb.createInvoiceTemplate(defaultTemplate);
    console.log('默认发票模板创建成功，模板ID:', template.id);
    
    return template;
  } catch (error) {
    console.error('创建默认发票模板失败:', error);
  }
}

// 创建默认发票
function createDefaultInvoices(userId, templateId) {
  try {
    // 获取默认客户端
    const clients = memoryDb.findClientsByUserId(userId);
    if (clients.length === 0) {
      console.log('没有可用的客户端，跳过创建默认发票');
      return;
    }

    // 创建默认发票数据
    const defaultInvoice = {
      invoiceNumber: 'INV-2024-001',
      clientId: clients[0].id,
      userId: userId,
      templateId: templateId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天后
      status: 'draft',
      currency: 'CNY',
      invoiceMode: 'intl',
      taxSystem: 'standard',
      notes: '这是一个示例发票，展示了系统的发票创建功能。'
    };

    const invoice = memoryDb.createInvoice(defaultInvoice);
    console.log('默认发票创建成功，发票ID:', invoice.id);

    // 创建发票项目
    const defaultItems = [
      {
        description: '网站开发服务',
        quantity: 10,
        unitPrice: 150.00,
        taxRate: 13,
        invoiceId: invoice.id
      },
      {
        description: 'UI/UX设计服务',
        quantity: 5,
        unitPrice: 200.00,
        taxRate: 13,
        invoiceId: invoice.id
      }
    ];

    for (const itemData of defaultItems) {
      memoryDb.createInvoiceItem(itemData);
    }

    console.log('默认发票项目创建成功');
    
    return invoice;
  } catch (error) {
    console.error('创建默认发票失败:', error);
  }
}

// 导出函数
module.exports = { createDefaultUser };

// 如果直接运行此脚本，则创建默认用户
if (require.main === module) {
  createDefaultUser()
    .then(() => {
      console.log('默认用户初始化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('初始化失败:', error);
      process.exit(1);
    });
}