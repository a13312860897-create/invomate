const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { Invoice, Client, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// 检查是否为内存数据库模式
const isMemoryMode = !sequelize;
const PDFDocument = require('pdfkit');

// 为内存模式定义Customer别名
const Customer = Client;

// 应用全局中间件
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('reports'));

/**
 * @route   GET /api/reports
 * @desc    获取报表数据
 * @access  Private
 */
router.get('/', (req, res) => reportController.getReportData(req, res));

// 获取预测分析数据
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    const forecastMonths = Math.min(parseInt(months), 12); // 最多预测12个月
    
    if (isMemoryMode) {
      // 内存模式下的简化预测实现
      const paidInvoices = await Invoice.findAll({
        where: { userId, status: 'paid' }
      });

// 获取多维度分析数据
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const { dimension = 'customer', period = 'month', limit = 10 } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的多维度分析
      const invoices = await Invoice.findAll({
        where: { userId },
        include: [{ model: Customer, as: 'customer' }]
      });
      
      let analytics = {};
      
      if (dimension === 'customer') {
        // 按客户分析
        invoices.forEach(inv => {
          const customerName = inv.customer ? inv.customer.name : '未知客户';
          if (!analytics[customerName]) {
            analytics[customerName] = {
              totalRevenue: 0,
              invoiceCount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              overdueAmount: 0
            };
          }
          
          const total = parseFloat(inv.total) || 0;
          analytics[customerName].totalRevenue += total;
          analytics[customerName].invoiceCount += 1;
          
          if (inv.status === 'paid') {
            analytics[customerName].paidAmount += total;
          } else if (inv.status === 'pending') {
            analytics[customerName].pendingAmount += total;
          } else if (inv.status === 'overdue') {
            analytics[customerName].overdueAmount += total;
          }
        });
      } else if (dimension === 'status') {
        // 按状态分析
        invoices.forEach(inv => {
          const status = inv.status || 'unknown';
          if (!analytics[status]) {
            analytics[status] = {
              totalRevenue: 0,
              invoiceCount: 0,
              avgAmount: 0
            };
          }
          
          const total = parseFloat(inv.total) || 0;
          analytics[status].totalRevenue += total;
          analytics[status].invoiceCount += 1;
        });
        
        // 计算平均金额
        Object.keys(analytics).forEach(status => {
          analytics[status].avgAmount = analytics[status].totalRevenue / analytics[status].invoiceCount;
        });
      } else if (dimension === 'time') {
        // 按时间分析
        invoices.forEach(inv => {
          const date = new Date(inv.createdAt);
          let timePeriod;
          
          if (period === 'month') {
            timePeriod = date.toISOString().slice(0, 7);
          } else if (period === 'quarter') {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            timePeriod = `${date.getFullYear()}-Q${quarter}`;
          } else {
            timePeriod = date.getFullYear().toString();
          }
          
          if (!analytics[timePeriod]) {
            analytics[timePeriod] = {
              totalRevenue: 0,
              invoiceCount: 0,
              paidCount: 0,
              pendingCount: 0
            };
          }
          
          const total = parseFloat(inv.total) || 0;
          analytics[timePeriod].totalRevenue += total;
          analytics[timePeriod].invoiceCount += 1;
          
          if (inv.status === 'paid') {
            analytics[timePeriod].paidCount += 1;
          } else if (inv.status === 'pending') {
            analytics[timePeriod].pendingCount += 1;
          }
        });
      }
      
      // 转换为数组并排序
      const result = Object.entries(analytics)
        .map(([key, value]) => ({ name: key, ...value }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, parseInt(limit));
      
      return res.json({
        dimension,
        period,
        data: result,
        summary: {
          totalItems: Object.keys(analytics).length,
          totalRevenue: result.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalInvoices: result.reduce((sum, item) => sum + item.invoiceCount, 0)
        }
      });
    }
    
    // 数据库模式下的多维度分析
    let query, replacements;
    
    if (dimension === 'customer') {
      query = `
        SELECT 
          c.name as name,
          SUM(i.total) as totalRevenue,
          COUNT(i.id) as invoiceCount,
          SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as paidAmount,
          SUM(CASE WHEN i.status = 'pending' THEN i.total ELSE 0 END) as pendingAmount,
          SUM(CASE WHEN i.status = 'overdue' THEN i.total ELSE 0 END) as overdueAmount
        FROM Invoices i
        LEFT JOIN Customers c ON i.customerId = c.id
        WHERE i.userId = :userId
        GROUP BY c.id, c.name
        ORDER BY totalRevenue DESC
        LIMIT :limit
      `;
      replacements = { userId, limit: parseInt(limit) };
    } else if (dimension === 'status') {
      query = `
        SELECT 
          status as name,
          SUM(total) as totalRevenue,
          COUNT(id) as invoiceCount,
          AVG(total) as avgAmount
        FROM Invoices
        WHERE userId = :userId
        GROUP BY status
        ORDER BY totalRevenue DESC
      `;
      replacements = { userId };
    } else if (dimension === 'time') {
      let dateFormat;
      if (period === 'month') {
        dateFormat = '%Y-%m';
      } else if (period === 'quarter') {
        dateFormat = 'CONCAT(YEAR(createdAt), "-Q", QUARTER(createdAt))';
      } else {
        dateFormat = '%Y';
      }
      
      query = `
        SELECT 
          ${period === 'quarter' ? dateFormat : `DATE_FORMAT(createdAt, '${dateFormat}')`} as name,
          SUM(total) as totalRevenue,
          COUNT(id) as invoiceCount,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paidCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount
        FROM Invoices
        WHERE userId = :userId
        GROUP BY name
        ORDER BY name DESC
        LIMIT :limit
      `;
      replacements = { userId, limit: parseInt(limit) };
    }
    
    const analyticsData = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      dimension,
      period,
      data: analyticsData,
      summary: {
        totalItems: analyticsData.length,
        totalRevenue: analyticsData.reduce((sum, item) => sum + parseFloat(item.totalRevenue), 0),
        totalInvoices: analyticsData.reduce((sum, item) => sum + parseInt(item.invoiceCount), 0)
      }
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
      
      // 按月分组历史数据
      const monthlyData = {};
      paidInvoices.forEach(inv => {
        if (!inv.paidDate) return;
        const month = new Date(inv.paidDate).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, count: 0 };
        }
        monthlyData[month].revenue += parseFloat(inv.total) || 0;
        monthlyData[month].count += 1;
      });
      
      // 计算平均值进行简单预测
      const months = Object.keys(monthlyData).sort();
      const recentMonths = months.slice(-6); // 取最近6个月
      const avgRevenue = recentMonths.reduce((sum, month) => 
        sum + monthlyData[month].revenue, 0) / recentMonths.length;
      const avgCount = recentMonths.reduce((sum, month) => 
        sum + monthlyData[month].count, 0) / recentMonths.length;
      
      // 生成预测数据
      const forecast = [];
      const now = new Date();
      for (let i = 1; i <= forecastMonths; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const period = futureDate.toISOString().slice(0, 7);
        
        // 简单的线性预测，可以根据需要改进
        const trendFactor = 1 + (i * 0.02); // 假设每月增长2%
        forecast.push({
          period,
          predictedRevenue: Math.round(avgRevenue * trendFactor),
          predictedInvoices: Math.round(avgCount * trendFactor),
          confidence: Math.max(0.5, 1 - (i * 0.1)) // 置信度随时间递减
        });
      }
      
      return res.json({
        historical: recentMonths.map(month => ({
          period: month,
          revenue: monthlyData[month].revenue,
          invoices: monthlyData[month].count
        })),
        forecast,
        summary: {
          avgMonthlyRevenue: avgRevenue,
          avgMonthlyInvoices: avgCount,
          totalForecastRevenue: forecast.reduce((sum, f) => sum + f.predictedRevenue, 0)
        }
      });
    }
    
    // 数据库模式下的预测分析
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const historicalData = await sequelize.query(`
      SELECT 
        DATE_FORMAT(paidDate, '%Y-%m') as period,
        SUM(total) as revenue,
        COUNT(*) as invoices
      FROM Invoices 
      WHERE userId = :userId 
        AND status = 'paid' 
        AND paidDate >= :sixMonthsAgo
      GROUP BY DATE_FORMAT(paidDate, '%Y-%m')
      ORDER BY period
    `, {
      replacements: { userId, sixMonthsAgo },
      type: sequelize.QueryTypes.SELECT
    });
    
    // 计算趋势和预测
    const avgRevenue = historicalData.reduce((sum, item) => sum + parseFloat(item.revenue), 0) / historicalData.length;
    const avgInvoices = historicalData.reduce((sum, item) => sum + parseInt(item.invoices), 0) / historicalData.length;
    
    // 简单的线性回归预测
    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= forecastMonths; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const period = futureDate.toISOString().slice(0, 7);
      
      const trendFactor = 1 + (i * 0.02);
      forecast.push({
        period,
        predictedRevenue: Math.round(avgRevenue * trendFactor),
        predictedInvoices: Math.round(avgInvoices * trendFactor),
        confidence: Math.max(0.5, 1 - (i * 0.1))
      });
    }
    
    res.json({
      historical: historicalData,
      forecast,
      summary: {
        avgMonthlyRevenue: avgRevenue,
        avgMonthlyInvoices: avgInvoices,
        totalForecastRevenue: forecast.reduce((sum, f) => sum + f.predictedRevenue, 0)
      }
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取收入报告
router.get('/revenue', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, groupBy = 'month', nodeCount = 10 } = req.query;
    
      console.log('Revenue report request:', { userId, startDate, endDate, groupBy, nodeCount });
      
      // 验证参数
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
    
    if (isMemoryMode) {
      // 内存模式下的智能实现
      const whereClause = { userId, status: 'paid' };
      const allInvoices = await Invoice.findAll({ where: whereClause });
      
      console.log('Found invoices:', allInvoices.length);
      
      // 过滤日期范围
      let filteredInvoices = allInvoices;
      if (startDate || endDate) {
        filteredInvoices = allInvoices.filter(inv => {
          if (!inv.paidDate) return false;
          const paidDate = new Date(inv.paidDate);
          if (startDate && paidDate < new Date(startDate)) return false;
          if (endDate && paidDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      console.log('Filtered invoices:', filteredInvoices.length);
      
      // 智能分组逻辑 - 根据日期跨度和节点数量动态分组
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const segmentDays = Math.ceil(totalDays / parseInt(nodeCount));
      
      console.log('Date range analysis:', { totalDays, segmentDays, nodeCount });
      
      const groupedData = {};
      
      // 生成时间段
      for (let i = 0; i < parseInt(nodeCount); i++) {
        const segmentStart = new Date(start);
        segmentStart.setDate(start.getDate() + (i * segmentDays));
        
        const segmentEnd = new Date(start);
        segmentEnd.setDate(start.getDate() + ((i + 1) * segmentDays));
        
        // 确保最后一个段不超过结束日期
        if (i === parseInt(nodeCount) - 1 || segmentEnd > end) {
          segmentEnd.setTime(end.getTime());
        }
        
        let period;
        switch (groupBy) {
          case 'day':
            period = segmentStart.toISOString().slice(0, 10);
            break;
          case 'week':
            const weekNum = Math.floor(segmentStart.getTime() / (7 * 24 * 60 * 60 * 1000));
            period = `${segmentStart.getFullYear()}-W${weekNum % 52 + 1}`;
            break;
          case 'quarter':
            const quarter = Math.floor(segmentStart.getMonth() / 3) + 1;
            period = `${segmentStart.getFullYear()}-Q${quarter}`;
            break;
          case 'year':
            period = segmentStart.getFullYear().toString();
            break;
          default: // month
            period = segmentStart.toISOString().slice(0, 7);
        }
        
        groupedData[period] = { 
          revenue: 0, 
          invoiceCount: 0, 
          total: 0,
          segmentStart: segmentStart.toISOString().slice(0, 10),
          segmentEnd: segmentEnd.toISOString().slice(0, 10)
        };
        
        // 统计该时间段内的发票
        filteredInvoices.forEach(inv => {
          if (!inv.paidDate) return;
          const paidDate = new Date(inv.paidDate);
          if (paidDate >= segmentStart && paidDate <= segmentEnd) {
            const amount = parseFloat(inv.total) || 0;
            groupedData[period].revenue += amount;
            groupedData[period].invoiceCount += 1;
            groupedData[period].total += amount;
          }
        });
      }
      
      const formattedData = Object.keys(groupedData).sort().map(period => ({
        period,
        month: period, // 保持兼容性
        revenue: groupedData[period].revenue,
        amount: groupedData[period].revenue, // 前端期望的字段
        invoiceCount: groupedData[period].invoiceCount,
        averageAmount: groupedData[period].invoiceCount > 0 ? groupedData[period].revenue / groupedData[period].invoiceCount : 0,
        segmentStart: groupedData[period].segmentStart,
        segmentEnd: groupedData[period].segmentEnd
      }));
      
      console.log('Formatted data:', formattedData);
      
      const totals = {
        totalRevenue: formattedData.reduce((sum, item) => sum + item.revenue, 0),
        totalInvoices: formattedData.reduce((sum, item) => sum + item.invoiceCount, 0),
        paidAmount: formattedData.reduce((sum, item) => sum + item.revenue, 0),
        pendingAmount: 0, // 简化实现
        overdueAmount: 0, // 简化实现
        growthRate: 0 // 简化实现
      };
      
      // 返回前端期望的格式
      const revenueReport = {
        monthlyData: formattedData,
        totalRevenue: totals.totalRevenue,
        paidAmount: totals.paidAmount,
        pendingAmount: totals.pendingAmount,
        overdueAmount: totals.overdueAmount,
        growthRate: totals.growthRate,
        totalInvoices: totals.totalInvoices,
        groupBy,
        nodeCount: parseInt(nodeCount),
        dateRange: { startDate, endDate }
      };
      
      console.log('Final revenue report:', revenueReport);
      
      return res.json(revenueReport);
    }
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paidDate = {};
      if (startDate) dateFilter.paidDate[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.paidDate[Op.lte] = new Date(endDate);
    }

    // 根据groupBy参数确定日期格式
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default: // month
        dateFormat = '%Y-%m';
    }

    const revenueData = await Invoice.findAll({
      where: {
        userId,
        status: 'paid',
        ...dateFilter
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('paidDate'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount'],
        [sequelize.fn('AVG', sequelize.col('total')), 'averageAmount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('paidDate'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('paidDate'), dateFormat), 'ASC']]
    });

    const formattedData = revenueData.map(item => ({
      period: item.dataValues.period,
      revenue: parseFloat(item.dataValues.revenue || 0),
      invoiceCount: parseInt(item.dataValues.invoiceCount || 0),
      averageAmount: parseFloat(item.dataValues.averageAmount || 0)
    }));

    // 计算总计
    const totals = {
      totalRevenue: formattedData.reduce((sum, item) => sum + item.revenue, 0),
      totalInvoices: formattedData.reduce((sum, item) => sum + item.invoiceCount, 0),
      averageRevenue: formattedData.length > 0 ? formattedData.reduce((sum, item) => sum + item.revenue, 0) / formattedData.length : 0
    };

    // 返回前端期望的格式
    const revenueReport = {
      monthlyData: formattedData.map(item => ({
        month: item.period,
        amount: item.revenue,
        invoiceCount: item.invoiceCount,
        averageAmount: item.averageAmount
      })),
      totalRevenue: totals.totalRevenue,
      totalInvoices: totals.totalInvoices,
      averageRevenue: totals.averageRevenue,
      groupBy
    };
    
    res.json(revenueReport);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取客户报告
router.get('/clients', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, sortBy = 'revenue', order = 'DESC' } = req.query;

    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allClients = await Client.findAll({ where: { userId } });
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      const clientStats = allClients.map(client => {
        const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
        const invoiceCount = clientInvoices.length;
        const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const averageInvoice = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
        const paidAmount = clientInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const pendingAmount = clientInvoices
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        return {
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
          invoiceCount,
          totalRevenue,
          averageInvoice,
          paidAmount,
          pendingAmount
        };
      });
      
      // 排序
      const sortField = sortBy === 'revenue' ? 'totalRevenue' : sortBy;
      clientStats.sort((a, b) => {
        const aVal = a[sortField] || 0;
        const bVal = b[sortField] || 0;
        return order === 'DESC' ? bVal - aVal : aVal - bVal;
      });
      
      const limitedStats = clientStats.slice(0, parseInt(limit));
      
      // 生成客户增长数据（按月统计新客户）
      const monthlyGrowth = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthKey = monthDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        
        // 统计该月新增的客户（根据创建时间）
        const newClientsCount = allClients.filter(client => {
          const clientDate = new Date(client.createdAt);
          return clientDate >= monthDate && clientDate < nextMonthDate;
        }).length;
        
        monthlyGrowth.push({
          month: monthKey,
          count: newClientsCount
        });
      }
      
      // 返回前端期望的完整客户报告格式
      const clientReport = {
        totalClients: allClients.length,
        activeClients: clientStats.filter(c => c.invoiceCount > 0).length,
        newClients: clientStats.filter(c => c.invoiceCount === 1).length,
        topClients: limitedStats,
        clientGrowth: 0, // 可以根据需要计算增长率
        monthlyGrowth: monthlyGrowth
      };
      
      return res.json(clientReport);
    }

    const clientStats = await Client.findAll({
      where: { userId },
      include: [{
        model: Invoice,
        attributes: [],
        required: false
      }],
      attributes: [
        'id',
        'name',
        'company',
        'email',
        [sequelize.fn('COUNT', sequelize.col('Invoices.id')), 'invoiceCount'],
        [sequelize.fn('SUM', sequelize.col('Invoices.total')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('Invoices.total')), 'averageInvoice'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN Invoices.status = 'paid' THEN Invoices.total ELSE 0 END")), 'paidAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN Invoices.status = 'sent' THEN Invoices.total ELSE 0 END")), 'pendingAmount']
      ],
      group: ['Client.id'],
      order: [[sequelize.literal(sortBy === 'revenue' ? 'totalRevenue' : sortBy), order]],
      limit: parseInt(limit)
    });

    const formattedStats = clientStats.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      invoiceCount: parseInt(client.dataValues.invoiceCount || 0),
      totalRevenue: parseFloat(client.dataValues.totalRevenue || 0),
      averageInvoice: parseFloat(client.dataValues.averageInvoice || 0),
      paidAmount: parseFloat(client.dataValues.paidAmount || 0),
      pendingAmount: parseFloat(client.dataValues.pendingAmount || 0)
    }));

    // 生成客户增长数据（数据库模式）
    const monthlyGrowthData = await sequelize.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y年%c月') as month,
        COUNT(*) as count
      FROM Clients 
      WHERE userId = :userId 
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY DATE_FORMAT(createdAt, '%Y-%m')
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    // 返回前端期望的完整客户报告格式
    const clientReport = {
      totalClients: formattedStats.length, // 这里可能需要单独查询总数
      activeClients: formattedStats.filter(c => c.invoiceCount > 0).length,
      newClients: formattedStats.filter(c => c.invoiceCount === 1).length,
      topClients: formattedStats,
      clientGrowth: 0, // 可以根据需要计算增长率
      monthlyGrowth: monthlyGrowthData
    };
    
    res.json(clientReport);
  } catch (error) {
    console.error('Error fetching client report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取税务报告
router.get('/tax', async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, quarter } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      let allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 日期过滤
      if (quarter) {
        const quarterStart = new Date(currentYear, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, quarter * 3, 0);
        allInvoices = allInvoices.filter(inv => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= quarterStart && issueDate <= quarterEnd;
        });
      } else {
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);
        allInvoices = allInvoices.filter(inv => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= yearStart && issueDate <= yearEnd;
        });
      }
      
      // 计算总计
      const totalSubtotal = allInvoices.reduce((sum, inv) => sum + (parseFloat(inv.subtotal) || 0), 0);
      const totalTax = allInvoices.reduce((sum, inv) => sum + (parseFloat(inv.taxAmount) || 0), 0);
      const totalAmount = allInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      const invoiceCount = allInvoices.length;
      
      // 按税率分组
      const taxRateGroups = {};
      allInvoices.forEach(inv => {
        const rate = parseFloat(inv.taxRate) || 0;
        if (!taxRateGroups[rate]) {
          taxRateGroups[rate] = {
            taxRate: rate,
            subtotal: 0,
            taxAmount: 0,
            count: 0
          };
        }
        taxRateGroups[rate].subtotal += parseFloat(inv.subtotal) || 0;
        taxRateGroups[rate].taxAmount += parseFloat(inv.taxAmount) || 0;
        taxRateGroups[rate].count += 1;
      });
      
      const taxByRate = Object.values(taxRateGroups).sort((a, b) => a.taxRate - b.taxRate);
      
      // 生成季度税务数据
      const quarterlyTax = [];
      for (let q = 1; q <= 4; q++) {
        const qStart = new Date(currentYear, (q - 1) * 3, 1);
        const qEnd = new Date(currentYear, q * 3, 0);
        const quarterInvoices = allInvoices.filter(inv => {
          const issueDate = new Date(inv.issueDate);
          return issueDate >= qStart && issueDate <= qEnd;
        });
        const quarterRevenue = quarterInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const quarterTax = quarterInvoices.reduce((sum, inv) => sum + (parseFloat(inv.taxAmount) || 0), 0);
        quarterlyTax.push({
          quarter: `Q${q} ${currentYear}`,
          totalRevenue: quarterRevenue,
          taxAmount: quarterTax
        });
      }

      const result = {
        period: quarter ? `${currentYear} Q${quarter}` : currentYear.toString(),
        summary: {
          totalSubtotal,
          totalTax,
          totalAmount,
          invoiceCount
        },
        taxByRate: taxByRate.map(item => ({
          rate: item.taxRate,
          amount: item.taxAmount,
          subtotal: item.subtotal,
          invoiceCount: item.count
        })),
        quarterlyTax
      };
      
      return res.json(result);
    }
    
    let dateFilter = {};
    if (quarter) {
      const quarterStart = new Date(currentYear, (quarter - 1) * 3, 1);
      const quarterEnd = new Date(currentYear, quarter * 3, 0);
      dateFilter.issueDate = {
        [Op.between]: [quarterStart, quarterEnd]
      };
    } else {
      dateFilter.issueDate = {
        [Op.between]: [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31)]
      };
    }

    const taxData = await Invoice.findAll({
      where: {
        userId,
        ...dateFilter
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalSubtotal'],
        [sequelize.fn('SUM', sequelize.col('taxAmount')), 'totalTax'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount']
      ]
    });

    // 按税率分组统计
    const taxByRate = await Invoice.findAll({
      where: {
        userId,
        ...dateFilter
      },
      attributes: [
        'taxRate',
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'subtotal'],
        [sequelize.fn('SUM', sequelize.col('taxAmount')), 'taxAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['taxRate'],
      order: [['taxRate', 'ASC']]
    });

    // 生成季度税务数据
    const quarterlyTax = [];
    for (let q = 1; q <= 4; q++) {
      const qStart = new Date(currentYear, (q - 1) * 3, 1);
      const qEnd = new Date(currentYear, q * 3, 0);
      
      const quarterData = await Invoice.findAll({
        where: {
          userId,
          issueDate: {
            [Op.between]: [qStart, qEnd]
          }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('taxAmount')), 'taxAmount']
        ]
      });
      
      quarterlyTax.push({
        quarter: `Q${q} ${currentYear}`,
        totalRevenue: parseFloat(quarterData[0]?.dataValues?.totalRevenue || 0),
        taxAmount: parseFloat(quarterData[0]?.dataValues?.taxAmount || 0)
      });
    }

    const result = {
      period: quarter ? `${currentYear} Q${quarter}` : currentYear.toString(),
      summary: {
        totalSubtotal: parseFloat(taxData[0]?.dataValues?.totalSubtotal || 0),
        totalTax: parseFloat(taxData[0]?.dataValues?.totalTax || 0),
        totalAmount: parseFloat(taxData[0]?.dataValues?.totalAmount || 0),
        invoiceCount: parseInt(taxData[0]?.dataValues?.invoiceCount || 0)
      },
      taxByRate: taxByRate.map(item => ({
        rate: parseFloat(item.taxRate || 0),
        amount: parseFloat(item.dataValues.taxAmount || 0),
        subtotal: parseFloat(item.dataValues.subtotal || 0),
        invoiceCount: parseInt(item.dataValues.count || 0)
      })),
      quarterlyTax
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching tax report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 导出发票数据为CSV
router.get('/export/invoices', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;
    
    let whereClause = { userId };
    if (startDate || endDate) {
      whereClause.issueDate = {};
      if (startDate) whereClause.issueDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.issueDate[Op.lte] = new Date(endDate);
    }
    if (status) {
      whereClause.status = status;
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [{
        model: Client,
        attributes: ['name', 'company', 'email']
      }],
      order: [['issueDate', 'DESC']]
    });

    // 生成CSV内容
    const csvHeaders = [
      'Invoice Number',
      'Client Name',
      'Client Company',
      'Issue Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax Rate',
      'Tax Amount',
      'Total',
      'Currency'
    ];

    const csvRows = invoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.Client?.name || '',
      invoice.Client?.company || '',
      invoice.issueDate?.toISOString().split('T')[0] || '',
      invoice.dueDate?.toISOString().split('T')[0] || '',
      invoice.status,
      invoice.subtotal,
      invoice.taxRate,
      invoice.taxAmount,
      invoice.total,
      invoice.currency
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 生成PDF报告
router.get('/export/pdf', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'revenue', startDate, endDate } = req.query;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 创建PDF文档
    const doc = new PDFDocument();
    const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // 添加标题
    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.text(`User: ${user.email}`, 50, 100);
    
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'Beginning'} to ${endDate || 'Now'}`, 50, 120);
    }

    // 根据报告类型添加内容
    if (type === 'revenue') {
      // 获取收入数据并添加到PDF
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.paidDate = {};
        if (startDate) dateFilter.paidDate[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.paidDate[Op.lte] = new Date(endDate);
      }

      const revenueData = await Invoice.findAll({
        where: {
          userId,
          status: 'paid',
          ...dateFilter
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount'],
          [sequelize.fn('AVG', sequelize.col('total')), 'averageAmount']
        ]
      });

      const stats = revenueData[0]?.dataValues || {};
      
      doc.fontSize(14).text('Revenue Summary', 50, 160);
      doc.fontSize(12)
        .text(`Total Revenue: €${parseFloat(stats.totalRevenue || 0).toFixed(2)}`, 70, 180)
        .text(`Total Invoices: ${parseInt(stats.invoiceCount || 0)}`, 70, 200)
        .text(`Average Invoice: €${parseFloat(stats.averageAmount || 0).toFixed(2)}`, 70, 220);
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取发票状态统计
router.get('/status-summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的状态统计
      const invoices = await Invoice.findAll({ where: { userId } });
      
      // 手动过滤日期范围
      let filteredInvoices = invoices;
      if (startDate || endDate) {
        filteredInvoices = invoices.filter(invoice => {
          const issueDate = new Date(invoice.issueDate);
          if (startDate && issueDate < new Date(startDate)) return false;
          if (endDate && issueDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      const statusStats = {};
      filteredInvoices.forEach(invoice => {
        const status = invoice.status || 'draft';
        if (!statusStats[status]) {
          statusStats[status] = { count: 0, amount: 0 };
        }
        statusStats[status].count += 1;
        statusStats[status].amount += parseFloat(invoice.total || 0);
      });

      const formattedStats = Object.keys(statusStats).map(status => ({
        status,
        count: statusStats[status].count,
        amount: statusStats[status].amount
      }));

      // 计算总计
      const totals = {
        totalCount: formattedStats.reduce((sum, stat) => sum + stat.count, 0),
        totalAmount: formattedStats.reduce((sum, stat) => sum + stat.amount, 0)
      };

      res.json({
        data: {
          statusBreakdown: formattedStats,
          totals,
          dateRange: { startDate, endDate }
        }
      });
    } else {
      // PostgreSQL模式
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.issueDate = {};
        if (startDate) dateFilter.issueDate[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.issueDate[Op.lte] = new Date(endDate);
      }

      const statusStats = await Invoice.findAll({
        where: {
          userId,
          ...dateFilter
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total')), 'amount']
        ],
        group: ['status']
      });

      const formattedStats = statusStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.dataValues.count || 0),
        amount: parseFloat(stat.dataValues.amount || 0)
      }));

      // 计算总计
      const totals = {
        totalCount: formattedStats.reduce((sum, stat) => sum + stat.count, 0),
        totalAmount: formattedStats.reduce((sum, stat) => sum + stat.amount, 0)
      };

      res.json({
        data: {
          statusBreakdown: formattedStats,
          totals,
          dateRange: { startDate, endDate }
        }
      });
    }
  } catch (error) {
    console.error('Error fetching status summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取发票状态报告
router.get('/invoice-status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      let allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 过滤日期范围
      if (startDate || endDate) {
        allInvoices = allInvoices.filter(inv => {
          const issueDate = new Date(inv.issueDate);
          if (startDate && issueDate < new Date(startDate)) return false;
          if (endDate && issueDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      // 按状态分组统计
      const statusGroups = {};
      allInvoices.forEach(inv => {
        if (!statusGroups[inv.status]) {
          statusGroups[inv.status] = { count: 0, amount: 0, invoices: [] };
        }
        statusGroups[inv.status].count += 1;
        statusGroups[inv.status].amount += parseFloat(inv.total) || 0;
        statusGroups[inv.status].invoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName || 'Unknown Client',
          amount: parseFloat(inv.total) || 0,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          status: inv.status
        });
      });
      
      const statusBreakdown = Object.keys(statusGroups).map(status => ({
        status,
        count: statusGroups[status].count,
        amount: statusGroups[status].amount,
        percentage: allInvoices.length > 0 ? (statusGroups[status].count / allInvoices.length) * 100 : 0,
        invoices: statusGroups[status].invoices
      }));
      
      const totals = {
        totalInvoices: allInvoices.length,
        totalAmount: allInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
      };
      
      return res.json({
        statusDistribution: statusBreakdown,
        totals,
        dateRange: { startDate, endDate }
      });
    }
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.issueDate = {};
      if (startDate) dateFilter.issueDate[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.issueDate[Op.lte] = new Date(endDate);
    }
    
    // 获取状态统计
    const statusStats = await Invoice.findAll({
      where: {
        userId,
        ...dateFilter
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'amount']
      ],
      group: ['status']
    });
    
    // 获取总数用于计算百分比
    const totalCount = await Invoice.count({
      where: {
        userId,
        ...dateFilter
      }
    });
    
    // 获取每个状态的详细发票信息
    const detailedInvoices = await Invoice.findAll({
      where: {
        userId,
        ...dateFilter
      },
      include: [{
        model: Client,
        attributes: ['name']
      }],
      order: [['issueDate', 'DESC']]
    });
    
    const statusBreakdown = statusStats.map(stat => {
      const statusInvoices = detailedInvoices.filter(inv => inv.status === stat.status);
      
      return {
        status: stat.status,
        count: parseInt(stat.dataValues.count || 0),
        amount: parseFloat(stat.dataValues.amount || 0),
        percentage: totalCount > 0 ? (parseInt(stat.dataValues.count || 0) / totalCount) * 100 : 0,
        invoices: statusInvoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.Client?.name || 'Unknown Client',
          amount: parseFloat(inv.total) || 0,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          status: inv.status
        }))
      };
    });
    
    const totals = {
      totalInvoices: totalCount,
      totalAmount: statusBreakdown.reduce((sum, stat) => sum + stat.amount, 0)
    };
    
    res.json({
      statusDistribution: statusBreakdown,
      totals,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching invoice status report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// 获取逾期客户数据
router.get('/overdue-customers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;
    
    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      const allClients = await Client.findAll({ where: { userId } });
      
      // 计算每个客户的逾期数据
      const overdueCustomers = [];
      
      allClients.forEach(client => {
        const clientInvoices = allInvoices.filter(inv => 
          inv.clientId === client.id && 
          inv.status !== 'paid' && 
          new Date(inv.dueDate) < new Date()
        );
        
        if (clientInvoices.length > 0) {
          const overdueAmount = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
          const oldestInvoice = clientInvoices.reduce((oldest, inv) => 
            new Date(inv.dueDate) < new Date(oldest.dueDate) ? inv : oldest
          );
          const daysOverdue = Math.floor((new Date() - new Date(oldestInvoice.dueDate)) / (1000 * 60 * 60 * 24));
          
          overdueCustomers.push({
            id: client.id,
            name: client.name,
            company: client.company,
            email: client.email,
            overdue_amount: overdueAmount,
            days_overdue: daysOverdue,
            invoice_count: clientInvoices.length
          });
        }
      });
      
      // 按逾期金额排序并限制数量
      overdueCustomers.sort((a, b) => b.overdue_amount - a.overdue_amount);
      const limitedCustomers = overdueCustomers.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: limitedCustomers,
        total: overdueCustomers.length
      });
      
    } else {
      // 数据库模式下的实现
      const overdueCustomers = await Client.findAll({
        attributes: [
          'id', 'name', 'company', 'email',
          [sequelize.fn('SUM', sequelize.col('Invoices.total')), 'overdue_amount'],
          [sequelize.fn('COUNT', sequelize.col('Invoices.id')), 'invoice_count'],
          [sequelize.fn('MIN', sequelize.col('Invoices.dueDate')), 'oldest_due_date']
        ],
        include: [{
          model: Invoice,
          where: {
            userId: userId,
            status: { [Op.ne]: 'paid' },
            dueDate: { [Op.lt]: new Date() }
          },
          attributes: []
        }],
        group: ['Client.id'],
        order: [[sequelize.literal('overdue_amount'), 'DESC']],
        limit: parseInt(limit),
        raw: true
      });
      
      // 计算逾期天数
      const formattedCustomers = overdueCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        overdue_amount: parseFloat(customer.overdue_amount || 0),
        days_overdue: Math.floor((new Date() - new Date(customer.oldest_due_date)) / (1000 * 60 * 60 * 24)),
        invoice_count: parseInt(customer.invoice_count || 0)
      }));
      
      res.json({
        success: true,
        data: formattedCustomers
      });
    }
    
  } catch (error) {
    console.error('Error fetching overdue customers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch overdue customers',
      details: error.message 
    });
  }
});