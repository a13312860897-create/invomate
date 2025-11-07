/**
 * 自动催款邮件服务
 * 使用AI生成个性化的催款邮件内容
 */
const aiServiceFactory = require('./aiServiceFactory');
const emailService = require('../emailService');

class ReminderEmailService {
  constructor(config = {}) {
    this.aiProvider = config.aiProvider || 'openai';
    this.aiConfig = config.aiConfig || {};
    this.aiService = aiServiceFactory.getService(this.aiProvider, this.aiConfig);
    
    // 邮件模板配置
    this.emailTemplates = config.emailTemplates || {
      friendly: {
        tone: '友好提醒',
        urgency: '低',
        systemMessage: '你是一个专业的财务助理，需要以友好、礼貌的语气发送催款邮件。邮件应该简洁明了，同时保持良好的客户关系。'
      },
      urgent: {
        tone: '紧急提醒',
        urgency: '高',
        systemMessage: '你是一个专业的财务助理，需要以紧急但仍然专业的语气发送催款邮件。邮件应该清晰表达付款的紧迫性，同时保持专业和尊重。'
      },
      final: {
        tone: '最后通知',
        urgency: '非常高',
        systemMessage: '你是一个专业的财务助理，需要发送最后的催款通知。邮件应该明确表达这是最后一次提醒，并可能提及法律行动或服务中断，但仍然保持专业。'
      }
    };
  }

  /**
   * 生成催款邮件内容
   * @param {Object} invoiceData - 发票数据
   * @param {Object} clientData - 客户数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 生成的邮件内容
   */
  async generateReminderEmail(invoiceData, clientData, options = {}) {
    const {
      template = 'friendly',
      language = 'zh-CN',
      includePaymentDetails = true,
      customInstructions = ''
    } = options;
    
    // 获取邮件模板配置
    const templateConfig = this.emailTemplates[template] || this.emailTemplates.friendly;
    
    // 构建提示词
    const prompt = this.buildPrompt(invoiceData, clientData, {
      language,
      includePaymentDetails,
      customInstructions
    });
    
    try {
      // 使用AI生成邮件内容
      const result = await this.aiService.generateText(prompt, {
        systemMessage: templateConfig.systemMessage,
        temperature: 0.7,
        maxTokens: 1000
      });
      
      if (!result.success) {
        throw new Error(`Failed to generate email content: ${result.error}`);
      }
      
      // 解析生成的邮件内容
      const emailContent = this.parseEmailContent(result.text);
      
      return {
        success: true,
        subject: emailContent.subject,
        body: emailContent.body,
        template,
        tone: templateConfig.tone,
        urgency: templateConfig.urgency,
        usage: result.usage,
        requestId: result.requestId
      };
    } catch (error) {
      console.error('Error generating reminder email:', error);
      
      // 返回错误结果
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送催款邮件
   * @param {Object} invoiceData - 发票数据
   * @param {Object} clientData - 客户数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 发送结果
   */
  async sendReminderEmail(invoiceData, clientData, options = {}) {
    try {
      // 生成邮件内容
      const emailResult = await this.generateReminderEmail(invoiceData, clientData, options);
      
      if (!emailResult.success) {
        throw new Error(`Failed to generate email content: ${emailResult.error}`);
      }
      
      // 准备邮件发送选项
      const emailOptions = {
        to: clientData.email,
        subject: emailResult.subject,
        html: emailResult.body,
        attachments: options.attachments || [],
        ...options.emailOptions
      };
      
      // 发送邮件
      const sendResult = await emailService.sendInvoiceEmail(
        invoiceData,
        clientData,
        emailOptions
      );
      
      return {
        success: true,
        emailId: sendResult.emailId,
        subject: emailResult.subject,
        template: emailResult.template,
        tone: emailResult.tone,
        urgency: emailResult.urgency,
        usage: emailResult.usage
      };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量发送催款邮件
   * @param {Array<Object>} invoiceClientPairs - 发票和客户数据对数组
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 批量发送结果
   */
  async sendBulkReminderEmails(invoiceClientPairs, options = {}) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const { invoice, client } of invoiceClientPairs) {
      try {
        // 发送单个催款邮件
        const result = await this.sendReminderEmail(invoice, client, options);
        
        results.push({
          invoiceId: invoice.id,
          clientId: client.id,
          ...result
        });
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // 添加延迟以避免触发速率限制
        if (options.delayBetweenEmails > 0) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenEmails));
        }
      } catch (error) {
        console.error(`Error sending reminder email for invoice ${invoice.id}:`, error);
        
        results.push({
          invoiceId: invoice.id,
          clientId: client.id,
          success: false,
          error: error.message
        });
        
        failureCount++;
      }
    }
    
