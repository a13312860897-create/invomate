const DateUtils = require('./DateUtils');
const InvoiceFilterService = require('./InvoiceFilterService');

/**
 * 统一的数据服务层
 * 提供标准化的数据访问和处理接口
 * 
 * @version 2.1.0
 * @author System
 * @since 2025-01-01
 */
class DataService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.cache = new Map(); // 添加缓存机制
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存过期
  }

  /**
   * 清除缓存
   * @param {string} key - 缓存键，如果不提供则清除所有缓存
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据或null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 验证用户ID
   * @param {number} userId - 用户ID
   * @throws {Error} 如果用户ID无效
   */
  validateUserId(userId) {
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      throw new Error(`无效的用户ID: ${userId}`);
    }
  }

  /**
   * 验证月份字符串
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @throws {Error} 如果月份格式无效
   */
  validateMonthString(monthString) {
    if (!monthString || typeof monthString !== 'string') {
      throw new Error(`无效的月份字符串: ${monthString}`);
    }
    
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(monthString)) {
      throw new Error(`月份格式错误，应为YYYY-MM格式: ${monthString}`);
    }
  }

  /**
   * 获取所有发票数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 发票数组
   * @throws {Error} 如果获取数据失败
   */
  async getAllInvoices(userId) {
    try {
      // 参数验证
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new Error('无效的用户ID：用户ID必须是大于0的数字');
      }
      
      const cacheKey = `invoices_${userId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      let invoices = [];
      
      if (this.dataSource && (this.dataSource.type === 'memory' || this.dataSource.constructor.name === 'MemoryDatabase')) {
        // 内存模式
        const allInvoices = this.dataSource.invoices || [];
        invoices = InvoiceFilterService.filterInvoicesByUser(allInvoices, userId);
      } else if (this.dataSource && this.dataSource.query) {
        // 数据库模式
        const query = 'SELECT * FROM invoices WHERE userId = ?';
        const result = await this.dataSource.query(query, [userId]);
        invoices = result || [];
      } else {
        throw new Error('数据源未正确配置');
      }

      // 缓存结果
      this.setCache(cacheKey, invoices);
      return invoices;
      
    } catch (error) {
      console.error(`获取用户${userId}的发票数据失败:`, error);
      throw new Error(`获取发票数据失败: ${error.message}`);
    }
  }

  /**
   * 获取发票状态分布数据
   * 
   * 设计决策：混合筛选逻辑
   * ========================
   * 
   * 为了确保与收入趋势API的数据一致性，本方法采用混合筛选逻辑：
   * 
   * 1. 已支付发票（status='paid'）：按支付月份（paidDate）筛选
   *    - 原因：收入趋势API统计的是指定月份的收入，即该月份支付的发票
   *    - 这确保了状态分布中的已支付数据与收入趋势数据完全一致
   * 
   * 2. 其他状态发票（draft, sent, overdue等）：按创建月份（createdAt）筛选
   *    - 原因：这些发票尚未支付，没有支付日期，只能按创建日期筛选
   *    - 这样可以显示该月份创建的所有未支付发票的状态分布
   * 
   * 3. 数据一致性保证：
   *    - 状态分布API中的已支付金额 = 收入趋势API中的总收入
   *    - 状态分布API中的已支付数量 = 收入趋势API中的发票数量
   *    - 月度摘要API中的已支付数据与收入趋势API保持一致
   * 
   * 4. 业务逻辑合理性：
   *    - 用户查看某月状态分布时，关心的是：
   *      a) 该月创建了哪些发票（按创建日期）
   *      b) 该月收到了多少款项（按支付日期）
   *    - 混合筛选逻辑同时满足了这两个需求
   * 
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 状态分布数据
   */
  async getInvoiceStatusDistribution(userId, monthString) {
    try {
      // 参数验证
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new Error('无效的用户ID：用户ID必须是大于0的数字');
      }
      
      if (!monthString || typeof monthString !== 'string') {
        throw new Error('无效的月份参数：月份必须是字符串格式');
      }
      
      // 验证月份格式 (YYYY-MM)
      const monthPattern = /^\d{4}-\d{2}$/;
      if (!monthPattern.test(monthString)) {
        throw new Error('无效的月份格式：请使用YYYY-MM格式，例如2024-01');
      }
      
      // 验证月份范围
      const [year, month] = monthString.split('-').map(Number);
      if (year < 1900 || year > 2100) {
        throw new Error(`无效的年份：${year}，年份必须在1900-2100之间`);
      }
      if (month < 1 || month > 12) {
        throw new Error(`无效的月份：${month}，月份必须在01-12之间`);
      }

      // 获取所有发票
      const allInvoices = await this.getAllInvoices(userId);
      
      // 修复：统一使用创建月份筛选所有发票，确保数据一致性
      // 这样可以准确反映该月份的业务活动情况
      const filteredInvoices = InvoiceFilterService.filterInvoicesForUserByCreationMonth(
        allInvoices, 
        userId, 
        monthString
      );
      
      // 按状态分组统计
      const statusStats = InvoiceFilterService.groupInvoicesByStatus(filteredInvoices);

      return {
        month: monthString,
        totalInvoices: statusStats.totalInvoices,
        distribution: statusStats.distribution,
        summary: {
          totalAmount: InvoiceFilterService.calculateTotalAmount(filteredInvoices),
          statusCounts: statusStats.counts,
          statusAmounts: statusStats.amounts
        },
        // 更新说明字段
        filteringNote: "所有发票按创建月份筛选，确保数据一致性"
      };
    } catch (error) {
      console.error('获取发票状态分布失败:', error);
      
      // 如果是参数验证错误，直接抛出
      if (error.message.includes('无效的用户ID') || 
          error.message.includes('无效的月份参数') || 
          error.message.includes('无效的月份格式') || 
          error.message.includes('无效的年份') || 
          error.message.includes('无效的月份')) {
        throw error;
      }
      
      return {
        month: monthString,
        totalInvoices: 0,
        distribution: [],
        summary: {
          totalAmount: 0,
          statusCounts: {},
          statusAmounts: {}
        }
      };
    }
  }

  /**
   * 获取收入趋势数据
   * 
   * 设计决策：统一创建月份筛选
   * ============================
   * 
   * 本方法专门用于统计指定月份的收入情况，采用统一的创建月份筛选：
   * 
   * 1. 筛选逻辑：
   *    - 只统计已支付发票（status='paid'）
   *    - 统一按创建月份（createdDate）筛选
   *    - 确保与状态分布API的数据一致性
   * 
   * 2. 与其他API的一致性：
   *    - 与状态分布API中已支付部分的数据完全一致
   *    - 与月度摘要API中已支付数据保持同步
   *    - 为统一图表数据API提供可靠的收入基础数据
   * 
   * 3. 业务价值：
   *    - 准确反映月度业务活动的收入情况
   *    - 支持财务报表和收入分析
   *    - 为业务决策提供可靠的收入数据
   * 
   * 4. 数据完整性：
   *    - 包含发票数量、总金额、平均金额等关键指标
   *    - 提供详细的发票列表用于审计和核查
   *    - 支持按客户、金额等维度的进一步分析
   * 
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 收入趋势数据
   */
  async getRevenueTrend(userId, monthString) {
    try {
      // 参数验证
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new Error('无效的用户ID：用户ID必须是大于0的数字');
      }
      
      if (!monthString || typeof monthString !== 'string') {
        throw new Error('无效的月份参数：月份必须是字符串格式');
      }
      
      // 验证月份格式 (YYYY-MM)
      const monthPattern = /^\d{4}-\d{2}$/;
      if (!monthPattern.test(monthString)) {
        throw new Error('无效的月份格式：请使用YYYY-MM格式，例如2024-01');
      }
      
      // 验证月份范围
      const [year, month] = monthString.split('-').map(Number);
      if (year < 1900 || year > 2100) {
        throw new Error(`无效的年份：${year}，年份必须在1900-2100之间`);
      }
      if (month < 1 || month > 12) {
        throw new Error(`无效的月份：${month}，月份必须在01-12之间`);
      }

      // 获取所有发票
      const allInvoices = await this.getAllInvoices(userId);
      
      // 修复：统一使用创建月份筛选已支付发票，确保与状态分布API一致
      // 这样确保与getInvoiceStatusDistribution的paid部分使用相同的筛选逻辑
      const allFilteredInvoices = InvoiceFilterService.filterInvoicesForUserByCreationMonth(
        allInvoices, 
        userId, 
        monthString
      );
      
      // 从筛选结果中提取已支付发票
      const paidInvoices = allFilteredInvoices.filter(invoice => invoice.status === 'paid');

      // 生成时间点数据
      const trendPoints = InvoiceFilterService.generateRevenueTrendPoints(
        paidInvoices, 
        monthString, 
        10
      );

      // 计算总计
      const totalRevenue = InvoiceFilterService.calculateTotalAmount(paidInvoices);
      const totalCount = paidInvoices.length;

      return {
        month: monthString,
        totalRevenue,
        totalCount,
        trendPoints,
        paidInvoices: paidInvoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          paymentDate: DateUtils.getInvoicePaymentDate(invoice),
          status: invoice.status
        }))
      };
    } catch (error) {
      console.error('获取收入趋势失败:', error);
      
      // 如果是参数验证错误，直接抛出
      if (error.message.includes('无效的用户ID') || 
          error.message.includes('无效的月份参数') || 
          error.message.includes('无效的月份格式') || 
          error.message.includes('无效的年份') || 
          error.message.includes('无效的月份')) {
        throw error;
      }
      
      return {
        month: monthString,
        totalRevenue: 0,
        totalCount: 0,
        trendPoints: [],
        paidInvoices: []
      };
    }
  }

  /**
   * 获取统一的图表数据（同时包含状态分布和收入趋势）
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 统一的图表数据
   */
  async getUnifiedChartData(userId, monthString) {
    try {
      // 参数验证
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new Error('无效的用户ID：用户ID必须是大于0的数字');
      }
      
      if (!monthString || typeof monthString !== 'string') {
        throw new Error('无效的月份参数：月份必须是字符串格式');
      }
      
      // 验证月份格式 (YYYY-MM)
      const monthPattern = /^\d{4}-\d{2}$/;
      if (!monthPattern.test(monthString)) {
        throw new Error('无效的月份格式：请使用YYYY-MM格式，例如2024-01');
      }
      
      // 验证月份范围
      const [year, month] = monthString.split('-').map(Number);
      if (year < 1900 || year > 2100) {
        throw new Error(`无效的年份：${year}，年份必须在1900-2100之间`);
      }
      if (month < 1 || month > 12) {
        throw new Error(`无效的月份：${month}，月份必须在01-12之间`);
      }

      // 并行获取状态分布和收入趋势数据
      const [statusDistribution, revenueTrend] = await Promise.all([
        this.getInvoiceStatusDistribution(userId, monthString),
        this.getRevenueTrend(userId, monthString)
      ]);

      return {
        month: monthString,
        statusDistribution,
        revenueTrend,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: this.dataSource ? this.dataSource.type : 'unknown',
          userId
        }
      };
    } catch (error) {
      console.error('获取统一图表数据失败:', error);
      
      // 如果是参数验证错误，直接抛出
      if (error.message.includes('无效的用户ID') || 
          error.message.includes('无效的月份参数') || 
          error.message.includes('无效的月份格式') || 
          error.message.includes('无效的年份') || 
          error.message.includes('无效的月份')) {
        throw error;
      }
      
      return {
        month: monthString,
        statusDistribution: {
          month: monthString,
          totalInvoices: 0,
          distribution: [],
          summary: { totalAmount: 0, statusCounts: {}, statusAmounts: {} }
        },
        revenueTrend: {
          month: monthString,
          totalRevenue: 0,
          totalCount: 0,
          trendPoints: [],
          paidInvoices: []
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: this.dataSource ? this.dataSource.type : 'unknown',
          userId,
          error: error.message
        }
      };
    }
  }

  /**
   * 获取月度发票摘要
   * 
   * 设计决策：双重筛选逻辑
   * ========================
   * 
   * 本方法提供月度发票的全面摘要，采用双重筛选逻辑以满足不同的业务需求：
   * 
   * 1. 创建维度统计（created）：
   *    - 按创建月份（createdAt）筛选所有发票
   *    - 统计该月份创建的发票数量、总金额和状态分布
   *    - 反映该月份的业务活动量和发票创建情况
   * 
   * 2. 收入维度统计（paid）：
   *    - 按支付月份（paidDate）筛选已支付发票
   *    - 统计该月份实际收到的款项数量和金额
   *    - 与收入趋势API保持数据一致性
   * 
   * 3. 业务价值：
   *    - 创建统计：帮助了解业务活动趋势和发票生成效率
   *    - 收入统计：准确反映现金流入和收款情况
   *    - 双重视角：同时满足业务分析和财务分析需求
   * 
   * 4. 数据一致性保证：
   *    - paid部分与收入趋势API完全一致
   *    - created部分为状态分布API提供补充信息
   *    - 支持跨API数据验证和一致性检查
   * 
   * 5. 应用场景：
   *    - 月度业务报告生成
   *    - 发票创建与收款效率分析
   *    - 现金流预测和管理
   * 
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 月度摘要数据
   */
  async getMonthlyInvoiceSummary(userId, monthString) {
    try {
      // 参数验证
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        throw new Error('无效的用户ID：用户ID必须是大于0的数字');
      }
      
      if (!monthString || typeof monthString !== 'string') {
        throw new Error('无效的月份参数：月份必须是字符串格式');
      }
      
      // 验证月份格式 (YYYY-MM)
      const monthPattern = /^\d{4}-\d{2}$/;
      if (!monthPattern.test(monthString)) {
        throw new Error('无效的月份格式：请使用YYYY-MM格式，例如2024-01');
      }
      
      // 验证月份范围
      const [year, month] = monthString.split('-').map(Number);
      if (year < 1900 || year > 2100) {
        throw new Error(`无效的年份：${year}，年份必须在1900-2100之间`);
      }
      if (month < 1 || month > 12) {
        throw new Error(`无效的月份：${month}，月份必须在01-12之间`);
      }

      // 获取所有发票
      const allInvoices = await this.getAllInvoices(userId);
      
      // 统一按创建月份筛选所有发票
      const createdInvoices = InvoiceFilterService.filterInvoicesForUserByCreationMonth(
        allInvoices, 
        userId, 
        monthString
      );

      // 从创建月份筛选的发票中提取已支付发票，确保数据一致性
      const paidInvoices = createdInvoices.filter(invoice => invoice.status === 'paid');

      // 状态统计
      const statusStats = InvoiceFilterService.groupInvoicesByStatus(createdInvoices);

      return {
        month: monthString,
        created: {
          count: createdInvoices.length,
          totalAmount: InvoiceFilterService.calculateTotalAmount(createdInvoices),
          byStatus: statusStats.distribution
        },
        paid: {
          count: paidInvoices.length,
          totalAmount: InvoiceFilterService.calculateTotalAmount(paidInvoices)
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          userId
        }
      };
    } catch (error) {
      console.error('获取月度发票摘要失败:', error);
      
      // 如果是参数验证错误，直接抛出
      if (error.message.includes('无效的用户ID') || 
          error.message.includes('无效的月份参数') || 
          error.message.includes('无效的月份格式') || 
          error.message.includes('无效的年份') || 
          error.message.includes('无效的月份')) {
        throw error;
      }
      
      return {
        month: monthString,
        created: { count: 0, totalAmount: 0, byStatus: [] },
        paid: { count: 0, totalAmount: 0 },
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          error: error.message
        }
      };
    }
  }

  /**
   * 验证数据一致性
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 数据一致性检查结果
   */
  async validateDataConsistency(userId, monthString) {
    try {
      const [statusDistribution, revenueTrend, summary] = await Promise.all([
        this.getInvoiceStatusDistribution(userId, monthString),
        this.getRevenueTrend(userId, monthString),
        this.getMonthlyInvoiceSummary(userId, monthString)
      ]);

      const issues = [];

      // 检查收入趋势和摘要中的已支付数据是否一致
      if (revenueTrend.totalRevenue !== summary.paid.totalAmount) {
        issues.push({
          type: 'revenue_mismatch',
          message: `收入趋势总额(${revenueTrend.totalRevenue})与摘要已支付总额(${summary.paid.totalAmount})不一致`
        });
      }

      if (revenueTrend.totalCount !== summary.paid.count) {
        issues.push({
          type: 'count_mismatch',
          message: `收入趋势数量(${revenueTrend.totalCount})与摘要已支付数量(${summary.paid.count})不一致`
        });
      }

      // 修复：由于所有API现在统一使用创建月份筛选，检查数据一致性
      const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
      const paidCountFromStatus = paidFromStatus ? paidFromStatus.count : 0;
      
      if (paidCountFromStatus !== revenueTrend.totalCount) {
        issues.push({
          type: 'paid_status_mismatch',
          message: `状态分布中已支付数量(${paidCountFromStatus})与收入趋势数量(${revenueTrend.totalCount})不一致`
        });
      }

      return {
        month: monthString,
        isConsistent: issues.length === 0,
        issues,
        data: {
          statusDistribution,
          revenueTrend,
          summary
        },
        checkedAt: new Date().toISOString(),
        validationNote: "所有API统一使用创建月份筛选，确保数据一致性"
      };
    } catch (error) {
      console.error('数据一致性验证失败:', error);
      return {
        month: monthString,
        isConsistent: false,
        issues: [{
          type: 'validation_error',
          message: `验证过程出错: ${error.message}`
        }],
        checkedAt: new Date().toISOString()
      };
    }
  }
}

module.exports = DataService;