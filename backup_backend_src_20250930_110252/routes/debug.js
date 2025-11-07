const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// 检查是否为内存数据库模式
const { sequelize } = require('../models');
const isMemoryMode = !sequelize;

if (isMemoryMode) {
  const memoryDb = require('../config/memoryDatabase');
  
  // 重置内存数据库
  router.post('/reset-memory', authenticateToken, (req, res) => {
    try {
      // 清空所有发票数据
      memoryDb.invoices.length = 0;
      memoryDb.nextIds.invoices = 1;
      
      console.log('内存数据库已重置');
      res.json({ success: true, message: '内存数据库已重置' });
    } catch (error) {
      console.error('重置内存数据库失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 创建测试发票
  router.post('/create-invoice', authenticateToken, (req, res) => {
    try {
      const { userId, status, createdAt, total, paidDate } = req.body;
      
      const invoice = {
        id: memoryDb.nextIds.invoices++,
        userId: userId || req.user.id,
        clientId: 1, // 使用默认客户端
        invoiceNumber: `INV-${String(memoryDb.nextIds.invoices - 1).padStart(4, '0')}`,
        status: status || 'draft',
        createdAt: createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
        total: total || 0,
        subtotal: total || 0,
        tax: 0,
        discount: 0,
        dueDate: paidDate ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidDate: paidDate || null,
        items: [{
          id: memoryDb.nextIds.invoiceItems++,
          description: '测试项目',
          quantity: 1,
          rate: total || 0,
          total: total || 0
        }]
      };
      
      memoryDb.invoices.push(invoice);
      
      console.log('创建测试发票:', invoice.id, invoice.status, invoice.total);
      res.json({ success: true, data: invoice });
    } catch (error) {
      console.error('创建测试发票失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 获取内存状态
  router.get('/memory-state', authenticateToken, (req, res) => {
    try {
      const userId = req.user.id;
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const targetMonth = req.query.month || currentMonth;
      
      // 统计数据
      const totalInvoices = memoryDb.invoices.length;
      const userInvoices = memoryDb.invoices.filter(inv => inv.userId === userId);
      const monthInvoices = userInvoices.filter(inv => {
        let createdAt;
        if (typeof inv.createdAt === 'string') {
          createdAt = inv.createdAt;
        } else if (inv.createdAt instanceof Date) {
          createdAt = inv.createdAt.toISOString().split('T')[0];
        } else {
          return false;
        }
        return createdAt.startsWith(targetMonth);
      });
      const monthPaidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
      const monthPaidAmount = monthPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
      
      // 详细发票信息
      const invoiceDetails = memoryDb.invoices.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        status: inv.status,
        createdAt: inv.createdAt,
        total: inv.total,
        paidDate: inv.paidDate
      }));
      
      const result = {
        totalInvoices,
        userInvoices: userInvoices.length,
        septemberInvoices: monthInvoices.length,
        septemberPaidInvoices: monthPaidInvoices.length,
        septemberPaidAmount: monthPaidAmount,
        targetMonth,
        invoiceDetails
      };
      
      console.log('内存状态查询:', result);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('获取内存状态失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 验证数据一致性
  router.get('/validate-consistency', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const targetMonth = req.query.month || currentMonth;
      
      // 创建DataService实例
      const DataService = require('../services/DataService');
      const memoryDataSource = {
        type: 'memory',
        invoices: memoryDb.invoices
      };
      const dataService = new DataService(memoryDataSource);
      
      // 调用数据一致性验证方法
      const consistencyResult = await dataService.validateDataConsistency(userId, targetMonth);
      
      console.log('数据一致性验证结果:', consistencyResult);
      res.json({ success: true, data: consistencyResult });
    } catch (error) {
      console.error('数据一致性验证失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
} else {
  // 数据库模式下的占位符路由
  router.all('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: '调试API仅在内存模式下可用' 
    });
  });
}

module.exports = router;