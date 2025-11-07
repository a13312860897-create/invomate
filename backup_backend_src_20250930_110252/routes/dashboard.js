const express = require('express');
const router = express.Router();
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { Invoice, Client, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// 导入新的数据服务层
const DataService = require('../services/DataService');

// 检查是否为内存数据库模式
const isMemoryMode = !sequelize;

// 初始化数据源
let dataSource;
if (isMemoryMode) {
  const memoryDb = require('../config/memoryDatabase');
  dataSource = {
    type: 'memory',
    invoices: memoryDb.invoices
  };
} else {
  dataSource = {
    type: 'database',
    query: async (sql, params) => {
      const result = await sequelize.query(sql, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT
      });
      return result;
    }
  };
}

// 创建数据服务实例
const dataService = new DataService(dataSource);

// 应用全局中间件
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('dashboard'));

// 统一的图表数据API - 使用新的数据服务层
router.get('/unified-chart-data', async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    
    console.log('=== 统一图表数据API (重构版) ===');
    console.log('用户ID:', userId);
    console.log('月份参数:', month);
    
    // 使用当前月份作为默认值
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    console.log('目标月份:', targetMonth);
    
    // 使用统一的数据服务获取图表数据
    const chartData = await dataService.getUnifiedChartData(userId, targetMonth);
    
    console.log('返回数据:', {
      totalRevenue: chartData.revenueTrend.totalRevenue,
      totalCount: chartData.revenueTrend.totalCount,
      totalInvoices: chartData.statusDistribution.totalInvoices,
      distributionCount: chartData.statusDistribution.distribution.length
    });
    
    res.json({
      success: true,
      data: {
        // 收入趋势数据
        revenueTrend: {
          totalRevenue: chartData.revenueTrend.totalRevenue,
          totalCount: chartData.revenueTrend.totalCount,
          timePoints: chartData.revenueTrend.trendPoints.map(point => ({
            label: point.label,
            revenue: point.revenue,
            count: point.count
          }))
        },
        // 状态分布数据
        statusDistribution: {
          distribution: chartData.statusDistribution.distribution,
          totalInvoices: chartData.statusDistribution.totalInvoices
        },
        // 月份信息
        monthInfo: {
          month: targetMonth,
          year: parseInt(targetMonth.split('-')[0]),
          monthNum: parseInt(targetMonth.split('-')[1])
        },
        // 元数据
        metadata: chartData.metadata
      }
    });
    
  } catch (error) {
    console.error('统一图表数据API错误:', error);
    res.status(500).json({
      success: false,
      error: '获取图表数据失败',
      details: error.message
    });
  }
});

// 获取统计数据（使用新的数据服务层）
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month', month } = req.query;
    
    console.log(`Stats request (重构版) - period: ${period}, month: ${month}`);
    
    // 使用统一的数据服务获取月度摘要
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const monthlyStats = await dataService.getMonthlyInvoiceSummary(userId, targetMonth);
    
    console.log(`Monthly stats - 总发票: ${monthlyStats.created.count}, 总收入: ${monthlyStats.paid.totalAmount}`);
    
    // 获取客户总数（不按月份筛选）
    let totalClients = 0;
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      totalClients = memoryDb.clients.filter(client => client.userId === userId).length;
    } else {
      totalClients = await Client.count({ where: { userId } });
    }
    
    // 计算趋势（简化版，后续可以扩展）
    const invoiceTrend = 0;
    const revenueTrend = 0;
    
    // 从状态统计中提取待处理和逾期数据
    const statusStats = monthlyStats.created.byStatus || [];
    const draftStats = statusStats.find(s => s.status === 'draft') || { count: 0, amount: 0 };
    const sentStats = statusStats.find(s => s.status === 'sent') || { count: 0, amount: 0 };
    
    res.json({
      totalInvoices: monthlyStats.created.count,
      thisPeriodInvoices: monthlyStats.created.count,
      invoiceTrend,
      totalRevenue: monthlyStats.paid.totalAmount,
      thisPeriodRevenue: monthlyStats.paid.totalAmount,
      revenueTrend,
      pendingCount: sentStats.count, // 已发送但未支付的发票
      pendingAmount: sentStats.amount,
      overdueCount: 0, // 暂时设为0，后续可以添加逾期逻辑
      overdueAmount: 0,
      totalClients,
      period,
      month: targetMonth,
      metadata: monthlyStats.metadata || {}
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});



// 获取今日统计数据
router.get('/today-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 今日新增发票
      const todayInvoices = allInvoices.filter(inv => {
        const createdDate = new Date(inv.createdAt);
        return createdDate >= startOfToday && createdDate <= endOfToday;
      });
      
      // 今日收款
      const todayPayments = allInvoices.filter(inv => {
        if (inv.status !== 'paid' || !inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        return paidDate >= startOfToday && paidDate <= endOfToday;
      });
      
      // 今日到期
      const todayDue = allInvoices.filter(inv => {
        if (inv.status === 'paid' || !inv.dueDate) return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate >= startOfToday && dueDate <= endOfToday;
      });
      
      res.json({
        todayInvoices: todayInvoices.length,
        todayPayments: todayPayments.reduce((sum, inv) => sum + parseFloat(inv.total), 0),
        todayDue: todayDue.length,
        todayDueAmount: todayDue.reduce((sum, inv) => sum + parseFloat(inv.total), 0)
      });
      
    } else {
      // 数据库模式实现
      const todayInvoices = await Invoice.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: startOfToday,
            [Op.lte]: endOfToday
          }
        }
      });
      
      const todayPayments = await Invoice.sum('total', {
        where: {
          userId,
          status: 'paid',
          paidDate: {
            [Op.gte]: startOfToday,
            [Op.lte]: endOfToday
          }
        }
      });
      
      const todayDueInvoices = await Invoice.findAll({
        where: {
          userId,
          status: { [Op.ne]: 'paid' },
          dueDate: {
            [Op.gte]: startOfToday,
            [Op.lte]: endOfToday
          }
        },
        attributes: ['total']
      });
      
      const todayDueAmount = todayDueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      
      res.json({
        todayInvoices,
        todayPayments: todayPayments || 0,
        todayDue: todayDueInvoices.length,
        todayDueAmount
      });
    }
    
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取仪表盘数据（保持向后兼容）
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (isMemoryMode) {
      // 内存模式简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      const paidTodayInvoices = allInvoices.filter(inv => {
        if (inv.status !== 'paid' || !inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        return paidDate >= today && paidDate < tomorrow;
      });
      
      const dueTodayInvoices = allInvoices.filter(inv => {
        if (inv.status === 'paid' || !inv.dueDate) return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });
      
      const paidToday = paidTodayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
      const dueToday = dueTodayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
      
      res.json({
        todayRevenue: paidToday + dueToday,
        paidToday,
        dueToday,
        invoiceCount: allInvoices.length
      });
      
    } else {
      // 数据库模式实现
      const paidTodayInvoices = await Invoice.findAll({
        where: {
          userId,
          status: 'paid',
          paidDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        attributes: ['total', 'currency']
      });
      
      const dueTodayInvoices = await Invoice.findAll({
        where: {
          userId,
          status: {
            [Op.ne]: 'paid'
          },
          dueDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        attributes: ['total', 'currency']
      });
      
      const paidToday = paidTodayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
      const dueToday = dueTodayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
      
      const totalInvoices = await Invoice.count({ where: { userId } });
      
      res.json({
        todayRevenue: paidToday + dueToday,
        paidToday,
        dueToday,
        invoiceCount: totalInvoices
      });
    }
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;