/**
 * PDF邮件集成服务
 * 将现有的PDF生成功能与邮件发送功能结合
 */

const { generateInvoicePDFNew } = require('./pdfServiceNew');
const EmailService = require('./emailService');
const { EmailConfig } = require('../models');

class PDFEmailService {
    constructor() {
        this.emailService = new EmailService();
    }

    /**
     * 生成PDF并发送邮件 - 核心功能
     * @param {Object} options - 选项参数
     * @param {string} options.invoiceId - 发票ID
     * @param {Object} options.invoiceData - 发票数据
     * @param {Object} options.userData - 用户数据
     * @param {Object} options.clientData - 客户数据
     * @param {string} options.recipientEmail - 收件人邮箱
     * @param {string} options.subject - 邮件主题（可选）
     * @param {string} options.customText - 自定义邮件文本（可选）
     * @param {string} options.customHtml - 自定义邮件HTML（可选）
     * @returns {Promise<Object>} 处理结果
     */
    async generateAndSendInvoice(options) {
        try {
            console.log('=== PDFEmailService.generateAndSendInvoice 开始 ===');
            const {
                invoiceId,
                invoiceData,
                userData,
                clientData,
                recipientEmail,
                subject,
                customText,
                customHtml,
                userId
            } = options;

            console.log('generateAndSendInvoice 参数:', {
                hasInvoiceId: !!invoiceId,
                hasInvoiceData: !!invoiceData,
                hasUserData: !!userData,
                hasClientData: !!clientData,
                recipientEmail,
                subject,
                userId
            });

            console.log(`开始处理发票的PDF生成和邮件发送...`);

            // 引入统一的金额处理工具
            const { normalizeInvoiceAmounts } = require('../utils/amountUtils');

            // 如果没有提供invoiceData，尝试从数据库获取
            let finalInvoiceData = invoiceData;
            let finalUserData = userData;
            let finalClientData = clientData;

            if (invoiceId && !invoiceData) {
                console.log('从数据库获取发票数据...');
                // 从数据库获取发票数据
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                
                const invoice = await prisma.invoice.findUnique({
                    where: { id: parseInt(invoiceId) },
                    include: {
                        user: true,
                        client: true
                    }
                });

                if (!invoice) {
                    throw new Error(`发票 ${invoiceId} 不存在`);
                }

                finalInvoiceData = invoice;
                finalUserData = invoice.user;
                finalClientData = invoice.client;
            } else if (invoiceData && clientData) {
                // 对于预览邮件，合并客户数据到发票数据中
                console.log('=== 总金额调试 - pdfEmailService ===');
                console.log('原始invoiceData总金额字段:', {
                    totalAmount: invoiceData.totalAmount,
                    total: invoiceData.total,
                    amount: invoiceData.amount,
                    subtotal: invoiceData.subtotal,
                    taxAmount: invoiceData.taxAmount
                });
                
                // 标准化发票数据
                const normalizedInvoiceData = normalizeInvoiceAmounts(invoiceData);
                
                finalInvoiceData = {
                    ...normalizedInvoiceData,
                    // 修复字段映射：确保items字段映射为InvoiceItems
                    InvoiceItems: normalizedInvoiceData.InvoiceItems || normalizedInvoiceData.items || [],
                    client: clientData,
                    clientName: clientData.name,
                    customerName: clientData.name,
                    user: userData
                };
                
                console.log('标准化并合并后finalInvoiceData总金额字段:', {
                    totalAmount: finalInvoiceData.totalAmount,
                    total: finalInvoiceData.total,
                    amount: finalInvoiceData.amount,
                    subtotal: finalInvoiceData.subtotal,
                    taxAmount: finalInvoiceData.taxAmount
                });
            }

            // 第一步：生成PDF
            console.log('正在生成PDF...');
            const pdfResult = await this.generatePDF({
                invoiceData: finalInvoiceData,
                userData: finalUserData,
                clientData: finalClientData
            });

            if (!pdfResult.success) {
                throw new Error(`PDF生成失败: ${pdfResult.error}`);
            }

            // 第二步：发送邮件
            console.log('正在发送邮件...');
            // 如果提供了用户ID，尝试加载用户的邮件配置
            let resolvedEmailConfig = null;
            if (userId) {
                try {
                    const config = await EmailConfig.findOne({ where: { userId } });
                    if (config && config.isActive) {
                        resolvedEmailConfig = {
                            email: config.email,
                            password: config.password,
                            smtpHost: config.smtpHost,
                            smtpPort: config.smtpPort,
                            smtpSecure: !!config.smtpSecure
                        };
                        console.log('已加载用户级邮件配置用于发送');
                    } else {
                        console.log('未找到有效的用户级邮件配置，使用环境变量SMTP');
                    }
                } catch (e) {
                    console.warn('加载用户邮件配置失败，使用环境变量SMTP:', e.message);
                }
            }
            const emailResult = await this.sendEmail({
                recipientEmail,
                subject: subject || `发票 ${finalInvoiceData.invoiceNumber || invoiceId || 'Preview'}`,
                customText,
                customHtml,
                pdfBuffer: pdfResult.pdfBuffer,
                pdfFileName: `invoice_${invoiceId || 'preview'}.pdf`,
                invoiceData: finalInvoiceData,
                emailConfig: resolvedEmailConfig
            });

            if (!emailResult.success) {
                throw new Error(`邮件发送失败: ${emailResult.error}`);
            }

            console.log(`发票处理完成！`);

            return {
                success: true,
                invoiceId: invoiceId || 'preview',
                pdfGenerated: true,
                emailSent: true,
                messageId: emailResult.messageId,
                recipientEmail,
                pdfSize: pdfResult.pdfBuffer.length
            };

        } catch (error) {
            console.error('PDF邮件发送处理失败:', error);
            return {
                success: false,
                error: error.message,
                invoiceId: options.invoiceId
            };
        }
    }

