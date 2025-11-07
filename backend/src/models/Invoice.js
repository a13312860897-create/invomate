const { Invoice } = require('./index');

// Invoice模型适配Sequelize
class InvoiceModel {
  // 创建新发票
  static async create(invoiceData) {
    return await Invoice.create(invoiceData);
  }

  // 查找发票
  static async findOne(options) {
    return await Invoice.findOne(options);
  }

  // 根据主键查找发票
  static async findByPk(id) {
    return await Invoice.findByPk(id);
  }

  // 查找所有发票
  static async findAll(options) {
    return await Invoice.findAll(options);
  }

  // 更新发票
  static async update(updates, options) {
    const [affectedRows] = await Invoice.update(updates, options);
    if (affectedRows > 0 && options.where && options.where.id) {
      return await Invoice.findByPk(options.where.id);
    }
    return null;
  }

  // 删除发票
  static async destroy(options) {
    return await Invoice.destroy(options);
  }
}

module.exports = InvoiceModel;