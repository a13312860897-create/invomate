/**
 * OpenAI服务实现类
 * 继承BaseAIService，实现OpenAI API的具体调用
 */
const BaseAIService = require('./baseAIService');
const axios = require('axios');

class OpenAIService extends BaseAIService {
  constructor(config = {}) {
    super({
      provider: 'openai',
      ...config
    });
    
    // OpenAI特定配置
    this.model = config.model || 'gpt-3.5-turbo';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.organization = config.organization || process.env.OPENAI_ORGANIZATION;
  }

  /**
   * 生成文本
   * @param {string} prompt - 提示词
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 生成结果
   */
  async generateText(prompt, options = {}) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // 合并选项
      const finalOptions = {
        model: options.model || this.model,
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        max_tokens: options.maxTokens !== undefined ? options.maxTokens : this.maxTokens,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...options
      };
      
      // 处理PII数据
      const { sanitizedText, piiMap } = this.sanitizePII(prompt);
      
      // 准备请求数据
      const requestData = {
        model: finalOptions.model,
        messages: [{
          role: 'user',
          content: sanitizedText
        }],
        temperature: finalOptions.temperature,
        max_tokens: finalOptions.max_tokens,
        top_p: finalOptions.top_p,
        frequency_penalty: finalOptions.frequency_penalty,
        presence_penalty: finalOptions.presence_penalty
      };
      
      // 如果提供了系统消息，添加到消息数组开头
      if (options.systemMessage) {
        requestData.messages.unshift({
          role: 'system',
          content: options.systemMessage
        });
      }
      
      // 准备请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      if (this.organization) {
        headers['OpenAI-Organization'] = this.organization;
      }
      
      // 发送请求
      const response = await this.withTimeout(
        this.withRetry(async () => {
          return await axios.post(`${this.baseUrl}/chat/completions`, requestData, { headers });
        })
      );
      
      // 处理响应
      const generatedText = response.data.choices[0]?.message?.content || '';
      const restoredText = this.restorePII(generatedText, piiMap);
      
      // 准备结果
      const result = {
        success: true,
        text: restoredText,
        usage: response.data.usage,
        model: response.data.model,
        requestId,
        processingTime: Date.now() - startTime
      };
      
      // 记录日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        prompt,
        response: restoredText,
        usage: response.data.usage,
        processingTime: result.processingTime,
        success: true
      });
      
      return result;
    } catch (error) {
      // 记录错误日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        prompt,
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
   * 处理文档（使用OpenAI的文档处理能力）
   * @param {Buffer|string} document - 文档内容或路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processDocument(document, options = {}) {
    // 这里可以实现文档处理逻辑
    // 例如使用OpenAI的文档理解API或其他文档处理服务
    
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // TODO: 实现文档处理逻辑
      // 目前返回占位符
      const result = {
        success: true,
        data: {},
        requestId,
        processingTime: Date.now() - startTime
      };
      
      // 记录日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        action: 'processDocument',
        processingTime: result.processingTime,
        success: true
      });
      
      return result;
    } catch (error) {
      // 记录错误日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        action: 'processDocument',
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
   * 分析数据
   * @param {Object} data - 要分析的数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 分析结果
   */
  async analyzeData(data, options = {}) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // 将数据转换为JSON字符串作为提示词
      const dataString = JSON.stringify(data, null, 2);
      const prompt = `请分析以下数据并提供见解：\n\n${dataString}`;
      
      // 使用generateText方法生成分析结果
      const analysisResult = await this.generateText(prompt, {
        systemMessage: '你是一个数据分析专家，请提供清晰、简洁的数据分析见解。',
        ...options
      });
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }
      
      const result = {
        success: true,
        analysis: analysisResult.text,
        usage: analysisResult.usage,
        requestId,
        processingTime: Date.now() - startTime
      };
      
      // 记录日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        action: 'analyzeData',
        processingTime: result.processingTime,
        success: true
      });
      
      return result;
    } catch (error) {
      // 记录错误日志
      await this.logRequest({
        requestId,
        provider: this.provider,
        model: this.model,
        action: 'analyzeData',
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
   * 生成唯一的请求ID
   * @returns {string} - 请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = OpenAIService;