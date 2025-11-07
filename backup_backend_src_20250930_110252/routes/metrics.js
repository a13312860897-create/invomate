const express = require('express');
const router = express.Router();
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { Invoice, Client, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// 检查是否为内存数据库模式
const isMemoryMode = !sequelize;

// 应用全局中间件
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('metrics'));

// 获取汇总指标数据
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const { from = '6m', currency = 'BRL' } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 计算基本统计
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent');
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      const now = new Date();
      const overdueInvoices = allInvoices.filter(inv => 
        inv.status !== 'paid' && new Date(inv.dueDate) < now
      );
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      // 计算近30天收款
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPayments = paidInvoices.filter(inv => 
        new Date(inv.updatedAt) >= thirtyDaysAgo
      );
      const recentPaymentsAmount = recentPayments.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      // 计算平均到账天数（简化计算）
      const avgDaysToPay = paidInvoices.length > 0 ? 
        paidInvoices.reduce((sum, inv) => {
          const issueDate = new Date(inv.issueDate);
          const paidDate = new Date(inv.updatedAt);
          const daysDiff = Math.max(0, Math.floor((paidDate - issueDate) / (1000 * 60 * 60 * 24)));
          return sum + daysDiff;
        }, 0) / paidInvoices.length : 0;
      
      // 生成趋势数据（近6个月）
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthInvoices = allInvoices.filter(inv => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= monthStart && issueDate <= monthEnd;
        });
        
        const monthRevenue = monthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        const monthPending = monthInvoices
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        trendData.push({
          month: date.toISOString().slice(0, 7), // YYYY-MM format
          revenue: monthRevenue,
          pending: monthPending
        });
      }
      
      return res.json({
        kpis: {
          currentAR: pendingAmount,
          overdue: overdueAmount,
          payments30d: recentPaymentsAmount,
          avgDaysToPay: Math.round(avgDaysToPay)
        },
        trends: trendData,
        currency: currency,
        period: from
      });
    }
    
    // PostgreSQL模式下的完整实现
    const now = new Date();
    let dateFilter = {};
    
    // 根据period参数设置日期过滤
    if (from === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dateFilter = {
        issueDate: {
          [Op.gte]: sixMonthsAgo
        }
      };
    }
    
    // 获取基础数据
    const [
      currentARResult,
      overdueResult,
      payments30dResult,
      avgDaysResult
    ] = await Promise.all([
      // 当前应收
      Invoice.sum('total', {
        where: {
          userId,
          status: 'sent'
        }
      }),
      
      // 逾期金额
      Invoice.sum('total', {
        where: {
          userId,
          status: { [Op.ne]: 'paid' },
          dueDate: { [Op.lt]: now }
        }
      }),
      
      // 近30天收款
      Invoice.sum('total', {
        where: {
          userId,
          status: 'paid',
          updatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // 平均到账天数
      sequelize.query(`
        SELECT AVG(EXTRACT(DAY FROM (updated_at - issue_date))) as avg_days
        FROM invoices 
        WHERE user_id = :userId AND status = 'paid'
      `, {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      })
    ]);
    
    // 获取趋势数据
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', issue_date) as month,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END) as pending
      FROM invoices 
      WHERE user_id = :userId 
        AND issue_date >= :startDate
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY month
    `;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const trendData = await sequelize.query(trendQuery, {
      replacements: { userId, startDate },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      kpis: {
        currentAR: currentARResult || 0,
        overdue: overdueResult || 0,
        payments30d: payments30dResult || 0,
        avgDaysToPay: Math.round(avgDaysResult[0]?.avg_days || 0)
      },
      trends: trendData.map(row => ({
        month: row.month.toISOString().slice(0, 7),
        revenue: parseFloat(row.revenue) || 0,
        pending: parseFloat(row.pending) || 0
      })),
      currency: currency,
      period: from
    });
    
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metrics summary',
      details: error.message 
    });
  }
});

// 获取趋势数据
router.get('/trend', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '6m', currency = 'EUR' } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 计算月份数
      const monthsMap = { '3m': 3, '6m': 6, '12m': 12 };
      const months = monthsMap[period] || 6;
      
      // 生成过去几个月的数据
      const trendData = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthKey = monthDate.toISOString().slice(0, 7);
        
        // 过滤该月的发票
        const monthInvoices = allInvoices.filter(inv => {
          const invoiceDate = new Date(inv.issueDate);
          return invoiceDate >= monthDate && invoiceDate < nextMonthDate;
        });
        
        // 计算该月的收入和待处理金额
        const revenue = monthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        const pending = monthInvoices
          .filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        trendData.push({
          month: monthKey,
          revenue: Math.round(revenue),
          pending: Math.round(pending),
          total_invoices: monthInvoices.length,
          paid_invoices: monthInvoices.filter(inv => inv.status === 'paid').length
        });
      }
      
      res.json({
        success: true,
        data: trendData,
        period,
        currency
      });
      
    } else {
      // 数据库模式下的实现
      const monthsMap = { '3m': 3, '6m': 6, '12m': 12 };
      const months = monthsMap[period] || 6;
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const trendData = await sequelize.query(`
        SELECT 
          DATE_FORMAT(issueDate, '%Y-%m') as month,
          SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as revenue,
          SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as pending,
          COUNT(*) as total_invoices,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices
        FROM Invoices 
        WHERE userId = :userId 
          AND issueDate >= :startDate
        GROUP BY DATE_FORMAT(issueDate, '%Y-%m')
        ORDER BY month ASC
      `, {
        replacements: { userId, startDate },
        type: sequelize.QueryTypes.SELECT
      });
      
      const formattedData = trendData.map(item => ({
        month: item.month,
        revenue: Math.round(parseFloat(item.revenue || 0)),
        pending: Math.round(parseFloat(item.pending || 0)),
        total_invoices: parseInt(item.total_invoices || 0),
        paid_invoices: parseInt(item.paid_invoices || 0)
      }));
      
      res.json({
        success: true,
        data: formattedData,
        period,
        currency
      });
    }
    
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trend data',
      details: error.message 
    });
  }
});

module.exports = router;