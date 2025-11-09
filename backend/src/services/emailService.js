/**
 * 简化的邮件发送服务 - 专门用于PDF发票发送
 * 采用最小化实现，直接复用现有PDF生成代码
 */

const nodemailer = require('nodemailer');
const InvoicePaymentService = require('./invoicePaymentService');

class EmailService {
    constructor() {
        this.transporter = null;
        this.customFrom = null;
        this.invoicePaymentService = new InvoicePaymentService();
        this.initializeTransporter();
    }

    /**
     * 初始化邮件传输器
     */
    initializeTransporter() {
        console.log('初始化邮件传输器...');
        console.log('SMTP配置:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER
        });
        
        // 使用环境变量配置SMTP
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // 使用环境变量的secure设置
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            debug: true, // 启用调试
            logger: true // 启用日志
        });
        
        console.log('邮件传输器初始化完成');
    }

    /**
     * 使用用户级邮件配置覆盖当前传输器
     * @param {Object} emailConfig 用户的SMTP配置
     * @returns {boolean} 是否成功设置
     */
    setTransporterFromConfig(emailConfig) {
        try {
            if (!emailConfig) return false;
            const { email, password, smtpHost, smtpPort = 587, smtpSecure = false } = emailConfig;
            if (!email || !password || !smtpHost) return false;
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort) || 587,
                secure: !!smtpSecure,
                auth: { user: email, pass: password },
                debug: true,
                logger: true
            });
            this.customFrom = email;
            return true;
        } catch (error) {
            console.error('根据用户配置设置传输器失败:', error);
            return false;
        }
    }

    /**
     * 发送测试邮件（用于设置页测试）
     * @param {string} recipientEmail 收件人邮箱
     */
    async sendTestEmail(recipientEmail, emailConfig = null) {
        try {
            if (!recipientEmail) {
                throw new Error('收件人邮箱是必需的');
            }
            // 如果提供用户配置，则优先使用用户配置
            if (emailConfig) {
                this.setTransporterFromConfig(emailConfig);
            }
            if (!this.transporter) {
                throw new Error('邮件传输器未初始化');
            }

            // 验证SMTP连接
            await this.transporter.verify();

            const fromAddress = this.customFrom || process.env.FROM_EMAIL || process.env.SMTP_USER;
            if (!fromAddress) {
                throw new Error('未配置发件人邮箱(FROM_EMAIL 或 SMTP_USER)');
            }

            const mailOptions = {
                from: fromAddress,
                to: recipientEmail,
                subject: '测试邮件 - 发票系统',
                text: '这是一封测试邮件，用于验证SMTP配置是否可用。',
                html: '<p>这是一封测试邮件，用于验证SMTP配置是否可用。</p>'
            };

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('发送测试邮件失败:', error);
            throw error;
        }
    }

    /**
     * 发送PDF发票邮件
     * @param {Object} options - 邮件发送选项
     * @param {string} options.to - 收件人邮箱
     * @param {string} options.subject - 邮件主题
     * @param {string} options.text - 邮件文本内容
     * @param {string} options.html - 邮件HTML内容
     * @param {Buffer} options.pdfBuffer - PDF文件缓冲区
     * @param {string} options.pdfFileName - PDF文件名
     * @param {Object} options.invoiceData - 发票数据（用于邮件内容）
     * @returns {Promise<Object>} 发送结果
     */
    async sendInvoicePDF(options) {
        try {
            console.log('🔥🔥🔥 sendInvoicePDF 被调用了！🔥🔥🔥');
            console.log('sendInvoicePDF options:', JSON.stringify(options, null, 2));
            console.log('=== EmailService.sendInvoicePDF 开始 ===');
            const {
                recipientEmail,
                subject = '您的发票',
                customText,
                customHtml,
                pdfBuffer,
                pdfFileName = 'invoice.pdf',
                invoiceData = {},
                emailConfig = null
            } = options;

            console.log('sendInvoicePDF 参数:', {
                recipientEmail,
                subject,
                hasPdfBuffer: !!pdfBuffer,
                pdfBufferLength: pdfBuffer ? pdfBuffer.length : 0,
                pdfFileName,
                hasInvoiceData: !!invoiceData
            });

            // 验证必需参数
            if (!recipientEmail) {
                console.error('收件人邮箱地址是必需的');
                throw new Error('收件人邮箱地址是必需的');
            }
            if (!pdfBuffer) {
                console.error('PDF文件缓冲区是必需的');
                throw new Error('PDF文件缓冲区是必需的');
            }

            // 如果提供用户配置，则优先使用用户配置
            if (emailConfig) {
                this.setTransporterFromConfig(emailConfig);
            }
            console.log('检查邮件传输器状态...');
            if (!this.transporter) {
                console.error('邮件传输器未初始化');
                throw new Error('邮件传输器未初始化');
            }

            // 验证传输器连接
            console.log('验证SMTP连接...');
            try {
                await this.transporter.verify();
                console.log('SMTP连接验证成功');
            } catch (verifyError) {
                console.error('SMTP连接验证失败:', verifyError.message);
                throw new Error(`SMTP连接失败: ${verifyError.message}`);
            }

            // 生成邮件内容
            console.log('生成邮件内容...');
            const emailContent = await this.generateEmailContent(invoiceData, customText, customHtml);
        
        console.log('=== 最终邮件内容调试 ===');
        console.log('邮件文本内容长度:', emailContent.text.length);
        console.log('邮件HTML内容长度:', emailContent.html.length);
        console.log('邮件文本内容预览:', emailContent.text.substring(0, 500));
        console.log('邮件HTML内容预览:', emailContent.html.substring(0, 800));
        console.log('=== 最终邮件内容调试结束 ===');

            // 邮件配置
            const mailOptions = {
                from: this.customFrom || process.env.FROM_EMAIL || process.env.SMTP_USER,
                to: recipientEmail,
                subject: subject,
                text: emailContent.text,
                html: emailContent.html,
                attachments: [
                    {
                        filename: pdfFileName,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            console.log('准备发送邮件:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasAttachment: !!pdfBuffer
            });

            // 发送邮件
            const result = await this.transporter.sendMail(mailOptions);
            
            console.log('邮件发送成功:', result.messageId);
            return {
                success: true,
                messageId: result.messageId,
                recipientEmail: recipientEmail,
                subject: subject
            };

        } catch (error) {
            console.error('邮件发送失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成邮件内容
     * @param {Object} invoiceData - 发票数据
     * @param {Object} clientData - 客户数据
     * @param {string} customText - 自定义文本内容
     * @param {string} customHtml - 自定义HTML内容
     * @returns {Object} 邮件内容
     */
    async generateEmailContent(invoiceData, clientData = null, customText = null, customHtml = null) {
        console.log('📧 [EmailService] 开始生成邮件内容');
        console.log('📧 [EmailService] 接收到的invoiceData:', JSON.stringify(invoiceData, null, 2));
        
        // 引入统一的金额处理工具
        const { extractTotalAmount, getDisplayAmount, normalizeInvoiceAmounts } = require('../utils/amountUtils');
        
        if (clientData) {
            console.log('📧 [EmailService] 接收到的clientData:', JSON.stringify(clientData, null, 2));
        }

        // 标准化发票数据
        const normalizedInvoiceData = normalizeInvoiceAmounts(invoiceData);
        console.log('📧 [EmailService] 标准化后的发票数据总金额:', normalizedInvoiceData.total);

        // 提取客户名称
        let clientName = '';
        if (clientData && clientData.name) {
            clientName = clientData.name;
        } else if (invoiceData.clientName) {
            clientName = invoiceData.clientName;
        } else if (invoiceData.Client && invoiceData.Client.name) {
            clientName = invoiceData.Client.name;
        } else if (invoiceData.client && invoiceData.client.name) {
            clientName = invoiceData.client.name;
        } else {
            clientName = 'Cher client';
        }

        // 提取发票号码
        let invoiceNumber = '';
        if (invoiceData.invoiceNumber) {
            invoiceNumber = invoiceData.invoiceNumber;
        } else if (invoiceData.number) {
            invoiceNumber = invoiceData.number;
        } else if (invoiceData.id) {
            invoiceNumber = `INV-${invoiceData.id}`;
        } else {
            invoiceNumber = 'N/A';
        }

        // 使用统一的总金额提取函数
        const totalAmount = extractTotalAmount(normalizedInvoiceData);
        console.log('📧 [EmailService] 提取的总金额:', totalAmount);

        // 提取到期日期
        const dueDate = invoiceData.dueDate || 
                       invoiceData.due_date || 
                       invoiceData.dueDateFormatted || 'N/A';

        // 使用统一的金额格式化函数
        const formattedAmount = getDisplayAmount(normalizedInvoiceData, invoiceData.currency || 'EUR');
        console.log('📧 [EmailService] 格式化金额:', formattedAmount);

        const finalFormattedAmount = formattedAmount;
        
        console.log('🎯 最终使用的格式化金额:', finalFormattedAmount);
        
        // 生成发票支付链接 - 使用 Paddle 平台交易并返回结账URL
        const invoiceId = invoiceData.id || invoiceData.invoice_id || invoiceData.invoiceId || 'preview';
        let paymentLink = null;
        let paymentLinkError = null;

        if (invoiceId && invoiceId !== 'preview') {
            try {
                const result = await this.invoicePaymentService.generateDirectPaymentLink(invoiceData, { expiryDays: 7 });
                if (result && result.success && result.paymentUrl) {
                    paymentLink = result.paymentUrl;
                    console.log(`✓ Paddle checkout URL generated for invoice ${invoiceId}: ${paymentLink}`);
                } else {
                    throw new Error('未能生成结账链接');
                }
            } catch (error) {
                console.error('Error generating Paddle payment link:', error);
                paymentLinkError = error.message;
            }
        } else {
            console.warn('Invoice ID not found or is preview, payment link will be unavailable');
        }
        
        console.log('邮件内容生成结果:', {
            invoiceNumber,
            clientName,
            totalAmount,
            formattedAmount,
            dueDate,
            invoiceId,
            paymentLink
        });

        // 默认文本内容
        const defaultText = `
亲爱的客户，

感谢您的业务！请查收附件中的发票。

发票详情：
- 发票号码: ${invoiceNumber}
- 客户名称: ${clientName}
- 总金额: ${formattedAmount}
- 到期日期: ${dueDate}

${paymentLink ? `您可以通过以下链接在线支付此发票：
${paymentLink}

` : ''}${paymentLinkError ? `注意：支付链接生成失败 (${paymentLinkError})，请联系我们获取支付方式。

` : ''}如有任何问题，请随时联系我们。

此致
敬礼！
        `.trim();

        // 默认HTML内容
        const defaultHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .invoice-details { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>发票通知</h2>
        </div>
        
        <p>亲爱的客户，</p>
        
        <p>感谢您的业务！请查收附件中的发票。</p>
        
        <div class="invoice-details">
            <h3>发票详情：</h3>
            <ul>
                <li><strong>发票号码:</strong> ${invoiceNumber}</li>
                <li><strong>客户名称:</strong> ${clientName}</li>
                <li><strong>总金额:</strong> ${finalFormattedAmount}</li>
                <li><strong>到期日期:</strong> ${dueDate}</li>
            </ul>
        </div>
        
        ${paymentLink ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" 
               style="display: inline-block; 
                      background-color: #007bff; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;">
                立即支付发票
            </a>
        </div>
        ` : ''}
        ${paymentLinkError ? `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;"><strong>注意：</strong>支付链接生成失败 (${paymentLinkError})，请联系我们获取支付方式。</p>
        </div>
        ` : ''}
        
        <p>如有任何问题，请随时联系我们。</p>
        
        <div class="footer">
            <p>此致<br>敬礼！</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        return {
            text: customText || defaultText,
            html: customHtml || defaultHtml
        };
    }

    /**
     * 验证邮件配置
     * @returns {Promise<boolean>} 配置是否有效
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP连接验证成功');
            return true;
        } catch (error) {
            console.error('SMTP连接验证失败:', error);
            return false;
        }
    }
}

module.exports = EmailService;