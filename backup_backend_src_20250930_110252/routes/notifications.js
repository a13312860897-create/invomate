const express = require('express');
const router = express.Router();
const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { Invoice, Client, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// 应用全局中间件
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('notifications'));

// 测试邮件配置
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址是必需的'
      });
    }
    
    // 发送测试邮件
    await emailService.sendTestEmail(email);
    
    res.json({
      success: true,
      message: '测试邮件发送成功'
    });
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '发送测试邮件失败: ' + error.message
    });
  }
});

// 获取用户通知
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type, read } = req.query;
    const now = new Date();
    const notifications = [];

    // 逾期发票通知
    if (!type || type === 'overdue') {
      const overdueInvoices = await Invoice.findAll({
        where: {
          userId,
          status: 'sent',
          dueDate: {
            [Op.lt]: now
          }
        },
        include: [{
          model: Client,
          attributes: ['name', 'company']
        }],
        order: [['dueDate', 'ASC']],
        limit: 5
      });

      overdueInvoices.forEach(invoice => {
        const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `overdue-${invoice.id}`,
          type: 'overdue',
          title: '逾期发票提醒',
          message: `发票 ${invoice.invoiceNumber} 已逾期 ${daysOverdue} 天`,
          priority: 'high',
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.Client?.name || invoice.Client?.company,
            amount: invoice.total,
            currency: invoice.currency,
            daysOverdue
          },
          createdAt: invoice.dueDate,
          read: false
        });
      });
    }

    // 即将到期发票通知（7天内）
    if (!type || type === 'due_soon') {
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      
      const dueSoonInvoices = await Invoice.findAll({
        where: {
          userId,
          status: 'sent',
          dueDate: {
            [Op.between]: [now, sevenDaysLater]
          }
        },
        include: [{
          model: Client,
          attributes: ['name', 'company']
        }],
        order: [['dueDate', 'ASC']],
        limit: 5
      });

      dueSoonInvoices.forEach(invoice => {
        const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - now) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `due-soon-${invoice.id}`,
          type: 'due_soon',
          title: '即将到期发票',
          message: `发票 ${invoice.invoiceNumber} 将在 ${daysUntilDue} 天后到期`,
          priority: 'medium',
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.Client?.name || invoice.Client?.company,
            amount: invoice.total,
            currency: invoice.currency,
            daysUntilDue
          },
          createdAt: new Date(),
          read: false
        });
      });
    }

    // 升级提醒（Freemium用户）
    if (!type || type === 'upgrade') {
      const user = await User.findByPk(userId);
      // 检查是否为内存数据库模式
      const invoiceCount = sequelize ? await Invoice.count({ where: { userId } }) : 0;
      
      if (user.subscriptionType === 'free' && invoiceCount >= 5) {
        notifications.push({
          id: 'upgrade-reminder',
          type: 'upgrade',
          title: '升级提醒',
          message: '您已接近免费版发票限制，考虑升级到专业版以解锁更多功能',
          priority: 'low',
          data: {
            currentPlan: user.subscriptionType,
            invoiceCount,
            limit: 5
          },
          createdAt: new Date(),
          read: false
        });
      }
    }

    // 按创建时间排序并分页
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);

    res.json({
      notifications: sortedNotifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 发送发票邮件
router.post('/send-invoice/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.id;
    const { customMessage, sendCopy = false } = req.body;

    // 验证发票是否存在且属于当前用户
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId },
      include: [{
        model: Client,
        required: true
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在或不属于当前用户'
      });
    }

    if (!invoice.Client.email) {
      return res.status(400).json({
        success: false,
        message: '客户邮箱地址不存在'
      });
    }

    // 生成PDF
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice);
    
    // 发送邮件
    const emailData = {
      to: invoice.Client.email,
      subject: `发票 ${invoice.invoiceNumber}`,
      template: 'invoice-email',
      data: {
        clientName: invoice.Client.name || invoice.Client.company,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        customMessage: customMessage || '感谢您的业务合作！'
      },
      attachments: [{
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer
      }]
    };

    if (sendCopy) {
      const user = await User.findByPk(userId);
      emailData.cc = user.email;
    }

    await emailService.sendEmail(emailData);

    // 更新发票状态为已发送
    await Invoice.update(
      { 
        status: 'sent',
        sentDate: new Date()
      },
      { where: { id: invoiceId } }
    );

    res.json({
      success: true,
      message: '发票已成功发送'
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({
      success: false,
      message: '发送发票失败',
      error: error.message
    });
  }
});

