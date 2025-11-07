/**
 * OCR服务
 * 使用OCR技术识别发票、收据等文档中的信息并自动填充到系统中
 */
const BaseAIService = require('./baseAIService');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class OCRService extends BaseAIService {
  constructor(config = {}) {
    super({
      provider: 'ocr',
      ...config
    });
    
    // OCR特定配置
    this.ocrProvider = config.ocrProvider || 'tesseract'; // 默认使用Tesseract OCR
    this.confidenceThreshold = config.confidenceThreshold || 0.7; // 置信度阈值
    this.supportedFormats = config.supportedFormats || ['pdf', 'jpg', 'jpeg', 'png'];
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.tempDir = config.tempDir || path.join(__dirname, '../../../temp');
    
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 处理文档并提取发票信息
   * @param {string} filePath - 文档文件路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processDocument(filePath, options = {}) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // 验证文件
      await this.validateFile(filePath);
      
      // 根据文件类型选择处理方法
      const fileExtension = path.extname(filePath).toLowerCase().substring(1);
      
      let extractedText;
      if (fileExtension === 'pdf') {
        extractedText = await this.extractTextFromPDF(filePath);
      } else {
        extractedText = await this.extractTextFromImage(filePath);
      }
      
      // 使用AI分析提取的文本
      const invoiceData = await this.analyzeInvoiceData(extractedText, options);
      
      // 清理临时文件
      this.cleanupTempFiles(filePath);
      
      // 准备结果
      const result = {
        success: true,
        data: invoiceData,
        extractedText,
        requestId,
        processingTime: Date.now() - startTime
      };
      
      // 记录日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        action: 'processDocument',
        filePath,
        processingTime: result.processingTime,
        success: true
      });
      
      return result;
    } catch (error) {
      // 清理临时文件
      this.cleanupTempFiles(filePath);
      
      // 记录错误日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        action: 'processDocument',
        filePath,
        error: error.message,
        processingTime: Date.now() - startTime,
        success: false
      });
      
      return {
        success: false,
        error: error.message,
        requestId,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 从PDF文件中提取文本
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} - 提取的文本
   */
  async extractTextFromPDF(filePath) {
    try {
      // 这里可以使用PDF解析库，如pdf-parse或pdfjs-dist
      // 为了简化示例，这里使用占位符实现
      // 实际实现应该使用适当的PDF解析库
      
      // 示例使用pdf-parse（需要安装）
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * 从图像文件中提取文本
   * @param {string} filePath - 图像文件路径
   * @returns {Promise<string>} - 提取的文本
   */
  async extractTextFromImage(filePath) {
    try {
      // 这里可以使用OCR库，如Tesseract.js
      // 为了简化示例，这里使用占位符实现
      // 实际实现应该使用适当的OCR库
      
      // 示例使用Tesseract.js（需要安装）
      const Tesseract = require('tesseract.js');
      
      const result = await Tesseract.recognize(
        filePath,
        'chi_sim+eng', // 支持中文和英文
        {
          logger: m => console.log(m) // 日志记录
        }
      );
      
      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * 使用AI分析提取的文本，识别发票数据
   * @param {string} text - 提取的文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 发票数据
   */
  async analyzeInvoiceData(text, options = {}) {
    try {
      // 获取AI服务实例
      const aiServiceFactory = require('./aiServiceFactory');
      const aiService = aiServiceFactory.getDefaultService();
      
      // 构建提示词
      const prompt = this.buildInvoiceAnalysisPrompt(text, options);
      
      // 使用AI分析文本
      const result = await aiService.generateText(prompt, {
        systemMessage: '你是一个专业的发票数据提取专家，能够从文本中准确识别和提取发票信息，并以JSON格式返回结果。',
        temperature: 0.3, // 降低温度以提高一致性
        maxTokens: 2000
      });
      
      if (!result.success) {
        throw new Error(`AI analysis failed: ${result.error}`);
      }
      
      // 解析AI返回的JSON数据
      const invoiceData = this.parseInvoiceData(result.text);
      
      return invoiceData;
    } catch (error) {
      console.error('Error analyzing invoice data:', error);
      throw new Error(`Failed to analyze invoice data: ${error.message}`);
    }
  }

  /**
   * 构建发票分析提示词
   * @param {string} text - 提取的文本
   * @param {Object} options - 选项
   * @returns {string} - 提示词
   */
  buildInvoiceAnalysisPrompt(text, options = {}) {
    const {
      language = 'zh-CN',
      expectedFields = [
        'invoiceNumber',
        'invoiceDate',
        'dueDate',
        'totalAmount',
        'taxAmount',
        'currency',
        'sellerName',
        'sellerAddress',
        'buyerName',
        'buyerAddress',
        'items',
        'paymentMethod',
        'notes'
      ]
    } = options;
    
    let prompt = `请从以下文本中提取发票信息，并以JSON格式返回结果。\n\n`;
    prompt += `文本内容：\n${text}\n\n`;
    
    prompt += `请提取以下字段：\n`;
    expectedFields.forEach(field => {
      prompt += `- ${field}\n`;
    });
    
    prompt += `\n对于items字段，请提取为对象数组，每个对象包含description、quantity、unitPrice和amount字段。\n`;
    
    prompt += `\n如果某个字段在文本中找不到，请使用null作为值。\n`;
    
    prompt += `\n请确保返回的是有效的JSON格式，不要包含任何其他文本或解释。\n`;
    
    if (language === 'zh-CN') {
      prompt += `\n请使用中文作为字段名称。\n`;
    }
    
    return prompt;
  }

  /**
   * 解析AI返回的发票数据
   * @param {string} text - AI返回的文本
   * @returns {Object} - 发票数据
   */
  parseInvoiceData(text) {
    try {
      // 尝试直接解析JSON
      const jsonData = JSON.parse(text);
      return jsonData;
    } catch (error) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Failed to parse extracted JSON:', innerError);
          throw new Error('Failed to parse invoice data from AI response');
        }
      } else {
        console.error('No JSON found in AI response');
        throw new Error('No valid invoice data found in AI response');
      }
    }
  }

  /**
   * 验证文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  async validateFile(filePath) {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }
    
    // 检查文件大小
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }
    
    // 检查文件格式
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);
    if (!this.supportedFormats.includes(fileExtension)) {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   */
  cleanupTempFiles(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * 生成唯一的请求ID
   * @returns {string} - 请求ID
   */
  generateRequestId() {
    return `ocr_${Date.now()}_${uuidv4()}`;
  }
}

// 创建单例实例
const ocrService = new OCRService();

module.exports = OCRService;