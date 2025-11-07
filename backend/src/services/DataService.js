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
    
    // 初始化内存数据库引用
    this.memoryDatabase = require('../config/memoryDatabase');
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
      
      // 直接从内存数据库获取发票数据
      invoices = this.memoryDatabase.findInvoicesByUserId(userId);
      
      this.setCache(cacheKey, invoices);
      return invoices;
    } catch (error) {
      console.error('获取发票数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取发票状态分布数据
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 状态分布数据
   */
  async getInvoiceStatusDistribution(userId, monthString) {
    try {
      // 参数验证
      this.validateUserId(userId);
      this.validateMonthString(monthString);

      const cacheKey = `status_distribution_${userId}_${monthString}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 获取所有发票
      const allInvoices = await this.getAllInvoices(userId);
      
      // 使用统一的筛选逻辑：按创建月份筛选
      const { year, month } = DateUtils.parseMonthString(monthString);
      const filteredInvoices = InvoiceFilterService.filterInvoices(allInvoices, {
        userId: userId,
        year: year,
        month: month,
        dateField: 'createdAt'
      });

      // 计算状态分布
      const statusCounts = {};
      const statusAmounts = {};
      let totalAmount = 0;

      filteredInvoices.forEach(invoice => {
        const status = invoice.status || 'unknown';
        const amount = parseFloat(invoice.total) || 0;
        
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        statusAmounts[status] = (statusAmounts[status] || 0) + amount;
        totalAmount += amount;
      });

      // 生成分布数据
      const distribution = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status],
        amount: statusAmounts[status],
        percentage: filteredInvoices.length > 0 ? 
          ((statusCounts[status] / filteredInvoices.length) * 100).toFixed(1) : '0.0'
      }));

      const result = {
        month: monthString,
        totalInvoices: filteredInvoices.length,
        distribution,
        summary: {
          totalAmount,
          statusCounts,
          statusAmounts
        }
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('获取发票状态分布失败:', error);
      throw error;
    }
  }

  /**
   * 获取收入趋势数据
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 收入趋势数据
   */
  async getRevenueTrend(userId, monthString) {
    try {
      // 参数验证
      this.validateUserId(userId);
      this.validateMonthString(monthString);

      const cacheKey = `revenue_trend_${userId}_${monthString}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 获取所有发票
      const allInvoices = await this.getAllInvoices(userId);
      
      // 修复：统一使用创建月份筛选已支付发票，确保与状态分布API一致
      // 这样确保与getInvoiceStatusDistribution的paid部分使用相同的筛选逻辑
      const { year: parsedYear, month: parsedMonth } = DateUtils.parseMonthString(monthString);
      const allFilteredInvoices = InvoiceFilterService.filterInvoices(allInvoices, {
        userId: userId,
        year: parsedYear,
        month: parsedMonth,
        dateField: 'createdAt'
      });
      
      // 从筛选结果中提取已支付发票
      const paidInvoices = allFilteredInvoices.filter(invoice => invoice.status === 'paid');

      // 生成时间点数据 - 简化版本，直接在这里生成
      const trendPoints = this.generateSimpleRevenueTrendPoints(paidInvoices, monthString);

      // 计算总计
      const totalRevenue = paidInvoices.reduce((sum, invoice) => {
        return sum + (parseFloat(invoice.totalAmount || invoice.total) || 0);
      }, 0);

      const result = {
        month: monthString,
        totalRevenue,
        totalCount: paidInvoices.length,
        trendPoints,
        paidInvoices: paidInvoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.totalAmount || invoice.total,
          createdAt: invoice.createdAt,
          paidDate: invoice.paidDate || invoice.paidAt
        }))
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('获取收入趋势失败:', error);
      throw error;
    }
  }

  /**
   * 获取统一图表数据
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 包含状态分布和收入趋势的统一数据
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

      // 获取所有发票 - 添加调试日志
      console.log(`[DataService] 开始获取用户 ${userId} 的所有发票...`);
      const allInvoices = await this.getAllInvoices(userId);
      console.log(`[DataService] 获取到 ${allInvoices.length} 张发票`);
      
      if (allInvoices.length > 0) {
        console.log(`[DataService] 前3张发票:`, allInvoices.slice(0, 3).map(inv => ({
          id: inv.id,
          status: inv.status,
          total: inv.total,
          totalAmount: inv.totalAmount,
          createdAt: inv.createdAt
        })));
      }
      
      // 修复：对于收入趋势，应该使用支付日期筛选已支付发票
      // 状态分布使用创建日期，收入趋势使用支付日期
      const { year: filterYear, month: filterMonth } = DateUtils.parseMonthString(monthString);
      console.log(`[DataService] 筛选条件: 年=${filterYear}, 月=${filterMonth}`);
      
      // 状态分布：使用开票日期筛选所有发票
      const allFilteredInvoices = InvoiceFilterService.filterInvoices(allInvoices, {
        userId: userId,
        year: filterYear,
        month: filterMonth,
        dateField: 'invoiceDate'  // 修改：使用开票日期而不是创建日期
      });
      
      console.log(`[DataService] 按开票日期筛选后的发票数量: ${allFilteredInvoices.length}`);
      
      // 收入趋势：使用支付日期筛选已支付发票
      const paidInvoicesFiltered = InvoiceFilterService.filterInvoices(allInvoices, {
        userId: userId,
        year: filterYear,
        month: filterMonth,
        dateField: 'paidDate'
      }).filter(invoice => invoice.status === 'paid');
      
      console.log(`[DataService] 按支付日期筛选的已支付发票数量: ${paidInvoicesFiltered.length}`);

      // 生成时间点数据 - 简化版本，直接在这里生成
      console.log(`[DataService] 传入generateSimpleRevenueTrendPoints的paidInvoices:`, JSON.stringify(paidInvoicesFiltered.map(inv => ({id: inv.id, totalAmount: inv.totalAmount, total: inv.total})), null, 2));
      const trendData = this.generateSimpleRevenueTrendPoints(paidInvoicesFiltered, monthString);

      // 计算总计 - 修复字段映射问题，优先使用totalAmount字段
      const totalRevenue = paidInvoicesFiltered.reduce((sum, invoice) => {
        const amount = parseFloat(invoice.totalAmount || invoice.total) || 0;
        return sum + amount;
      }, 0);
      
      console.log(`[DataService] 计算的总收入: ${totalRevenue}`);

      // 构建收入趋势数据
      const revenueTrend = {
        month: monthString,
        totalRevenue,
        totalCount: paidInvoicesFiltered.length,
        trendData,
        paidInvoices: paidInvoicesFiltered.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.totalAmount || invoice.total,
          createdAt: invoice.createdAt,
          paidDate: invoice.paidDate || invoice.paidAt
        }))
      };

      // 计算状态分布 - 修复字段映射问题
      const statusCounts = {};
      const statusAmounts = {};
      let totalAmount = 0;

      allFilteredInvoices.forEach(invoice => {
        const status = invoice.status || 'unknown';
        const amount = parseFloat(invoice.totalAmount || invoice.total) || 0;
        
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        statusAmounts[status] = (statusAmounts[status] || 0) + amount;
        totalAmount += amount;
      });

      console.log(`[DataService] 状态统计:`, statusCounts);
      console.log(`[DataService] 总金额: ${totalAmount}`);

      // 生成分布数据
      const distribution = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status],
        amount: statusAmounts[status],
        percentage: allFilteredInvoices.length > 0 ? 
          ((statusCounts[status] / allFilteredInvoices.length) * 100).toFixed(1) : '0.0'
      }));

      const statusDistribution = {
        month: monthString,
        totalInvoices: allFilteredInvoices.length,
        distribution,
        summary: {
          totalAmount,
          statusCounts,
          statusAmounts
        }
      };

      console.log(`[DataService] 最终结果 - 总发票数: ${statusDistribution.totalInvoices}, 总收入: ${revenueTrend.totalRevenue}`);

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
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 月度摘要数据
   */
  async getMonthlyInvoiceSummary(userId, monthString) {
    try {
      this.validateUserId(userId);
      this.validateMonthString(monthString);

      const cacheKey = `monthly_summary_${userId}_${monthString}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 获取统一图表数据
      const unifiedData = await this.getUnifiedChartData(userId, monthString);
      
      const { statusDistribution, revenueTrend } = unifiedData;
      
      // 计算摘要指标
      const summary = {
        month: monthString,
        totalInvoices: statusDistribution.totalInvoices,
        totalRevenue: revenueTrend.totalRevenue,
        paidInvoices: revenueTrend.totalCount,
        pendingInvoices: statusDistribution.summary.statusCounts.pending || 0,
        draftInvoices: statusDistribution.summary.statusCounts.draft || 0,
        sentInvoices: statusDistribution.summary.statusCounts.sent || 0,
        averageInvoiceValue: statusDistribution.totalInvoices > 0 ? 
          (statusDistribution.summary.totalAmount / statusDistribution.totalInvoices).toFixed(2) : 0,
        paymentRate: statusDistribution.totalInvoices > 0 ? 
          ((revenueTrend.totalCount / statusDistribution.totalInvoices) * 100).toFixed(1) : '0.0'
      };

      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('获取月度摘要失败:', error);
      throw error;
    }
  }

  /**
   * 验证数据一致性
   * @param {number} userId - 用户ID
   * @param {string} monthString - YYYY-MM格式的月份字符串
   * @returns {Promise<Object>} 一致性验证结果
   */
  async validateDataConsistency(userId, monthString) {
    try {
      this.validateUserId(userId);
      this.validateMonthString(monthString);

      // 获取统一数据
      const unifiedData = await this.getUnifiedChartData(userId, monthString);
      const { statusDistribution, revenueTrend } = unifiedData;
      
      // 获取月度摘要
      const summary = await this.getMonthlyInvoiceSummary(userId, monthString);
      
      // 验证数据一致性
      const issues = [];
      
      // 检查总发票数量一致性
      if (statusDistribution.totalInvoices !== summary.totalInvoices) {
        issues.push({
          type: 'total_invoices_mismatch',
          message: `状态分布总数(${statusDistribution.totalInvoices})与摘要总数(${summary.totalInvoices})不一致`
        });
      }
      
      // 检查总收入一致性
      if (Math.abs(revenueTrend.totalRevenue - summary.totalRevenue) > 0.01) {
        issues.push({
          type: 'total_revenue_mismatch',
          message: `收入趋势总额(${revenueTrend.totalRevenue})与摘要总额(${summary.totalRevenue})不一致`
        });
      }
      
      // 检查已支付发票数量一致性
      const paidCountFromStatus = statusDistribution.summary.statusCounts.paid || 0;
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

  /**
   * 生成简单的收入趋势点数据
   * @param {Array} paidInvoices - 已支付发票数组
   * @param {string} monthString - 月份字符串 (YYYY-MM)
   * @returns {Array} 趋势点数组
   */
  generateSimpleRevenueTrendPoints(paidInvoices, monthString) {
    try {
      console.log(`[generateSimpleRevenueTrendPoints] 输入数据:`, paidInvoices);
      
      if (!paidInvoices || paidInvoices.length === 0) {
        return [];
      }

      // 按支付日期分组
      const dailyRevenue = {};
      
      paidInvoices.forEach(invoice => {
        const paidDate = invoice.paidDate || invoice.paidAt || invoice.createdAt;
        console.log(`[generateSimpleRevenueTrendPoints] 处理发票 ${invoice.id}: paidDate=${paidDate}`);
        console.log(`[generateSimpleRevenueTrendPoints] 发票 ${invoice.id} 完整数据:`, JSON.stringify(invoice, null, 2));
        
        if (paidDate) {
          const dateKey = new Date(paidDate).toISOString().split('T')[0];
          if (!dailyRevenue[dateKey]) {
            dailyRevenue[dateKey] = 0;
          }
          // 修复：使用正确的金额字段，与原始数据结构保持一致
          const amount = parseFloat(invoice.totalAmount || invoice.total) || 0;
          console.log(`[generateSimpleRevenueTrendPoints] 发票 ${invoice.id} 计算金额: ${amount} (totalAmount: ${invoice.totalAmount}, total: ${invoice.total})`);
          dailyRevenue[dateKey] += amount;
          console.log(`[generateSimpleRevenueTrendPoints] 日期 ${dateKey} 累计收入: ${dailyRevenue[dateKey]}`);
        }
      });

      console.log(`[generateSimpleRevenueTrendPoints] 每日收入汇总:`, dailyRevenue);

      // 转换为趋势点数组
      const trendPoints = Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({
          date,
          revenue,
          count: paidInvoices.filter(inv => {
            const paidDate = inv.paidDate || inv.paidAt || inv.createdAt;
            return paidDate && new Date(paidDate).toISOString().split('T')[0] === date;
          }).length
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(`[generateSimpleRevenueTrendPoints] 最终趋势点:`, trendPoints);
      return trendPoints;
    } catch (error) {
      console.error('生成收入趋势点失败:', error);
      return [];
    }
  }
}

module.exports = DataService;