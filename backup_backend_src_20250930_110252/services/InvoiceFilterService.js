const DateUtils = require('./DateUtils');

/**
 * 统一的发票筛选服务
 * 
 * 设计决策：标准化筛选逻辑架构
 * ================================
 * 
 * 本服务类实现了发票系统的核心筛选逻辑，确保所有API的数据一致性：
 * 
 * 1. 筛选维度分离：
 *    - 按支付日期筛选：用于收入相关统计
 *    - 按创建日期筛选：用于业务活动统计
 *    - 按用户筛选：确保数据隔离和安全性
 * 
 * 2. 组合筛选策略：
 *    - 支持多维度组合筛选（用户+时间+状态）
 *    - 提供原子级筛选方法，便于复用和测试
 *    - 确保筛选逻辑的一致性和可维护性
 * 
 * 3. 数据一致性保证：
 *    - 所有API使用相同的筛选方法
 *    - 统一的日期处理和验证逻辑
 *    - 标准化的错误处理和边界情况处理
 * 
 * 4. 性能优化：
 *    - 先筛选用户，再筛选时间，减少处理量
 *    - 提供批量处理和统计方法
 *    - 支持缓存友好的数据结构
 * 
 * 标准化所有发票筛选逻辑，确保数据一致性
 */
class InvoiceFilterService {
  /**
   * 根据支付日期筛选已支付发票
   * @param {Array} invoices - 发票数组
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Array} 筛选后的发票数组
   */
  static filterPaidInvoicesByPaymentMonth(invoices, monthString) {
    // 参数验证
    if (!Array.isArray(invoices)) {
      console.warn('filterPaidInvoicesByPaymentMonth: invoices参数必须是数组');
      return [];
    }
    
    if (!monthString || typeof monthString !== 'string') {
      console.warn('filterPaidInvoicesByPaymentMonth: monthString参数必须是字符串');
      return [];
    }
    
    // 验证月份格式
    const monthPattern = /^\d{4}-\d{2}$/;
    if (!monthPattern.test(monthString)) {
      console.warn(`filterPaidInvoicesByPaymentMonth: 无效的月份格式 ${monthString}，应为YYYY-MM格式`);
      return [];
    }

    return invoices.filter(invoice => {
      // 必须是已支付状态
      if (invoice.status !== 'paid') {
        return false;
      }

      // 获取有效的支付日期
      const paymentDate = DateUtils.getInvoicePaymentDate(invoice);
      if (!paymentDate) {
        return false;
      }

      // 检查是否在指定月份内
      return DateUtils.isDateInMonth(paymentDate, monthString);
    });
  }

  /**
   * 根据创建日期筛选发票
   * @param {Array} invoices - 发票数组
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Array} 筛选后的发票数组
   */
  static filterInvoicesByCreationMonth(invoices, monthString) {
    // 参数验证
    if (!Array.isArray(invoices)) {
      console.warn('filterInvoicesByCreationMonth: invoices参数必须是数组');
      return [];
    }
    
    if (!monthString || typeof monthString !== 'string') {
      console.warn('filterInvoicesByCreationMonth: monthString参数必须是字符串');
      return [];
    }
    
    // 验证月份格式
    const monthPattern = /^\d{4}-\d{2}$/;
    if (!monthPattern.test(monthString)) {
      console.warn(`filterInvoicesByCreationMonth: 无效的月份格式 ${monthString}，应为YYYY-MM格式`);
      return [];
    }

    return invoices.filter(invoice => {
      const creationDate = DateUtils.getInvoiceCreationDate(invoice);
      if (!creationDate) {
        return false;
      }

      return DateUtils.isDateInMonth(creationDate, monthString);
    });
  }

  /**
   * 根据状态筛选发票
   * @param {Array} invoices - 发票数组
   * @param {string|Array} status - 状态字符串或状态数组
   * @returns {Array} 筛选后的发票数组
   */
  static filterInvoicesByStatus(invoices, status) {
    if (!Array.isArray(invoices)) {
      return [];
    }

    const statusArray = Array.isArray(status) ? status : [status];
    
    return invoices.filter(invoice => {
      const invoiceStatus = invoice.status || 'draft';
      return statusArray.includes(invoiceStatus);
    });
  }

  /**
   * 根据用户ID筛选发票
   * @param {Array} invoices - 发票数组
   * @param {number} userId - 用户ID
   * @returns {Array} 筛选后的发票数组
   */
  static filterInvoicesByUser(invoices, userId) {
    // 参数验证
    if (!Array.isArray(invoices)) {
      console.warn('filterInvoicesByUser: invoices参数必须是数组');
      return [];
    }
    
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      console.warn('filterInvoicesByUser: userId参数必须是大于0的数字');
      return [];
    }

