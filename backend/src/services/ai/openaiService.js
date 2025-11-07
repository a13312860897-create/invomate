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

      // 如果有系统消息，添加到消息列表开头
      if (options.systemMessage) {
        requestData.messages.unshift({
          role: 'system',
          content: options.systemMessage
        });
      }

      // 发送请求
      const response = await this.retry(async () => {
        return await axios.post(`${this.baseUrl}/chat/completions`, requestData, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(this.organization && { 'OpenAI-Organization': this.organization })
          },
          timeout: this.timeout
        });
      });

      const endTime = Date.now();
      const responseData = response.data;
      
      // 提取生成的文本
      const generatedText = responseData.choices[0]?.message?.content || '';
      
      // 恢复PII数据
      const finalText = this.restorePII(generatedText, piiMap);
      
      // 记录请求日志
      await this.logRequest({
        requestId,
        prompt: prompt.substring(0, 100) + '...',
        response: finalText.substring(0, 100) + '...',
        model: finalOptions.model,
        tokens: responseData.usage,
        duration: endTime - startTime,
        success: true
      });

      return {
        success: true,
        text: finalText,
        usage: responseData.usage,
        model: finalOptions.model,
        requestId,
        duration: endTime - startTime
      };

    } catch (error) {
      const endTime = Date.now();
      
      // 记录错误日志
      await this.logRequest({
        requestId,
        prompt: prompt.substring(0, 100) + '...',
        error: error.message,
        duration: endTime - startTime,
        success: false
      });

      return {
        success: false,
        error: error.message,
        requestId,
        duration: endTime - startTime
      };
    }
  }

  /**
   * 处理文档
   * @param {Buffer|string} document - 文档内容或路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processDocument(document, options = {}) {
    // 简化实现，将文档内容作为文本处理
    const documentText = typeof document === 'string' ? document : document.toString();
    const prompt = `请分析以下文档内容：\n\n${documentText}`;
    
    return await this.generateText(prompt, options);
  }

  /**
   * 分析数据
   * @param {Object} data - 要分析的数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 分析结果
   */
  async analyzeData(data, options = {}) {
    const dataText = JSON.stringify(data, null, 2);
    const prompt = `请分析以下数据：\n\n${dataText}`;
    
    return await this.generateText(prompt, options);
  }

  /**
   * 验证OpenAI配置
   * @returns {Object} - 验证结果
   */
  validateConfig() {
    const baseValidation = super.validateConfig();
    
    if (!this.apiKey) {
      baseValidation.errors.push('OpenAI API key is required');
    }
    
    if (!this.model) {
      baseValidation.errors.push('OpenAI model is required');
    }
    
    return {
      ...baseValidation,
      isValid: baseValidation.errors.length === 0
    };
  }

  /**
   * 测试连接
   * @returns {Promise<Object>} - 测试结果
   */
  async testConnection() {
    try {
      const result = await this.generateText('Hello, this is a test message.', {
        maxTokens: 10
      });
      
      return {
        success: result.success,
        message: result.success ? 'Connection successful' : result.error
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

module.exports = OpenAIService;