// 发送付款提醒
router.post('/payment-reminder/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.id;
    const { customMessage } = req.body;

    // 验证发票是否存在且属于当前用户
    const invoice = await Invoice.findOne({
      where: { 
        id: invoiceId, 
        userId,
        status: 'sent' // 只能对已发送的发票发送提醒
      },
      include: [{
        model: Client,
        required: true
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在、不属于当前用户或状态不正确'
      });
    }

    if (!invoice.Client.email) {
      return res.status(400).json({
        success: false,
        message: '客户邮箱地址不存在'
      });
    }

    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const isOverdue = dueDate < now;
    const daysDiff = Math.abs(Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)));

    // 发送付款提醒邮件
    const emailData = {
      to: invoice.Client.email,
      subject: `付款提醒 - 发票 ${invoice.invoiceNumber}`,
      template: 'payment-reminder',
      data: {
        clientName: invoice.Client.name || invoice.Client.company,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        isOverdue,
        daysDiff,
        customMessage: customMessage || (isOverdue ? 
          '您的发票已逾期，请尽快付款。' : 
          '友情提醒您的发票即将到期，请及时付款。')
      }
    };

    await emailService.sendEmail(emailData);

    res.json({
      success: true,
      message: '付款提醒已发送'
    });
  } catch (error) {
    console.error('Send payment reminder error:', error);
    res.status(500).json({
      success: false,
      message: '发送付款提醒失败',
      error: error.message
    });
  }
});

// 批量发送付款提醒
router.post('/batch-payment-reminders', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceIds, customMessage } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的发票ID列表'
      });
    }

    const invoices = await Invoice.findAll({
      where: {
        id: { [Op.in]: invoiceIds },
        userId,
        status: 'sent'
      },
      include: [{
        model: Client,
        required: true
      }]
    });

    const results = [];
    const now = new Date();

    for (const invoice of invoices) {
      try {
        if (!invoice.Client.email) {
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            success: false,
            message: '客户邮箱地址不存在'
          });
          continue;
        }

        const dueDate = new Date(invoice.dueDate);
        const isOverdue = dueDate < now;
        const daysDiff = Math.abs(Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)));

        const emailData = {
          to: invoice.Client.email,
          subject: `付款提醒 - 发票 ${invoice.invoiceNumber}`,
          template: 'payment-reminder',
          data: {
            clientName: invoice.Client.name || invoice.Client.company,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.total,
            currency: invoice.currency,
            dueDate: invoice.dueDate,
            isOverdue,
            daysDiff,
            customMessage: customMessage || (isOverdue ? 
              '您的发票已逾期，请尽快付款。' : 
              '友情提醒您的发票即将到期，请及时付款。')
          }
        };

        await emailService.sendEmail(emailData);
        
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          success: true,
          message: '付款提醒已发送'
        });
      } catch (error) {
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      message: `批量发送完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Batch send payment reminders error:', error);
    res.status(500).json({
      success: false,
      message: '批量发送付款提醒失败',
      error: error.message
    });
  }
});

// 标记通知为已读
router.put('/mark-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的通知ID列表'
      });
    }

    // 这里应该更新数据库中的通知状态
    // 由于当前通知是动态生成的，这里只返回成功响应
    // 在实际应用中，应该有一个专门的通知表来存储通知状态
    
    res.json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: '标记通知失败',
      error: error.message
    });
  }
});

// 获取邮件发送历史
router.get('/email-history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, invoiceId } = req.query;

    // 这里应该从邮件发送日志表中获取历史记录
    // 目前返回模拟数据，实际应用中需要实现邮件日志功能
    
    let whereClause = { userId };
    if (invoiceId) {
      whereClause.id = invoiceId;
    }

    const invoices = await Invoice.findAll({
      where: {
        ...whereClause,
        status: { [Op.in]: ['sent', 'paid'] },
        sentDate: { [Op.ne]: null }
      },
      include: [{
        model: Client,
        attributes: ['name', 'company', 'email']
      }],
      order: [['sentDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const emailHistory = invoices.map(invoice => ({
      id: `email-${invoice.id}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      recipientEmail: invoice.Client.email,
      recipientName: invoice.Client.name || invoice.Client.company,
      type: 'invoice',
      subject: `发票 ${invoice.invoiceNumber}`,
      sentAt: invoice.sentDate,
      status: 'sent'
    }));

    res.json({
      emailHistory,
      total: emailHistory.length
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取通知设置
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 返回默认通知设置（可以后续扩展为数据库存储）
    const notificationSettings = {
      emailNotifications: true,
      overdueReminders: true,
      paymentConfirmations: true,
      weeklyReports: false,
      marketingEmails: false
    };

    res.json({
      success: true,
      data: notificationSettings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// 更新通知设置
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    // 这里可以后续扩展为数据库存储
    // 目前只返回成功响应
    
    res.json({
      success: true,
      message: '通知设置已更新',
      data: settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

module.exports = router;