    return invoices.filter(invoice => invoice.userId === userId);
  }

  /**
   * 组合筛选：根据用户ID和支付月份筛选已支付发票
   * @param {Array} invoices - 发票数组
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Array} 筛选后的发票数组
   */
  static filterPaidInvoicesForUserByMonth(invoices, userId, monthString) {
    // 先按用户筛选
    const userInvoices = this.filterInvoicesByUser(invoices, userId);
    
    // 再按支付月份筛选已支付发票
    return this.filterPaidInvoicesByPaymentMonth(userInvoices, monthString);
  }

  /**
   * 组合筛选：根据用户ID和创建月份筛选发票
   * @param {Array} invoices - 发票数组
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Array} 筛选后的发票数组
   */
  static filterInvoicesForUserByCreationMonth(invoices, userId, monthString) {
    // 先按用户筛选
    const userInvoices = this.filterInvoicesByUser(invoices, userId);
    
    // 再按创建月份筛选
    return this.filterInvoicesByCreationMonth(userInvoices, monthString);
  }

  /**
   * 根据日期范围筛选已支付发票（用于时间点计算）
   * @param {Array} invoices - 发票数组
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @param {number} startDay - 开始日期（1-31）
   * @param {number} endDay - 结束日期（1-31）
   * @returns {Array} 筛选后的发票数组
   */
  static filterPaidInvoicesByDateRange(invoices, monthString, startDay, endDay) {
    if (!Array.isArray(invoices) || !monthString) {
      return [];
    }

    return invoices.filter(invoice => {
      // 必须是已支付状态
      if (invoice.status !== 'paid') {
        return false;
      }

      // 获取有效的支付日期
      const paymentDate = DateUtils.getInvoicePaymentDate(invoice);
      if (!paymentDate) {
        return false;
      }

      // 检查是否在指定月份内
      if (!DateUtils.isDateInMonth(paymentDate, monthString)) {
        return false;
      }

      // 检查是否在指定日期范围内
      const day = paymentDate.getDate();
      return day >= startDay && day <= endDay;
    });
  }

  /**
   * 计算发票总金额
   * @param {Array} invoices - 发票数组
   * @returns {number} 总金额
   */
  static calculateTotalAmount(invoices) {
    if (!Array.isArray(invoices)) {
      return 0;
    }

    return invoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total) || 0;
      return sum + amount;
    }, 0);
  }

  /**
   * 按状态分组统计发票
   * @param {Array} invoices - 发票数组
   * @returns {Object} 按状态分组的统计结果
   */
  static groupInvoicesByStatus(invoices) {
    if (!Array.isArray(invoices)) {
      return {};
    }

    const statusGroups = {};
    const statusCounts = {};
    const statusAmounts = {};

    // 定义状态标签和颜色
    const statusConfig = {
      'paid': { label: '已支付', color: '#10B981' },
      'pending': { label: '待付款', color: '#F59E0B' },
      'overdue': { label: '逾期', color: '#EF4444' },
      'draft': { label: '草稿', color: '#6B7280' },
      'sent': { label: '已发送', color: '#3B82F6' }
    };

    // 分组统计
    invoices.forEach(invoice => {
      const status = invoice.status || 'draft';
      
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      
      statusGroups[status].push(invoice);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      statusAmounts[status] = (statusAmounts[status] || 0) + (parseFloat(invoice.total) || 0);
    });

    // 生成分布数据
    const distribution = Object.keys(statusCounts).map(status => ({
      status,
      label: statusConfig[status]?.label || status,
      count: statusCounts[status],
      amount: statusAmounts[status],
      color: statusConfig[status]?.color || '#6B7280'
    }));

    return {
      groups: statusGroups,
      counts: statusCounts,
      amounts: statusAmounts,
      distribution,
      totalInvoices: invoices.length
    };
  }

  /**
   * 生成收入趋势时间点数据
   * @param {Array} invoices - 已筛选的已支付发票数组
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @param {number} pointCount - 时间点数量，默认10个
   * @returns {Array} 时间点数据数组
   */
  static generateRevenueTrendPoints(invoices, monthString, pointCount = 10) {
    const timePoints = DateUtils.generateTimePoints(monthString, pointCount);
    
    // 为每个时间点计算收入和数量
    timePoints.forEach(point => {
      const rangeInvoices = this.filterPaidInvoicesByDateRange(
        invoices, 
        monthString, 
        point.dayStart, 
        point.dayEnd
      );
      
      point.revenue = this.calculateTotalAmount(rangeInvoices);
      point.count = rangeInvoices.length;
    });

    return timePoints;
  }
}

module.exports = InvoiceFilterService;