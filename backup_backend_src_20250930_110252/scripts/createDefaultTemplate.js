const { InvoiceTemplate, TemplateField } = require('../models');
const { getDatabase } = require('../config/dbFactory');

// 创建默认发票模板
async function createDefaultTemplate(userId) {
  try {
    // 检查是否已存在默认模板
    const existingDefault = await InvoiceTemplate.findOne({
      where: { 
        userId: userId,
        isDefault: true,
        isActive: true 
      }
    });

    if (existingDefault) {
      console.log('默认模板已存在');
      return existingDefault;
    }

    // 默认模板配置
    const defaultTemplateConfig = {
      layout: 'standard',
      showLogo: true,
      showCompanyInfo: true,
      showClientInfo: true,
      showItemDetails: true,
      showTotals: true,
      fields: [
        {
          fieldName: 'projectName',
          fieldLabel: '项目名称',
          fieldType: 'text',
          required: false,
          position: 1,
          targetEntity: 'invoice',
          defaultValue: ''
        },
        {
          fieldName: 'paymentTerms',
          fieldLabel: '付款条款',
          fieldType: 'select',
          required: false,
          position: 2,
          targetEntity: 'invoice',
          options: ['净30天', '净15天', '净7天', '即付'],
          defaultValue: '净30天'
        },
        {
          fieldName: 'reference',
          fieldLabel: '参考编号',
          fieldType: 'text',
          required: false,
          position: 3,
          targetEntity: 'invoice',
          defaultValue: ''
        }
      ]
    };

    // 创建默认模板
    const template = await InvoiceTemplate.create({
      name: '标准发票模板',
      description: '系统默认的标准发票模板，包含常用的自定义字段',
      templateConfig: JSON.stringify(defaultTemplateConfig),
      fieldMappings: null,
      isDefault: true,
      isActive: true,
      userId: userId
    });

    console.log('默认模板创建成功:', template.id);

    // 创建模板字段
    const templateFields = defaultTemplateConfig.fields.map(field => ({
      ...field,
      templateId: template.id,
      options: field.options ? JSON.stringify(field.options) : null,
      validation: null
    }));

    await TemplateField.bulkCreate(templateFields);
    console.log('默认模板字段创建成功');

    return template;
  } catch (error) {
    console.error('创建默认模板失败:', error);
    throw error;
  }
}

// 为所有用户创建默认模板
async function createDefaultTemplatesForAllUsers() {
  try {
    const { getDatabase } = require('../config/dbFactory');
    const dbType = process.env.DB_TYPE || 'postgres';
    
    let users = [];
    if (dbType === 'memory') {
      const db = getDatabase();
      const memoryDb = db.sequelize;
      users = memoryDb.findAllUsers();
      
      // 如果内存数据库中没有用户，创建一个测试用户
      if (users.length === 0) {
        const testUser = memoryDb.createUser({
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test User',
          isActive: true
        });
        users = [testUser];
        console.log('创建了测试用户:', testUser.email);
      }
    } else {
      const { User } = require('../models');
      users = await User.findAll();
    }
    
    for (const user of users) {
      await createDefaultTemplate(user.id);
    }
    
    console.log(`为 ${users.length} 个用户创建了默认模板`);
  } catch (error) {
    console.error('批量创建默认模板失败:', error);
  }
}

module.exports = {
  createDefaultTemplate,
  createDefaultTemplatesForAllUsers
};

// 如果直接运行此脚本
if (require.main === module) {
  createDefaultTemplatesForAllUsers().then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}