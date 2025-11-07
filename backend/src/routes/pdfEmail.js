/**
 * PDF邮件发送路由
 * 提供简单的API接口用于PDF发票邮件发送
 */

const express = require('express');
const router = express.Router();
const PDFEmailService = require('../services/pdfEmailService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const pdfEmailService = new PDFEmailService();

/**
 * 发送预览发票PDF邮件
 * POST /api/pdf-email/send/preview
 */
router.post('/send/preview', async (req, res) => {
    try {
        console.log('=== 邮件发送请求开始 ===');
        console.log('收到预览发票邮件发送请求:', JSON.stringify(req.body, null, 2));
        
        const { formData, client, user, recipientEmail, subject, message } = req.body;
        const userId = req.user?.id;

        console.log('请求参数验证:', {
            hasFormData: !!formData,
            hasClient: !!client,
            hasUser: !!user,
            recipientEmail,
            userId
        });

        // 验证必需参数
        if (!recipientEmail) {
            console.error('缺少收件人邮箱地址');
            return res.status(400).json({
                success: false,
                message: '收件人邮箱地址是必需的'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            console.error('邮箱格式无效:', recipientEmail);
            return res.status(400).json({
                success: false,
                message: '收件人邮箱格式无效'
            });
        }

        console.log(`处理预览发票的邮件发送请求，收件人: ${recipientEmail}`);

        // 使用传入的发票数据生成并发送邮件
        console.log('调用pdfEmailService.generateAndSendInvoice...');
        const result = await pdfEmailService.generateAndSendInvoice({
            invoiceData: formData,
            userData: user,
            clientData: client,
            recipientEmail,
            subject: subject || `发票 Preview`,
            customText: message,
            userId
        });

        console.log('pdfEmailService返回结果:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('邮件发送成功');
            res.json({
                success: true,
                message: '邮件发送成功',
                data: result
            });
        } else {
            console.error('邮件发送失败:', result.error);
            res.status(500).json({
                success: false,
                message: result.error || '邮件发送失败'
            });
        }

    } catch (error) {
        console.error('=== 邮件发送异常 ===');
        console.error('错误信息:', error.message);
        console.error('错误堆栈:', error.stack);
        console.error('=== 邮件发送异常结束 ===');
        res.status(500).json({
            success: false,
            message: error.message || '服务器内部错误'
        });
    }
});

/**
 * 发送单个发票PDF邮件
 * POST /api/pdf-email/send/:invoiceId
 */
router.post('/send/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { recipientEmail, subject, customText, customHtml } = req.body;
        const userId = req.user?.id;

        // 验证必需参数
        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                error: '收件人邮箱地址是必需的'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                success: false,
                error: '邮箱地址格式无效'
            });
        }

        console.log(`处理发票 ${invoiceId} 的邮件发送请求...`);

        // 获取发票数据
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(invoiceId) },
            include: {
                user: true,
                client: true
            }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: '发票不存在'
            });
        }

        // 权限检查（如果有用户认证）
        if (userId && invoice.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: '无权访问此发票'
            });
        }

        // 准备数据
        const invoiceData = {
            ...invoice,
            invoiceNumber: invoice.invoiceNumber || `INV-${invoiceId}`,
            totalAmount: invoice.totalAmount || '0.00'
        };

        const userData = invoice.user || {};
        const clientData = invoice.client || {};

        // 发送PDF邮件
        const result = await pdfEmailService.generateAndSendInvoice({
            invoiceId,
            invoiceData,
            userData,
            clientData,
            recipientEmail,
            subject,
            customText,
            customHtml
        });

        if (result.success) {
            // 记录发送历史（可选）
            try {
                await prisma.emailLog.create({
                    data: {
                        invoiceId: parseInt(invoiceId),
                        recipientEmail,
                        subject: subject || `发票 ${invoiceData.invoiceNumber}`,
                        status: 'sent',
                        messageId: result.messageId,
                        sentAt: new Date()
                    }
                });
            } catch (logError) {
                console.warn('邮件日志记录失败:', logError);
                // 不影响主要功能
            }

            res.json({
                success: true,
                message: '发票邮件发送成功',
                data: {
                    invoiceId,
                    recipientEmail,
                    messageId: result.messageId,
                    pdfSize: result.pdfSize
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || '邮件发送失败'
            });
        }

    } catch (error) {
        console.error('PDF邮件发送路由错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 批量发送发票PDF邮件
 * POST /api/pdf-email/batch-send
 */
router.post('/batch-send', async (req, res) => {
    try {
        const { invoices } = req.body;
        const userId = req.user?.id;

        if (!Array.isArray(invoices) || invoices.length === 0) {
            return res.status(400).json({
                success: false,
                error: '发票列表不能为空'
            });
        }

        // 限制批量数量
        if (invoices.length > 50) {
            return res.status(400).json({
                success: false,
                error: '批量发送数量不能超过50个'
            });
        }

        console.log(`处理 ${invoices.length} 个发票的批量邮件发送...`);

        // 验证和准备数据
        const processedInvoices = [];
        
        for (const item of invoices) {
            const { invoiceId, recipientEmail, subject, customText, customHtml } = item;

            if (!invoiceId || !recipientEmail) {
                continue; // 跳过无效项
            }

            // 获取发票数据
            const invoice = await prisma.invoice.findUnique({
                where: { id: parseInt(invoiceId) },
                include: {
                    user: true,
                    client: true
                }
            });

            if (!invoice) continue;

            // 权限检查
            if (userId && invoice.userId !== userId) continue;

            processedInvoices.push({
                invoiceId,
                invoiceData: {
                    ...invoice,
                    invoiceNumber: invoice.invoiceNumber || `INV-${invoiceId}`,
                    totalAmount: invoice.totalAmount || '0.00'
                },
                userData: invoice.user || {},
                clientData: invoice.client || {},
                recipientEmail,
                subject,
                customText,
                customHtml
            });
        }

        if (processedInvoices.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有有效的发票可以处理'
            });
        }

        // 批量处理
        const results = await pdfEmailService.batchProcessInvoices(processedInvoices);

        res.json({
            success: true,
            message: '批量邮件发送完成',
            data: {
                total: results.total,
                successful: results.success.length,
                failed: results.failed.length,
                results: results
            }
        });

    } catch (error) {
        console.error('批量PDF邮件发送错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 验证邮件服务状态
 * GET /api/pdf-email/status
 */
router.get('/status', async (req, res) => {
    try {
        const status = await pdfEmailService.verifyService();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('服务状态检查错误:', error);
        res.status(500).json({
            success: false,
            error: '服务状态检查失败'
        });
    }
});

/**
 * 获取邮件发送历史
 * GET /api/pdf-email/history/:invoiceId
 */
router.get('/history/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.id;

        // 权限检查
        if (userId) {
            const invoice = await prisma.invoice.findUnique({
                where: { id: parseInt(invoiceId) }
            });

            if (!invoice || invoice.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: '无权访问此发票'
                });
            }
        }

        const history = await prisma.emailLog.findMany({
            where: { invoiceId: parseInt(invoiceId) },
            orderBy: { sentAt: 'desc' }
        });

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('获取邮件历史错误:', error);
        res.status(500).json({
            success: false,
            error: '获取邮件历史失败'
        });
    }
});

module.exports = router;