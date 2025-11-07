/**
 * 图表数据流监控工具
 * 用于监控和调试图表数据的完整流程
 */

class ChartMonitor {
  constructor() {
    this.logs = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * 记录API请求
   */
  logApiRequest(endpoint, params = {}) {
    if (!this.isEnabled) return;
    
    const log = {
      timestamp: new Date().toISOString(),
      type: 'API_REQUEST',
      endpoint,
      params,
      id: this.generateId()
    };
    
    this.logs.push(log);
    console.log('📡 [ChartMonitor] API请求:', log);
    return log.id;
  }

  /**
   * 记录API响应
   */
  logApiResponse(requestId, response, error = null) {
    if (!this.isEnabled) return;
    
    const log = {
      timestamp: new Date().toISOString(),
      type: 'API_RESPONSE',
      requestId,
      success: !error,
      dataSize: response ? JSON.stringify(response).length : 0,
      error: error ? error.message : null,
      response: response ? this.sanitizeResponse(response) : null
    };
    
    this.logs.push(log);
    
    if (error) {
      console.error('❌ [ChartMonitor] API响应错误:', log);
    } else {
      console.log('✅ [ChartMonitor] API响应成功:', log);
    }
  }

  /**
   * 记录数据转换
   */
  logDataTransformation(component, inputData, outputData, transformType) {
    if (!this.isEnabled) return;
    
    const log = {
      timestamp: new Date().toISOString(),
      type: 'DATA_TRANSFORM',
      component,
      transformType,
      inputSize: inputData ? JSON.stringify(inputData).length : 0,
      outputSize: outputData ? JSON.stringify(outputData).length : 0,
      inputSample: this.getSample(inputData),
      outputSample: this.getSample(outputData)
    };
    
    this.logs.push(log);
    console.log('🔄 [ChartMonitor] 数据转换:', log);
  }

  /**
   * 记录图表渲染
   */
  logChartRender(component, chartData, chartOptions) {
    if (!this.isEnabled) return;
    
    const log = {
      timestamp: new Date().toISOString(),
      type: 'CHART_RENDER',
      component,
      labelsCount: chartData?.labels?.length || 0,
      datasetsCount: chartData?.datasets?.length || 0,
      dataPointsCount: chartData?.datasets?.[0]?.data?.length || 0,
      hasOptions: !!chartOptions
    };
    
    this.logs.push(log);
    console.log('📊 [ChartMonitor] 图表渲染:', log);
  }

  /**
   * 记录错误
   */
  logError(component, error, context = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      component,
      error: error.message,
      stack: error.stack,
      context
    };
    
    this.logs.push(log);
    console.error('💥 [ChartMonitor] 错误:', log);
  }

  /**
   * 获取监控报告
   */
  getReport() {
    const report = {
      totalLogs: this.logs.length,
      errors: this.logs.filter(log => log.type === 'ERROR'),
      apiRequests: this.logs.filter(log => log.type === 'API_REQUEST'),
      apiResponses: this.logs.filter(log => log.type === 'API_RESPONSE'),
      dataTransforms: this.logs.filter(log => log.type === 'DATA_TRANSFORM'),
      chartRenders: this.logs.filter(log => log.type === 'CHART_RENDER'),
      timeline: this.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };
    
    return report;
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
    console.log('🧹 [ChartMonitor] 日志已清空');
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 清理响应数据（移除敏感信息）
   */
  sanitizeResponse(response) {
    if (!response) return null;
    
    // 只保留数据结构信息，不保存完整数据
    const sanitized = {
      success: response.success,
      message: response.message,
      dataKeys: response.data ? Object.keys(response.data) : [],
      dataType: typeof response.data
    };
    
    return sanitized;
  }

  /**
   * 获取数据样本
   */
  getSample(data) {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        firstItem: data[0],
        lastItem: data[data.length - 1]
      };
    }
    
    if (typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data),
        sampleValues: Object.keys(data).slice(0, 3).reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {})
      };
    }
    
    return { type: typeof data, value: data };
  }
}

// 创建全局实例
const chartMonitor = new ChartMonitor();

// 导出监控工具和便捷方法
export default chartMonitor;

export const logApiRequest = (endpoint, params) => chartMonitor.logApiRequest(endpoint, params);
export const logApiResponse = (requestId, response, error) => chartMonitor.logApiResponse(requestId, response, error);
export const logDataTransformation = (component, inputData, outputData, transformType) => 
  chartMonitor.logDataTransformation(component, inputData, outputData, transformType);
export const logChartRender = (component, chartData, chartOptions) => 
  chartMonitor.logChartRender(component, chartData, chartOptions);
export const logError = (component, error, context) => chartMonitor.logError(component, error, context);
export const getMonitorReport = () => chartMonitor.getReport();
export const clearMonitorLogs = () => chartMonitor.clear();