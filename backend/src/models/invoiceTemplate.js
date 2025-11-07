// 发票模板模型 - 用于存储DIY发票配置
const InvoiceTemplate = (sequelize, DataTypes) => {
  const InvoiceTemplateModel = sequelize.define('InvoiceTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '模板名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '模板描述'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为默认模板'
    },
    templateConfig: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '模板配置JSON字符串'
    },
    fieldMappings: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '字段映射配置JSON字符串'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否激活'
    }
  }, {
    tableName: 'invoice_templates',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['isDefault']
      }
    ]
  });

  return InvoiceTemplateModel;
};

module.exports = InvoiceTemplate;