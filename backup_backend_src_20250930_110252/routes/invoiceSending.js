/**
 * 发票发送和报告路由
 * 处理发票邮件发送、DGFiP e-reporting和Peppol集成
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sendInvoiceEmail } = require('../services/emailService');
const FrenchEReportingService = require('../services/frenchEReportingService');
const Invoice = require('../models/invoice');
const Client = require('../models/client');
const User = require('../models/User');

const eReportingService = new FrenchEReportingService();

/**
 * 发送发票邮件
 * POST /api/invoices/:id/send-email
 */
router.post('/:id/send-email', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, customMessage, method } = req.body;
    const userId = req.user.id;

    // 验证发票存在
    const invoice = await Invoice.findOne({
      where: { id, userId },
      include: [{ model: Client, as: 'client' }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.client || !invoice.client.email) {
      return res.status(400).json({
        success: false,
        message: 'Client email not found'
      });
    }

    // 发送邮件
    const result = await sendInvoiceEmail(id, userId, {
      subject,
      customMessage,
      method,
      forceRegenerate: req.body.regeneratePDF || false
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Invoice email sent successfully',
        messageId: result.messageId,
        provider: result.provider,
        sentTo: invoice.client.email
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * 提交发票到DGFiP (法国税务局)
 * POST /api/invoices/:id/submit-dgfip
 */
router.post('/:id/submit-dgfip', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取发票和相关数据
    const invoice = await Invoice.findOne({
      where: { id, userId },
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'user' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // 检查用户是否配置了法国模式
    if (invoice.user.invoiceMode !== 'france') {
      return res.status(400).json({
        success: false,
        message: 'DGFiP submission is only available for French invoices'
      });
    }

    // 验证必要的法国税务信息
    if (!invoice.user.vatNumber || !invoice.user.siren) {
      return res.status(400).json({
        success: false,
        message: 'French VAT number and SIREN are required for DGFiP submission'
      });
    }

    // 构建发票数据
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency || 'EUR',
      subtotal: parseFloat(invoice.subtotal),
      totalTax: parseFloat(invoice.totalTax),
      total: parseFloat(invoice.total),
      notes: invoice.notes,
      supplier: {
        name: invoice.user.companyName || `${invoice.user.firstName} ${invoice.user.lastName}`,
        address: invoice.user.address,
        city: invoice.user.city,
        postalCode: invoice.user.postalCode,
        vatNumber: invoice.user.vatNumber,
        siren: invoice.user.siren
      },
      customer: {
        name: invoice.client.name,
        address: invoice.client.address,
        city: invoice.client.city,
        postalCode: invoice.client.postalCode,
        countryCode: invoice.client.countryCode || 'FR',
        vatNumber: invoice.client.vatNumber
      },
      items: JSON.parse(invoice.items || '[]')
    };

    // 提交到DGFiP
    const result = await eReportingService.submitToDGFiP(invoiceData);

    if (result.success) {
      // 更新发票状态
      await Invoice.update({
        dgfipSubmitted: true,
        dgfipSubmissionId: result.submissionId,
        dgfipSubmittedAt: new Date(),
        dgfipStatus: result.status,
        dgfipValidationCode: result.validationCode
      }, {
        where: { id }
      });

      res.json({
        success: true,
        message: 'Invoice submitted to DGFiP successfully',
        submissionId: result.submissionId,
        status: result.status,
        validationCode: result.validationCode,
        environment: result.environment
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to submit invoice to DGFiP',
        error: result.error,
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    console.error('DGFiP submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * 通过Peppol网络发送发票
 * POST /api/invoices/:id/send-peppol
 */
router.post('/:id/send-peppol', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientId } = req.body;
    const userId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient Peppol ID is required'
      });
    }

    // 获取发票和相关数据
    const invoice = await Invoice.findOne({
      where: { id, userId },
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'user' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // 验证用户Peppol配置
    if (!invoice.user.peppolId) {
      return res.status(400).json({
        success: false,
        message: 'Peppol ID is required for Peppol network transmission'
      });
    }

    // 构建发票数据
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency || 'EUR',
      subtotal: parseFloat(invoice.subtotal),
      totalTax: parseFloat(invoice.totalTax),
      total: parseFloat(invoice.total),
      notes: invoice.notes,
      supplier: {
        name: invoice.user.companyName || `${invoice.user.firstName} ${invoice.user.lastName}`,
        address: invoice.user.address,
        city: invoice.user.city,
        postalCode: invoice.user.postalCode,
        vatNumber: invoice.user.vatNumber,
        siren: invoice.user.siren,
        peppolId: invoice.user.peppolId
      },
      customer: {
        name: invoice.client.name,
        address: invoice.client.address,
        city: invoice.client.city,
        postalCode: invoice.client.postalCode,
        countryCode: invoice.client.countryCode || 'FR',
        vatNumber: invoice.client.vatNumber
      },
      items: JSON.parse(invoice.items || '[]')
    };

    // 通过Peppol发送
    const result = await eReportingService.sendViaPeppol(invoiceData, recipientId);

    if (result.success) {
      // 更新发票状态
      await Invoice.update({
        peppolSent: true,
        peppolMessageId: result.messageId,
        peppolSentAt: new Date(),
        peppolStatus: result.status
      }, {
        where: { id }
      });

      res.json({
        success: true,
        message: 'Invoice sent via Peppol network successfully',
        messageId: result.messageId,
        status: result.status,
        recipientId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice via Peppol',
        error: result.error,
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    console.error('Peppol sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * 查询DGFiP提交状态
 * GET /api/invoices/:id/dgfip-status
 */
router.get('/:id/dgfip-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id, userId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.dgfipSubmissionId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice has not been submitted to DGFiP'
      });
    }

    // 查询DGFiP状态
    const result = await eReportingService.checkDGFiPStatus(invoice.dgfipSubmissionId);

    if (result.success) {
      // 更新本地状态
      await Invoice.update({
        dgfipStatus: result.status,
        dgfipValidationResult: JSON.stringify(result.validationResult),
        dgfipProcessingTime: result.processingTime
      }, {
        where: { id }
      });

      res.json({
        success: true,
        submissionId: result.submissionId,
        status: result.status,
        validationResult: result.validationResult,
        processingTime: result.processingTime,
        lastChecked: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check DGFiP status',
        error: result.error
      });
    }
  } catch (error) {
    console.error('DGFiP status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * 验证法国VAT号码
 * POST /api/validate-french-vat
 */
router.post('/validate-french-vat', authenticateToken, async (req, res) => {
  try {
    const { vatNumber } = req.body;

    if (!vatNumber) {
      return res.status(400).json({
        success: false,
        message: 'VAT number is required'
      });
    }

    const result = await eReportingService.validateFrenchVAT(vatNumber);

    res.json({
      success: true,
      valid: result.valid,
      name: result.name,
      address: result.address,
      requestDate: result.requestDate,
      error: result.error
    });
  } catch (error) {
    console.error('VAT validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * 获取发票发送历史
 * GET /api/invoices/:id/sending-history
 */
router.get('/:id/sending-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id, userId },
      include: [{ model: Client, as: 'client' }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const history = {
      email: {
        sent: invoice.emailSent || false,
        sentAt: invoice.emailSentAt,
        messageId: invoice.emailMessageId,
        provider: invoice.emailProvider,
        recipient: invoice.client?.email
      },
      dgfip: {
        submitted: invoice.dgfipSubmitted || false,
        submittedAt: invoice.dgfipSubmittedAt,
        submissionId: invoice.dgfipSubmissionId,
        status: invoice.dgfipStatus,
        validationCode: invoice.dgfipValidationCode,
        validationResult: invoice.dgfipValidationResult ? JSON.parse(invoice.dgfipValidationResult) : null,
        processingTime: invoice.dgfipProcessingTime
      },
      peppol: {
        sent: invoice.peppolSent || false,
        sentAt: invoice.peppolSentAt,
        messageId: invoice.peppolMessageId,
        status: invoice.peppolStatus
      }
    };

    res.json({
      success: true,
      invoiceId: id,
      invoiceNumber: invoice.invoiceNumber,
      history
    });
  } catch (error) {
    console.error('Get sending history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;