/**
 * 数据一致性测试框架 - API测试器
 * 负责测试API端点响应和数据一致性
 */

const axios = require('axios');
const DataValidator = require('./DataValidator');

class APITester {
  constructor(config = {}) {
    this.config = {
      baseURL: 'http://localhost:3002/api',
      timeout: 10000,
      retries: 3,
      ...config
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.validator = new DataValidator();
    this.requestLog = [];
  }

  /**
   * 测试单个API端点
   */
  async testEndpoint(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      expectedStatus = 200,
      schema = null,
      timeout = this.config.timeout
    } = options;

    const testResult = {
      endpoint,
      method,
      success: false,
      response: null,
      error: null,
      duration: 0,
      validationResults: {}
    };

    const startTime = Date.now();

    try {
      const response = await this.axios({
        method,
        url: endpoint,
        data,
        headers,
        timeout
      });

      testResult.response = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };

      if (response.status !== expectedStatus) {
        throw new Error(`期望状态码 ${expectedStatus}, 实际 ${response.status}`);
      }

      if (schema) {
        const validationResult = this.validator.validateDataStructure(response.data, schema);
        testResult.validationResults.structure = validationResult;
        
        if (!validationResult.valid) {
          throw new Error(`数据结构验证失败: ${validationResult.errors.join(', ')}`);
        }
      }

      testResult.success = true;

    } catch (error) {
      testResult.error = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };
    }

    testResult.duration = Date.now() - startTime;
    return testResult;
  }

  /**
   * 测试多个API端点的数据一致性
   */
  async testAPIConsistency(endpoints, consistencyRules) {
    const result = {
      success: true,
      endpointResults: {},
      consistencyResults: [],
      errors: []
    };

    const endpointPromises = endpoints.map(async (endpointConfig) => {
      const { name, ...options } = endpointConfig;
      try {
        const testResult = await this.testEndpoint(endpointConfig.endpoint, options);
        return { name, testResult };
      } catch (error) {
        return { name, error: error.message };
      }
    });

    const endpointResults = await Promise.all(endpointPromises);

    endpointResults.forEach(({ name, testResult, error }) => {
      if (error) {
        result.success = false;
        result.errors.push(`端点 ${name} 测试失败: ${error}`);
      } else {
        result.endpointResults[name] = testResult;
      }
    });

    if (!result.success) {
      return result;
    }

    for (const rule of consistencyRules) {
      try {
        const consistencyResult = await this._checkConsistencyRule(rule, result.endpointResults);
        result.consistencyResults.push(consistencyResult);
        
        if (!consistencyResult.consistent) {
          result.success = false;
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`一致性检查失败: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 批量测试API端点
   */
  async batchTestEndpoints(endpoints) {
    const results = {
      total: endpoints.length,
      passed: 0,
      failed: 0,
      results: [],
      summary: {
        averageResponseTime: 0,
        totalResponseTime: 0,
        fastestEndpoint: null,
        slowestEndpoint: null
      }
    };

    const promises = endpoints.map(async (endpointConfig, index) => {
      const { name, ...options } = endpointConfig;
      const testResult = await this.testEndpoint(endpointConfig.endpoint, options);
      
      return {
        index,
        name: name || `Endpoint ${index + 1}`,
        ...testResult
      };
    });

    const testResults = await Promise.all(promises);

    let totalResponseTime = 0;
    let fastestTime = Infinity;
    let slowestTime = 0;
    let fastestEndpoint = null;
    let slowestEndpoint = null;

    testResults.forEach(result => {
      results.results.push(result);
      
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }

      totalResponseTime += result.duration;

      if (result.duration < fastestTime) {
        fastestTime = result.duration;
        fastestEndpoint = result.name;
      }

      if (result.duration > slowestTime) {
        slowestTime = result.duration;
        slowestEndpoint = result.name;
      }
    });

    results.summary.totalResponseTime = totalResponseTime;
    results.summary.averageResponseTime = Math.round(totalResponseTime / endpoints.length);
    results.summary.fastestEndpoint = { name: fastestEndpoint, time: fastestTime };
    results.summary.slowestEndpoint = { name: slowestEndpoint, time: slowestTime };

    return results;
  }

  /**
   * 测试API性能
   */
  async testPerformance(endpoint, options = {}) {
    const {
      iterations = 10,
      concurrency = 1,
      ...requestOptions
    } = options;

    const results = {
      endpoint,
      iterations,
      concurrency,
      results: [],
      statistics: {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        successRate: 0
      }
    };

    const batches = Math.ceil(iterations / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const promises = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(this.testEndpoint(endpoint, requestOptions));
      }

      const batchResults = await Promise.all(promises);
      results.results.push(...batchResults);
    }

    const durations = results.results.map(r => r.duration).sort((a, b) => a - b);
    const successCount = results.results.filter(r => r.success).length;

    results.statistics.min = durations[0];
    results.statistics.max = durations[durations.length - 1];
    results.statistics.average = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
    results.statistics.median = durations[Math.floor(durations.length / 2)];
    results.statistics.p95 = durations[Math.floor(durations.length * 0.95)];
    results.statistics.p99 = durations[Math.floor(durations.length * 0.99)];
    results.statistics.successRate = Math.round((successCount / iterations) * 100);

    return results;
  }

  // 私有方法
  async _checkConsistencyRule(rule, endpointResults) {
    const { name, source1, source2, fields, options = {} } = rule;
    
    const result = {
      ruleName: name,
      consistent: false,
      source1,
      source2,
      fields,
      inconsistencies: []
    };

    const data1 = this._extractDataFromResult(endpointResults[source1], rule.source1Path);
    const data2 = this._extractDataFromResult(endpointResults[source2], rule.source2Path);

    if (!data1 || !data2) {
      throw new Error(`无法从端点结果中提取数据: ${source1} 或 ${source2}`);
    }

    const consistencyResult = this.validator.validateDataConsistency(data1, data2, fields, options);
    
    result.consistent = consistencyResult.consistent;
    result.inconsistencies = consistencyResult.inconsistencies;

    return result;
  }

  _extractDataFromResult(endpointResult, dataPath) {
    if (!endpointResult || !endpointResult.success) {
      return null;
    }

    let data = endpointResult.response.data;
    
    if (dataPath) {
      const paths = dataPath.split('.');
      for (const path of paths) {
        if (data && typeof data === 'object') {
          data = data[path];
        } else {
          return null;
        }
      }
    }

    return data;
  }
}

module.exports = APITester;