    /**
     * 生成PDF（复用现有代码）
     * @param {Object} options - PDF生成选项
     * @returns {Promise<Object>} PDF生成结果
     */
    async generatePDF(options) {
        try {
            const { invoiceData, userData, clientData } = options;

            console.log('开始生成PDF，参数:', {
                invoiceData: invoiceData ? 'present' : 'missing',
                userData: userData ? 'present' : 'missing',
                clientData: clientData ? 'present' : 'missing'
            });

            // 直接调用现有的PDF生成函数
            const result = await generateInvoicePDFNew(
                invoiceData,
                userData,
                clientData
            );

            console.log('PDF生成结果:', result);

            // 检查结果格式
            if (result && result.success && result.buffer) {
                return {
                    success: true,
                    pdfBuffer: result.buffer
                };
            } else if (Buffer.isBuffer(result)) {
                // 如果直接返回Buffer
                return {
                    success: true,
                    pdfBuffer: result
                };
            } else {
                throw new Error(result?.error || 'PDF生成返回格式错误');
            }

        } catch (error) {
            console.error('PDF生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送邮件
     * @param {Object} options - 邮件发送选项
     * @returns {Promise<Object>} 邮件发送结果
     */
    async sendEmail(options) {
        try {
            const result = await this.emailService.sendInvoicePDF(options);
            return result;
        } catch (error) {
            console.error('邮件发送失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 批量处理多个发票
     * @param {Array} invoices - 发票列表
     * @returns {Promise<Object>} 批量处理结果
     */
    async batchProcessInvoices(invoices) {
        const results = {
            success: [],
            failed: [],
            total: invoices.length
        };

        console.log(`开始批量处理 ${invoices.length} 个发票...`);

        for (const invoice of invoices) {
            try {
                const result = await this.generateAndSendInvoice(invoice);
                
                if (result.success) {
                    results.success.push(result);
                } else {
                    results.failed.push(result);
                }

                // 添加延迟避免邮件服务器限制
                await this.delay(1000);

            } catch (error) {
                results.failed.push({
                    success: false,
                    error: error.message,
                    invoiceId: invoice.invoiceId
                });
            }
        }

        console.log(`批量处理完成: 成功 ${results.success.length}, 失败 ${results.failed.length}`);
        return results;
    }

    /**
     * 验证服务状态
     * @returns {Promise<Object>} 服务状态
     */
    async verifyService() {
        try {
            // 验证邮件服务连接
            const emailValid = await this.emailService.verifyConnection();
            
            return {
                emailService: emailValid,
                pdfService: true, // PDF服务基于现有代码，假设可用
                overall: emailValid
            };
        } catch (error) {
            return {
                emailService: false,
                pdfService: true,
                overall: false,
                error: error.message
            };
        }
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = PDFEmailService;