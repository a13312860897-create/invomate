const { InvoiceItem } = require('./index');

// InvoiceItem模型适配Sequelize
class InvoiceItemModel {
  // 创建新发票项目
  static async create(invoiceItemData) {
    return await InvoiceItem.create(invoiceItemData);
  }

  // 查找发票项目
  static async findOne(options) {
    return await InvoiceItem.findOne(options);
  }

  // 根据主键查找发票项目
  static async findByPk(id) {
    return await InvoiceItem.findByPk(id);
  }

  // 查找所有发票项目
  static async findAll(options) {
    return await InvoiceItem.findAll(options);
  }

  // 更新发票项目
  static async update(updates, options) {
    const [affectedRows] = await InvoiceItem.update(updates, options);
    if (affectedRows > 0 && options.where && options.where.id) {
      return await InvoiceItem.findByPk(options.where.id);
    }
    return null;
  }

  // 删除发票项目
  static async destroy(options) {
    return await InvoiceItem.destroy(options);
  }
}

module.exports = InvoiceItemModel;