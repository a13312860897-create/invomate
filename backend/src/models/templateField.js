// 模板字段模型 - 用于存储模板中的字段配置
const TemplateField = (sequelize, DataTypes) => {
  const TemplateFieldModel = sequelize.define('TemplateField', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'InvoiceTemplates',
        key: 'id'
      }
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字段名称'
    },
    fieldLabel: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字段显示标签'
    },
    fieldType: {
      type: DataTypes.ENUM('fixed', 'flexible'),
      allowNull: false,
      comment: '字段类型：fixed-固定值，flexible-灵活值'
    },
    valueType: {
      type: DataTypes.ENUM('text', 'number', 'date', 'select', 'checkbox'),
      allowNull: false,
      defaultValue: 'text',
      comment: '值类型'
    },
    fixedValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '固定值（当fieldType为fixed时使用）'
    },
    defaultValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '默认值（当fieldType为flexible时使用）'
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '选项配置JSON（用于select类型）'
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否必填'
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '字段排序位置'
    },
    targetEntity: {
      type: DataTypes.ENUM('invoice', 'client', 'item'),
      allowNull: false,
      defaultValue: 'invoice',
      comment: '目标实体类型'
    },
    validation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '验证规则JSON'
    }
  }, {
    tableName: 'template_fields',
    timestamps: true,
    indexes: [
      {
        fields: ['templateId']
      },
      {
        fields: ['fieldName', 'templateId'],
        unique: true
      }
    ]
  });

  return TemplateFieldModel;
};

module.exports = TemplateField;