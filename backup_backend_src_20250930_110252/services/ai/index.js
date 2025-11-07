/**
 * AI服务模块索引
 * 导出所有AI服务相关模块
 */

// 基础服务类
const BaseAIService = require('./baseAIService');

// 具体服务实现
const OpenAIService = require('./openaiService');

// 服务工厂
const aiServiceFactory = require('./aiServiceFactory');

// 功能服务
const reminderEmailService = require('./reminderEmailService');
const OCRService = require('./ocrService');
const InvoiceQAService = require('./invoiceQAService');

module.exports = {
  // 基础服务类
  BaseAIService,
  
  // 具体服务实现
  OpenAIService,
  
  // 服务工厂
  aiServiceFactory,
  
  // 功能服务
  reminderEmailService,
  OCRService,
  InvoiceQAService
};