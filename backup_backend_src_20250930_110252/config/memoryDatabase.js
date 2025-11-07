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

    this.invoiceTemplates = [];
    this.templateFields = [];
    this.settings = [];
    this.nextIds = {
      users: 1,
      clients: 1,
      invoices: 1,
      invoiceItems: 1,
      payments: 1,
      paymentRecords: 1,
      reminderLogs: 1,
      subscriptions: 1,

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
    
    // 生成正确的密码哈希 - 同步版本
    const passwordHash = bcrypt.hashSync('Ddtb959322', 10);
    
    // 添加测试用户数据 - 使用与默认用户相同的邮箱和正确的密码哈希
    const testUser = {
      id: this.generateId('users'),
      username: 'testuser',
      email: 'a133128860897@163.com',
      password: passwordHash,
      firstName: '用户',
      lastName: '测试',
      role: 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
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
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.clients.push(...testClients);

    // 初始化空的发票数组 - 发票数据将由create-test-invoices脚本创建
    // 这样避免重复数据问题
    
    console.log('Memory database initialized with test data:', testClients.length, 'clients, 0 invoices (will be created by create-test-invoices script), 1 user');
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
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoices.push(invoice);
    return invoice;
  }

  findInvoiceById(id) {
    return this.invoices.find(invoice => invoice.id === id);
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
    return this.settings.find(settings => settings.userId === userId) || {
      id: this.generateId('settings'),
      userId: userId,
      invoiceMode: 'intl',
      modeConfig: {
        intl: {
          name: 'Default Company',
          address: 'Default Address',
          city: 'Default City',
          postalCode: '00000',
          country: 'Default Country',
          email: 'default@example.com',
          phone: '+1234567890'
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