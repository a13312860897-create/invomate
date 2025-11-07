/**
 * OCR功能控制器
 * 处理OCR相关的API请求
 */
const OCRService = require('../services/ai/ocrService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class OCRController {
  constructor() {
    this.ocrService = new OCRService();
    
    // 配置multer用于文件上传
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `ocr-${uniqueSuffix}${fileExtension}`);
      }
    });
    
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only JPEG, PNG and PDF files are allowed'), false);
        }
      }
    });
  }

  /**
   * 处理文档并提取发票信息
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async processDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }
      
      const { options = {} } = req.body;
      
      // 处理文档
      const result = await this.ocrService.processDocument(req.file.path, options);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: '文档处理失败',
          error: result.error
        });
      }
      
      // 返回成功响应
      return res.json({
        success: true,
        data: {
          invoiceData: result.data,
          extractedText: result.extractedText,
          requestId: result.requestId,
          processingTime: result.processingTime
        }
      });
    } catch (error) {
      console.error('Error in processDocument:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 获取OCR服务状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getOCRStatus(req, res) {
    try {
      // 返回OCR服务状态
      return res.json({
        success: true,
        data: {
          enabled: true,
          supportedFormats: this.ocrService.supportedFormats,
          maxFileSize: this.ocrService.maxFileSize,
          ocrProvider: this.ocrService.ocrProvider,
          features: [
            {
              name: '发票信息提取',
              description: '从发票、收据等文档中自动提取关键信息',
              enabled: true
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error in getOCRStatus:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 验证提取的发票数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async validateInvoiceData(req, res) {
    try {
      const { invoiceData } = req.body;
      
      if (!invoiceData) {
        return res.status(400).json({
          success: false,
          message: '发票数据是必需的'
        });
      }
      
      // 验证发票数据
      const validation = this.validateInvoiceData(invoiceData);
      
      // 返回验证结果
      return res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: validation.suggestions
        }
      });
    } catch (error) {
      console.error('Error in validateInvoiceData:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 验证发票数据
   * @param {Object} invoiceData - 发票数据
   * @returns {Object} - 验证结果
   */
  validateInvoiceData(invoiceData) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    // 验证必填字段
    const requiredFields = ['invoiceNumber', 'invoiceDate', 'totalAmount'];
    
    for (const field of requiredFields) {
      if (!invoiceData[field]) {
        errors.push(`缺少必填字段: ${field}`);
      }
    }
    
    // 验证发票号码格式
    if (invoiceData.invoiceNumber && typeof invoiceData.invoiceNumber !== 'string') {
      errors.push('发票号码必须是字符串');
    }
    
    // 验证发票日期格式
    if (invoiceData.invoiceDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(invoiceData.invoiceDate)) {
        errors.push('发票日期格式不正确，应为YYYY-MM-DD');
      }
    }
    
    // 验证金额格式
    if (invoiceData.totalAmount) {
      const amount = parseFloat(invoiceData.totalAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('总金额必须是大于0的数字');
      }
    }
    
    // 验证货币
    if (invoiceData.currency && typeof invoiceData.currency !== 'string') {
      errors.push('货币必须是字符串');
    } else if (!invoiceData.currency) {
      warnings.push('未指定货币，默认使用CNY');
      suggestions.push('建议明确指定货币类型');
    }
    
    // 验证发票项目
    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      for (let i = 0; i < invoiceData.items.length; i++) {
        const item = invoiceData.items[i];
        
        if (!item.description) {
          errors.push(`第${i + 1}个项目缺少描述`);
        }
        
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          errors.push(`第${i + 1}个项目的数量必须是大于0的数字`);
        }
        
        if (!item.unitPrice || parseFloat(item.unitPrice) < 0) {
          errors.push(`第${i + 1}个项目的单价必须是非负数`);
        }
        
        if (!item.amount || parseFloat(item.amount) < 0) {
          errors.push(`第${i + 1}个项目的金额必须是非负数`);
        }
      }
    } else if (!invoiceData.items) {
      warnings.push('未提供发票项目');
      suggestions.push('建议添加发票项目以完善发票信息');
    }
    
    // 返回验证结果
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

// 创建控制器实例
const ocrController = new OCRController();

module.exports = ocrController;