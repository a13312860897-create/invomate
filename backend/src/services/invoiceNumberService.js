/**
 * 发票编号序列管理服务
 * 确保发票编号的连续性和唯一性，符合法国发票法律要求
 */

class InvoiceNumberService {
  constructor(database) {
    this.db = database;
    this.isMemoryMode = !database.sequelize;
  }

  /**
   * 获取下一个发票编号
   * @param {number} userId - 用户ID
   * @param {string} format - 编号格式 ('standard' | 'french')
   * @returns {Promise<string>} 发票编号
   */
  async getNextInvoiceNumber(userId, format = 'standard') {
    try {
      if (this.isMemoryMode) {
        return await this.getNextInvoiceNumberMemory(userId, format);
      } else {
        return await this.getNextInvoiceNumberSequelize(userId, format);
      }
    } catch (error) {
      console.error('生成发票编号失败:', error);
      throw new Error('无法生成发票编号');
    }
  }

  /**
   * 内存模式下生成发票编号
   */
  async getNextInvoiceNumberMemory(userId, format) {
    const userInvoices = this.db.findInvoicesByUserId(userId);
    
    if (format === 'french') {
      return this.generateFrenchInvoiceNumber(userInvoices, userId);
    } else {
      return this.generateStandardInvoiceNumber(userInvoices, userId);
    }
  }

  /**
   * Sequelize模式下生成发票编号
   */
  async getNextInvoiceNumberSequelize(userId, format) {
    const { Invoice } = require('../models');
    const userInvoices = await Invoice.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });

    if (format === 'french') {
      return this.generateFrenchInvoiceNumber(userInvoices, userId);
    } else {
      return this.generateStandardInvoiceNumber(userInvoices, userId);
    }
  }

  /**
   * 生成法国格式发票编号
   * 格式: FR-YYYY-NNNNNN (严格连续)
   */
  generateFrenchInvoiceNumber(existingInvoices, userId) {
    const currentYear = new Date().getFullYear();
    
    // 获取当前年份的法国格式发票
    const frenchInvoicesThisYear = existingInvoices.filter(invoice => {
      const invoiceYear = new Date(invoice.createdAt || invoice.issueDate).getFullYear();
      return invoiceYear === currentYear && 
             invoice.invoiceNumber && 
             invoice.invoiceNumber.startsWith(`FR-${currentYear}-`);
    });

    // 提取序列号并找到最大值
    let maxSequence = 0;
    frenchInvoicesThisYear.forEach(invoice => {
      const match = invoice.invoiceNumber.match(/FR-\d{4}-(\d{6})/);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });

    // 生成下一个序列号
    const nextSequence = maxSequence + 1;
    return `FR-${currentYear}-${String(nextSequence).padStart(6, '0')}`;
  }

  /**
   * 生成标准格式发票编号
   * 格式: INV-YYYYMM-NNNN
   */
  generateStandardInvoiceNumber(existingInvoices, userId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // 获取当前月份的发票
    const invoicesThisMonth = existingInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt || invoice.issueDate);
      const invoiceYearMonth = `${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
      return invoiceYearMonth === yearMonth && 
             invoice.invoiceNumber && 
             invoice.invoiceNumber.startsWith(`INV-${yearMonth}-`);
    });

    // 提取序列号并找到最大值
    let maxSequence = 0;
    invoicesThisMonth.forEach(invoice => {
      const match = invoice.invoiceNumber.match(/INV-\d{6}-(\d{4})/);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });

    // 生成下一个序列号
    const nextSequence = maxSequence + 1;
    return `INV-${yearMonth}-${String(nextSequence).padStart(4, '0')}`;
  }

  /**
   * 验证发票编号是否已存在
   * @param {string} invoiceNumber - 发票编号
   * @param {number} userId - 用户ID
   * @param {number} excludeInvoiceId - 排除的发票ID（用于更新时）
   * @returns {Promise<boolean>} 是否已存在
   */
  async isInvoiceNumberExists(invoiceNumber, userId, excludeInvoiceId = null) {
    try {
      if (this.isMemoryMode) {
        const existingInvoice = this.db.findInvoiceByNumber(invoiceNumber);
        return existingInvoice && 
               existingInvoice.userId === userId && 
               existingInvoice.id !== excludeInvoiceId;
      } else {
        const { Invoice } = require('../models');
        const whereClause = {
          invoiceNumber,
          userId
        };
        
        if (excludeInvoiceId) {
          whereClause.id = { [require('sequelize').Op.ne]: excludeInvoiceId };
        }
        
        const existingInvoice = await Invoice.findOne({ where: whereClause });
        return !!existingInvoice;
      }
    } catch (error) {
      console.error('检查发票编号重复失败:', error);
      return false;
    }
  }

  /**
   * 验证发票编号格式
   * @param {string} invoiceNumber - 发票编号
   * @param {string} format - 期望格式
   * @returns {boolean} 格式是否正确
   */
  validateInvoiceNumberFormat(invoiceNumber, format = 'standard') {
    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
      return false;
    }

    if (format === 'french') {
      // 法国格式: FR-YYYY-NNNNNN
      return /^FR-\d{4}-\d{6}$/.test(invoiceNumber);
    } else {
      // 标准格式: INV-YYYYMM-NNNN
      return /^INV-\d{6}-\d{4}$/.test(invoiceNumber);
    }
  }

  /**
   * 获取发票编号统计信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getInvoiceNumberStats(userId) {
    try {
      const userInvoices = this.isMemoryMode 
        ? this.db.findInvoicesByUserId(userId)
        : await require('../models').Invoice.findAll({ where: { userId } });

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const stats = {
        totalInvoices: userInvoices.length,
        thisYearInvoices: 0,
        thisMonthInvoices: 0,
        frenchFormatInvoices: 0,
        standardFormatInvoices: 0,
        lastInvoiceNumber: null
      };

      userInvoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.issueDate);
        const invoiceYear = invoiceDate.getFullYear();
        const invoiceMonth = invoiceDate.getMonth() + 1;

        if (invoiceYear === currentYear) {
          stats.thisYearInvoices++;
          if (invoiceMonth === currentMonth) {
            stats.thisMonthInvoices++;
          }
        }

        if (invoice.invoiceNumber) {
          if (invoice.invoiceNumber.startsWith('FR-')) {
            stats.frenchFormatInvoices++;
          } else if (invoice.invoiceNumber.startsWith('INV-')) {
            stats.standardFormatInvoices++;
          }
        }
      });

      // 获取最新的发票编号
      if (userInvoices.length > 0) {
        const sortedInvoices = userInvoices.sort((a, b) => 
          new Date(b.createdAt || b.issueDate) - new Date(a.createdAt || a.issueDate)
        );
        stats.lastInvoiceNumber = sortedInvoices[0].invoiceNumber;
      }

      return stats;
    } catch (error) {
      console.error('获取发票编号统计失败:', error);
      throw new Error('无法获取发票编号统计信息');
    }
  }
}

module.exports = InvoiceNumberService;