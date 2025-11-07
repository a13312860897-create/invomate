// 简单的内存数据库模拟
// 用于临时替代PostgreSQL/SQLite数据库

class MemoryDatabase {
  constructor() {
    this.users = [];
    this.clients = [];
    this.invoices = [];
    this.invoiceItems = [];
    this.payments = [];
    this.paymentRecords = [];
    this.reminderLogs = [];
    this.subscriptions = [];
    this.invoiceSendingHistory = [];  // 添加发票发送历史记录
    this.paymentLinks = [];  // 添加支付链接数组

    this.invoiceTemplates = [];
    this.templateFields = [];
    this.settings = [];
    this.deletedNotifications = []; // 跟踪已删除的通知
    this.nextIds = {
      users: 1,
      clients: 1,
      invoices: 1,
      invoiceItems: 1,
      payments: 1,
      paymentRecords: 1,
      reminderLogs: 1,
      subscriptions: 1,
      invoiceSendingHistory: 1,  // 添加发送历史ID计数器
      paymentLinks: 1,  // 添加支付链接ID计数器

      invoiceTemplates: 1,
      templateFields: 1,
      settings: 1
    };

    // 添加初始测试客户数据
    this.initializeTestDataSync();
  }

  // 初始化测试数据 - 同步版本
  initializeTestDataSync() {
    const bcrypt = require('bcryptjs');
    
    // 生成指定测试账号密码哈希 - 同步版本
    const passwordHash = bcrypt.hashSync('Ddtb959322', 10);
    
    // 添加测试用户数据 - 使用与默认用户相同的邮箱和正确的密码哈希
    const testUser = {
      id: this.generateId('users'),
      username: 'testuser',
      email: 'a13312860897@163.com',
      password: passwordHash,
      firstName: '用户',
      lastName: '测试',
      role: 'user',
      subscription: 'professional', // 专业版订阅
      subscriptionStatus: 'expired', // 已过期状态
      subscriptionEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前过期
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      paddleTransactionId: null,
      emailVerified: true,
      // 同步Company对象中的数据到顶级字段
      companyName: 'TechSolutions SARL',
      address: '123 Avenue des Entrepreneurs',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      phone: '+33 1 42 86 83 00',
      vatNumber: 'FR12345678901',
      siren: '123456789',
      siretNumber: '12345678901234',
      legalForm: 'SARL',
      registeredCapital: '50000',
      rcsNumber: 'Paris B 123 456 789',
      nafCode: '6201Z',
      createdAt: new Date(),
      updatedAt: new Date(),
      Company: {
        name: 'TechSolutions SARL',
        address: '123 Avenue des Entrepreneurs',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        phone: '+33 1 42 86 83 00',
        email: 'contact@techsolutions.fr',
        siren: '123456789',
        siret: '12345678901234',
        vatNumber: 'FR12345678901',
        capital: 50000,
        rcs: 'Paris B 123 456 789'
      }
    };
    this.users.push(testUser);

    // 添加测试客户数据 (假设用户ID为1)
    const testClients = [
      {
        id: this.generateId('clients'),
        name: 'Jean Dupont',
        company: 'Dupont SARL',
        email: 'jean.dupont@example.com',
        phone: '+33 1 23 45 67 89',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        vatNumber: 'FR12345678901',
        siren: '123456789',
        siret: '12345678901234',
        // 交付地址字段
        deliveryAddress: '456 Rue de Livraison',
        deliveryCity: 'Paris',
        deliveryPostalCode: '75002',
        deliveryCountry: 'France',
        sameAsAddress: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('clients'),
        name: 'Marie Martin',
        company: 'Martin & Associés',
        email: 'marie.martin@example.com',
        phone: '+33 1 98 76 54 32',
        address: '456 Avenue des Champs',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France',
        vatNumber: 'FR98765432109',
        siren: '987654321',
        siret: '98765432109876',
        // 交付地址字段 - 与账单地址相同
        deliveryAddress: null,
        deliveryCity: null,
        deliveryPostalCode: null,
        deliveryCountry: null,
        sameAsAddress: true,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('clients'),
        name: 'Pierre Durand',
        company: 'Durand Consulting',
        email: 'pierre.durand@example.com',
        phone: '+33 1 11 22 33 44',
        address: '789 Boulevard Saint-Germain',
        city: 'Marseille',
        postalCode: '13001',
        country: 'France',
        vatNumber: 'FR11223344556',
        siren: '112233445',
        siret: '11223344556677',
        // 交付地址字段
        deliveryAddress: '321 Avenue de la Livraison',
        deliveryCity: 'Marseille',
        deliveryPostalCode: '13002',
        deliveryCountry: 'France',
        sameAsAddress: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.clients.push(...testClients);

    // 添加测试发票数据
    const testInvoices = [
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2024-001',
        issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20天后到期
        status: 'paid',
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前支付
        clientId: 1, // 对应第一个测试客户
        userId: 1,
        total: 1000.00,
        subtotal: 833.33,
        taxAmount: 166.67,
        notes: 'Test invoice for PDF generation - paid',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2024-002',
        issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15天前
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前过期
        status: 'paid',
        paidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前支付
        clientId: 2, // 对应第二个测试客户
        userId: 1,
        total: 1500.00,
        subtotal: 1250.00,
        taxAmount: 250.00,
        notes: 'Second test invoice - overdue for testing',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2024-006',
        issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45天前
        dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25天前到期
        status: 'paid',
        paidDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20天前支付
        clientId: 1,
        userId: 1,
        total: 800.00,
        subtotal: 666.67,
        taxAmount: 133.33,
        notes: 'Sixth test invoice - paid',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2024-007',
        issueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35天前
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15天前到期
        status: 'paid',
        paidDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前支付
        clientId: 2,
        userId: 1,
        total: 1800.00,
        subtotal: 1500.00,
        taxAmount: 300.00,
        notes: 'Seventh test invoice - paid',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2024-008',
        issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60天前
        dueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40天前到期
        status: 'paid',
        paidDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35天前支付
        clientId: 3,
        userId: 1,
        total: 2200.00,
        subtotal: 1833.33,
        taxAmount: 366.67,
        notes: 'Eighth test invoice - paid',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2025-003',
        issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25天前
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前过期
        status: 'sent',
        clientId: 1,
        userId: 1,
        total: 750.00,
        subtotal: 625.00,
        taxAmount: 125.00,
        notes: 'Third test invoice - moderately overdue',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2025-004',
        issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后到期
        status: 'sent',
        clientId: 2,
        userId: 1,
        total: 2000.00,
        subtotal: 1666.67,
        taxAmount: 333.33,
        notes: 'Fourth test invoice - due soon',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoices'),
        invoiceNumber: 'INV-2025-005',
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前到期
        status: 'paid',
        paidDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25天前支付
        clientId: 1,
        userId: 1,
        total: 1200.00,
        subtotal: 1000.00,
        taxAmount: 200.00,
        notes: 'Fifth test invoice - already paid',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.invoices.push(...testInvoices);

    // 添加测试发票项目
    const testInvoiceItems = [
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 1,
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: 100.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 2,
        description: 'Consulting Services',
        quantity: 15,
        unitPrice: 100.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 3,
        description: 'Design Services',
        quantity: 5,
        unitPrice: 125.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 4,
        description: 'Project Management',
        quantity: 20,
        unitPrice: 100.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 5,
        description: 'Maintenance Services',
        quantity: 10,
        unitPrice: 120.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 6,
        description: 'UI/UX Design',
        quantity: 8,
        unitPrice: 100.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 7,
        description: 'Backend Development',
        quantity: 15,
        unitPrice: 120.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId('invoiceItems'),
        invoiceId: 8,
        description: 'Full Stack Development',
        quantity: 22,
        unitPrice: 100.00,
        taxRate: 20.0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.invoiceItems.push(...testInvoiceItems);

    // 初始化空的发票数组 - 发票数据将由create-test-invoices脚本创建
    // 这样避免重复数据问题
  }

  // 模拟Sequelize的authenticate方法
  async authenticate() {
    console.log('Memory database connection established successfully');
    return Promise.resolve(true);
  }

  // 模拟Sequelize的sync方法
  async sync() {
    console.log('Memory database synced successfully');
    return Promise.resolve(true);
  }

  // 生成唯一ID
  generateId(table) {
    return this.nextIds[table]++;
  }

  // 用户相关操作
  createUser(userData) {
    const user = {
      id: this.generateId('users'),
      // 国际特定字段已被删除
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.users[userIndex];
    }
    return null;
  }

  findAllUsers() {
    return this.users;
  }

  deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
      return true;
    }
    return false;
  }

  // 客户相关操作
  createClient(clientData) {
    const client = {
      id: this.generateId('clients'),
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clients.push(client);
    return client;
  }

  findClientById(id) {
    return this.clients.find(client => client.id === id);
  }

  findClientsByUserId(userId) {
    return this.clients.filter(client => client.userId === userId);
  }

  findClientByUserId(userId) {
    return this.clients.find(client => client.userId === userId);
  }

  findAllClients() {
    return this.clients;
  }

  updateClient(id, updates) {
    const clientIndex = this.clients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      this.clients[clientIndex] = {
        ...this.clients[clientIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.clients[clientIndex];
    }
    return null;
  }

  deleteClient(id) {
    const clientIndex = this.clients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      this.clients.splice(clientIndex, 1);
      return true;
    }
    return false;
  }

  // 发票相关操作
  createInvoice(invoiceData) {
    const invoice = {
      id: this.generateId('invoices'),
      invoiceMode: 'intl',
      ...invoiceData,
      createdAt: invoiceData.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.invoices.push(invoice);
    return invoice;
  }

  findInvoiceById(id) {
    const invoice = this.invoices.find(invoice => invoice.id === id);
    if (invoice) {
      // 添加关联的发票项目
      invoice.InvoiceItems = this.invoiceItems.filter(item => item.invoiceId === id);
    }
    return invoice;
  }

  findInvoicesByUserId(userId) {
    return this.invoices.filter(invoice => invoice.userId === userId);
  }

  findInvoicesByClientId(clientId) {
    return this.invoices.filter(invoice => invoice.clientId === clientId);
  }

  findInvoiceByNumber(invoiceNumber) {
    return this.invoices.find(invoice => invoice.invoiceNumber === invoiceNumber);
  }

  findInvoiceByUserId(userId) {
    return this.invoices.find(invoice => invoice.userId === userId);
  }

  findAllInvoices() {
    return this.invoices;
  }

  updateInvoice(id, updates) {
    const invoiceIndex = this.invoices.findIndex(invoice => invoice.id === id);
    if (invoiceIndex !== -1) {
      this.invoices[invoiceIndex] = {
        ...this.invoices[invoiceIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.invoices[invoiceIndex];
    }
    return null;
  }

  deleteInvoice(id) {
    const invoiceIndex = this.invoices.findIndex(invoice => invoice.id === id);
    if (invoiceIndex !== -1) {
      // 同时删除相关的发票项目
      this.invoiceItems = this.invoiceItems.filter(item => item.invoiceId !== id);
      this.invoices.splice(invoiceIndex, 1);
      return true;
    }
    return false;
  }

  // 发票项目相关操作
  createInvoiceItem(itemData) {
    const item = {
      id: this.generateId('invoiceItems'),
      ...itemData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoiceItems.push(item);
    return item;
  }

  findInvoiceItemsByInvoiceId(invoiceId) {
    return this.invoiceItems.filter(item => item.invoiceId === invoiceId);
  }

  findInvoiceItemById(id) {
    return this.invoiceItems.find(item => item.id === id);
  }

  findInvoiceItemByInvoiceId(invoiceId) {
    return this.invoiceItems.find(item => item.invoiceId === invoiceId);
  }

  findAllInvoiceItems() {
    return this.invoiceItems;
  }

  updateInvoiceItem(id, updates) {
    const itemIndex = this.invoiceItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      this.invoiceItems[itemIndex] = {
        ...this.invoiceItems[itemIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.invoiceItems[itemIndex];
    }
    return null;
  }

  deleteInvoiceItem(id) {
    const itemIndex = this.invoiceItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      this.invoiceItems.splice(itemIndex, 1);
      return true;
    }
    return false;
  }

  // 支付相关操作
  createPayment(paymentData) {
    const payment = {
      id: this.generateId('payments'),
      ...paymentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.push(payment);
    return payment;
  }

  findPaymentById(id) {
    return this.payments.find(payment => payment.id === id);
  }

  findPaymentByIntentId(paymentIntentId) {
    return this.payments.find(payment => payment.paymentIntentId === paymentIntentId);
  }

  findPaymentByInvoiceId(invoiceId) {
    return this.payments.find(payment => payment.invoiceId === invoiceId);
  }

  findPaymentsByUserId(userId) {
    return this.payments.filter(payment => payment.userId === userId);
  }

  findPaymentsByInvoiceId(invoiceId) {
    return this.payments.filter(payment => payment.invoiceId === invoiceId);
  }

  findAllPayments() {
    return this.payments;
  }

  updatePayment(id, updates) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === id);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex] = {
        ...this.payments[paymentIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.payments[paymentIndex];
    }
    return null;
  }

  updatePaymentByIntentId(paymentIntentId, updates) {
    const paymentIndex = this.payments.findIndex(payment => payment.paymentIntentId === paymentIntentId);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex] = {
        ...this.payments[paymentIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.payments[paymentIndex];
    }
    return null;
  }

  deletePayment(id) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === id);
    if (paymentIndex !== -1) {
      this.payments.splice(paymentIndex, 1);
      return true;
    }
    return false;
  }

  // 支付记录相关操作
  createPaymentRecord(recordData) {
    const record = {
      id: this.generateId('paymentRecords'),
      ...recordData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.paymentRecords.push(record);
    return record;
  }

  findPaymentRecordById(id) {
    return this.paymentRecords.find(record => record.id === id);
  }

  findPaymentRecordsByPaymentId(paymentId) {
    return this.paymentRecords.filter(record => record.paymentId === paymentId);
  }

  findAllPaymentRecords() {
    return this.paymentRecords;
  }

  updatePaymentRecord(id, updates) {
    const recordIndex = this.paymentRecords.findIndex(record => record.id === id);
    if (recordIndex !== -1) {
      this.paymentRecords[recordIndex] = {
        ...this.paymentRecords[recordIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.paymentRecords[recordIndex];
    }
    return null;
  }

  deletePaymentRecord(id) {
    const recordIndex = this.paymentRecords.findIndex(record => record.id === id);
    if (recordIndex !== -1) {
      this.paymentRecords.splice(recordIndex, 1);
      return true;
    }
    return false;
  }

  // 催款提醒日志相关操作
  createReminderLog(logData) {
    const log = {
      id: this.generateId('reminderLogs'),
      ...logData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reminderLogs.push(log);
    return log;
  }

  findReminderLogById(id) {
    return this.reminderLogs.find(log => log.id === id);
  }

  findReminderLogsByInvoiceId(invoiceId) {
    return this.reminderLogs.filter(log => log.invoiceId === invoiceId);
  }

  findAllReminderLogs() {
    return this.reminderLogs;
  }

  updateReminderLog(id, updates) {
    const logIndex = this.reminderLogs.findIndex(log => log.id === id);
    if (logIndex !== -1) {
      this.reminderLogs[logIndex] = {
        ...this.reminderLogs[logIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.reminderLogs[logIndex];
    }
    return null;
  }

  deleteReminderLog(id) {
    const logIndex = this.reminderLogs.findIndex(log => log.id === id);
    if (logIndex !== -1) {
      this.reminderLogs.splice(logIndex, 1);
      return true;
    }
    return false;
  }

  // 测试连接
  async authenticate() {
    console.log('Memory database connection has been established successfully.');
    return true;
  }

  // 同步方法（模拟Sequelize的sync方法）
  async sync() {
    console.log('Memory database synced successfully.');
    return true;
  }

  // 订阅相关操作
  getSubscriptions() {
    return this.subscriptions;
  }

  createSubscription(subscriptionData) {
    const subscription = {
      id: this.generateId('subscriptions'),
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  findSubscriptionById(id) {
    return this.subscriptions.find(subscription => subscription.id === id);
  }

  findSubscriptionByPaddleId(paddleSubscriptionId) {
    return this.subscriptions.find(subscription => subscription.paddleSubscriptionId === paddleSubscriptionId);
  }

  findSubscriptionsByUserId(userId) {
    return this.subscriptions.filter(subscription => subscription.userId === userId);
  }

  findActiveSubscriptionByUserId(userId) {
    return this.subscriptions.find(subscription => 
      subscription.userId === userId && subscription.status === 'active'
    );
  }

  updateSubscription(id, updates) {
    const subscriptionIndex = this.subscriptions.findIndex(subscription => subscription.id === id);
    if (subscriptionIndex !== -1) {
      this.subscriptions[subscriptionIndex] = {
        ...this.subscriptions[subscriptionIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.subscriptions[subscriptionIndex];
    }
    return null;
  }

  updateSubscriptionByPaddleId(paddleSubscriptionId, updates) {
    const subscriptionIndex = this.subscriptions.findIndex(
      subscription => subscription.paddleSubscriptionId === paddleSubscriptionId
    );
    if (subscriptionIndex !== -1) {
      this.subscriptions[subscriptionIndex] = {
        ...this.subscriptions[subscriptionIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.subscriptions[subscriptionIndex];
    }
    return null;
  }

  deleteSubscription(id) {
    const subscriptionIndex = this.subscriptions.findIndex(subscription => subscription.id === id);
    if (subscriptionIndex !== -1) {
      this.subscriptions.splice(subscriptionIndex, 1);
      return true;
    }
    return false;
  }





  // InvoiceTemplate相关操作
  createInvoiceTemplate(templateData) {
    const template = {
      id: this.generateId('invoiceTemplates'),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoiceTemplates.push(template);
    return template;
  }

  findInvoiceTemplateById(id) {
    return this.invoiceTemplates.find(template => template.id === id);
  }

  findInvoiceTemplatesByUserId(userId) {
    return this.invoiceTemplates.filter(template => template.userId === userId);
  }

  findAllInvoiceTemplates() {
    return this.invoiceTemplates;
  }

  updateInvoiceTemplate(id, updates) {
    const templateIndex = this.invoiceTemplates.findIndex(template => template.id === id);
    if (templateIndex !== -1) {
      this.invoiceTemplates[templateIndex] = {
        ...this.invoiceTemplates[templateIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.invoiceTemplates[templateIndex];
    }
    return null;
  }

  deleteInvoiceTemplate(id) {
    const templateIndex = this.invoiceTemplates.findIndex(template => template.id === id);
    if (templateIndex !== -1) {
      // 同时删除相关的模板字段
      this.templateFields = this.templateFields.filter(field => field.templateId !== id);
      this.invoiceTemplates.splice(templateIndex, 1);
      return true;
    }
    return false;
  }

  // TemplateField相关操作
  createTemplateField(fieldData) {
    const field = {
      id: this.generateId('templateFields'),
      ...fieldData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templateFields.push(field);
    return field;
  }

  findTemplateFieldById(id) {
    return this.templateFields.find(field => field.id === id);
  }

  findTemplateFieldsByTemplateId(templateId) {
    return this.templateFields.filter(field => field.templateId === templateId);
  }

  findAllTemplateFields() {
    return this.templateFields;
  }

  updateTemplateField(id, updates) {
    const fieldIndex = this.templateFields.findIndex(field => field.id === id);
    if (fieldIndex !== -1) {
      this.templateFields[fieldIndex] = {
        ...this.templateFields[fieldIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.templateFields[fieldIndex];
    }
    return null;
  }

  deleteTemplateField(id) {
    const fieldIndex = this.templateFields.findIndex(field => field.id === id);
    if (fieldIndex !== -1) {
      this.templateFields.splice(fieldIndex, 1);
      return true;
    }
    return false;
  }

  deleteTemplateFieldsByTemplateId(templateId) {
    const initialLength = this.templateFields.length;
    this.templateFields = this.templateFields.filter(field => field.templateId !== templateId);
    return initialLength - this.templateFields.length;
  }

  // 设置相关操作
  createSettings(settingsData) {
    const settings = {
      id: this.generateId('settings'),
      ...settingsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.settings.push(settings);
    return settings;
  }

  findSettingsByUserId(userId) {
    const existingSettings = this.settings.find(settings => settings.userId === userId);
    if (existingSettings) {
      return existingSettings;
    }
    
    // 如果没有找到用户设置，从用户数据中获取公司信息作为默认设置
    const user = this.findUserById(userId);
    if (user) {
      return {
        id: this.generateId('settings'),
        userId: userId,
        invoiceMode: 'fr',
        modeConfig: {
          fr: {
            companyName: user.companyName || user.Company?.name || 'TechSolutions SARL',
            address: user.address || user.Company?.address || '123 Avenue des Entrepreneurs',
            city: user.city || user.Company?.city || 'Paris',
            postalCode: user.postalCode || user.Company?.postalCode || '75001',
            country: user.country || user.Company?.country || 'France',
            email: user.email || user.Company?.email || 'contact@techsolutions.fr',
            phone: user.phone || user.Company?.phone || '+33 1 42 86 83 00',
            vatNumber: user.vatNumber || user.Company?.vatNumber || 'FR12345678901',
            siren: user.siren || user.Company?.siren || '123456789',
            siret: user.siretNumber || user.Company?.siret || '12345678901234',
            nafCode: user.nafCode || '6201Z',
            rcsNumber: user.rcsNumber || user.Company?.rcs || 'Paris B 123 456 789',
            legalForm: user.legalForm || 'SARL',
            registeredCapital: user.registeredCapital || user.Company?.capital || '50000'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // 如果用户不存在，返回默认设置
    return {
      id: this.generateId('settings'),
      userId: userId,
      invoiceMode: 'fr',
      modeConfig: {
        fr: {
          companyName: 'TechSolutions SARL',
          address: '123 Avenue des Entrepreneurs',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          email: 'contact@techsolutions.fr',
          phone: '+33 1 42 86 83 00',
          vatNumber: 'FR12345678901',
          siren: '123456789',
          siret: '12345678901234',
          nafCode: '6201Z',
          rcsNumber: 'Paris B 123 456 789',
          legalForm: 'SARL',
          registeredCapital: '50000'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  findAllSettings() {
    return this.settings;
  }

  findSettingsById(id) {
    return this.settings.find(settings => settings.id === id) || null;
  }

  updateSettings(id, updates) {
    const settingsIndex = this.settings.findIndex(settings => settings.id === id);
    if (settingsIndex !== -1) {
      this.settings[settingsIndex] = {
        ...this.settings[settingsIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.settings[settingsIndex];
    }
    return null;
  }

  updateSettingsByUserId(userId, updates) {
    const settingsIndex = this.settings.findIndex(settings => settings.userId === userId);
    if (settingsIndex !== -1) {
      this.settings[settingsIndex] = {
        ...this.settings[settingsIndex],
        ...updates,
        updatedAt: new Date()
      };
      return this.settings[settingsIndex];
    }
    return null;
  }

  deleteSettings(id) {
    const settingsIndex = this.settings.findIndex(settings => settings.id === id);
    if (settingsIndex !== -1) {
      this.settings.splice(settingsIndex, 1);
      return true;
    }
    return false;
  }

  deleteSettingsByUserId(userId) {
    const settingsIndex = this.settings.findIndex(settings => settings.userId === userId);
    if (settingsIndex !== -1) {
      this.settings.splice(settingsIndex, 1);
      return true;
    }
    return false;
  }
}

// 创建数据库实例
const memoryDb = new MemoryDatabase();

// 测试连接（注释掉以避免在加载模块时自动执行）
// memoryDb.authenticate();

module.exports = memoryDb;