    return {
      success: true,
      total: invoiceClientPairs.length,
      successCount,
      failureCount,
      results
    };
  }

  /**
   * 构建AI提示词
   * @param {Object} invoiceData - 发票数据
   * @param {Object} clientData - 客户数据
   * @param {Object} options - 选项
   * @returns {string} - 提示词
   */
  buildPrompt(invoiceData, clientData, options) {
    const {
      language = 'zh-CN',
      includePaymentDetails = true,
      customInstructions = ''
    } = options;
    
    // 构建基础提示词
    let prompt = `请为以下客户生成一封催款邮件：\n\n`;
    
    // 添加客户信息
    prompt += `客户信息：\n`;
    prompt += `- 客户名称：${clientData.name || clientData.companyName || '未提供'}\n`;
    prompt += `- 客户类型：${clientData.type || '企业客户'}\n`;
    
    // 添加发票信息
    prompt += `\n发票信息：\n`;
    prompt += `- 发票号码：${invoiceData.invoiceNumber || '未提供'}\n`;
    prompt += `- 发票日期：${invoiceData.date || '未提供'}\n`;
    prompt += `- 到期日期：${invoiceData.dueDate || '未提供'}\n`;
    prompt += `- 金额：${invoiceData.amount || invoiceData.total || '未提供'}\n`;
    prompt += `- 货币：${invoiceData.currency || 'CNY'}\n`;
    
    // 添加逾期信息
    if (invoiceData.overdueDays) {
      prompt += `- 逾期天数：${invoiceData.overdueDays}天\n`;
    }
    
    // 添加付款详情
    if (includePaymentDetails) {
      prompt += `\n付款详情：\n`;
      if (invoiceData.paymentMethods) {
        prompt += `- 付款方式：${invoiceData.paymentMethods.join(', ')}\n`;
      }
      if (invoiceData.paymentInstructions) {
        prompt += `- 付款说明：${invoiceData.paymentInstructions}\n`;
      }
    }
    
    // 添加自定义指令
    if (customInstructions) {
      prompt += `\n特殊要求：\n${customInstructions}\n`;
    }
    
    // 添加输出格式说明
    prompt += `\n请生成一封完整的催款邮件，包含以下部分：\n`;
    prompt += `1. 邮件主题（以"主题："开头）\n`;
    prompt += `2. 邮件正文（包含问候语、正文内容、结束语和签名）\n`;
    
    // 添加语言要求
    if (language === 'zh-CN') {
      prompt += `\n请使用中文编写邮件。\n`;
    } else if (language === 'en-US') {
      prompt += `\nPlease write the email in English.\n`;
    }
    
    return prompt;
  }

  /**
   * 解析AI生成的邮件内容
   * @param {string} generatedText - AI生成的文本
   * @returns {Object} - 解析后的邮件内容
   */
  parseEmailContent(generatedText) {
    // 初始化结果
    const result = {
      subject: '',
      body: ''
    };
    
    // 分割文本为行
    const lines = generatedText.split('\n');
    
    // 解析主题
    let subjectFound = false;
    let bodyStarted = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否是主题行
      if (!subjectFound && (trimmedLine.startsWith('主题：') || trimmedLine.toLowerCase().startsWith('subject:'))) {
        // 提取主题内容
        const subjectMatch = trimmedLine.match(/^(主题：|subject:)\s*(.+)$/i);
        if (subjectMatch && subjectMatch[2]) {
          result.subject = subjectMatch[2].trim();
          subjectFound = true;
        }
      } else if (subjectFound && !bodyStarted && trimmedLine !== '') {
        // 主题已找到，非空行表示正文开始
        bodyStarted = true;
        result.body = line;
      } else if (bodyStarted) {
        // 添加到正文
        result.body += '\n' + line;
      }
    }
    
    // 如果没有找到主题，尝试从第一行提取
    if (!subjectFound && lines.length > 0) {
      result.subject = lines[0].trim();
      result.body = lines.slice(1).join('\n');
    }
    
    // 如果没有正文，使用整个文本作为正文
    if (!result.body) {
      result.body = generatedText;
    }
    
    return result;
  }
}

// 创建单例实例
const reminderEmailService = new ReminderEmailService();

module.exports = reminderEmailService;