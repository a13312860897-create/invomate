/**
 * 发票管理页面数据一致性测试
 * 验证发票列表、创建、编辑、状态更新等功能的数据一致性
 */

const axios = require('axios');
const TestRunner = require('../framework/TestRunner');
const APITester = require('../framework/APITester');

// 配置
const BASE_URL = 'http://localhost:3002/api';

// 测试用户认证信息
const TEST_AUTH = {
  email: 'a133128860897@163.com',
  password: '123456'
};

// 获取认证token
async function getAuthToken() {
  try {
    console.log('🔐 尝试获取认证token...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_AUTH, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success && response.data.data && response.data.data.token) {
      console.log('✅ 认证token获取成功');
      return response.data.data.token;
    } else {
      console.error('❌ 登录响应格式错误:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取认证token失败:', error.response?.data || error.message);
    return null;
  }
}

class InvoiceConsistencyTest {
  constructor() {
    this.testRunner = new TestRunner();
    this.apiTester = new APITester({
      baseURL: BASE_URL,
      timeout: 15000
    });
    this.authToken = null;
  }

  async initialize() {
    console.log('🚀 初始化发票数据一致性测试...');
    
    // 获取认证token
    this.authToken = await getAuthToken();
    if (!this.authToken) {
      throw new Error('无法获取认证token，测试终止');
    }
    
    console.log('✅ 认证token获取成功');
  }

  // 获取认证头
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  setupTests() {
    // 注册测试套件
    this.testRunner.registerTestSuite({
      name: '发票管理数据一致性测试',
      tests: [
        {
          name: '验证发票列表数据完整性',
          test: () => this.testInvoiceListData()
        },
        {
          name: '验证发票创建后数据同步',
          test: () => this.testInvoiceCreationSync()
        },
        {
          name: '验证发票状态更新一致性',
          test: () => this.testInvoiceStatusUpdate()
        },
        {
          name: '验证发票搜索筛选功能',
          test: () => this.testInvoiceSearchFilter()
        },
        {
          name: '验证发票分页功能',
          test: () => this.testInvoicePagination()
        }
      ]
    });

    this.testRunner.registerTestSuite({
      name: '发票数据验证测试',
      tests: [
        {
          name: '验证发票金额计算准确性',
          test: () => this.testInvoiceAmountCalculation()
        },
        {
          name: '验证发票统计数据一致性',
          test: () => this.testInvoiceStatsConsistency()
        },
        {
          name: '验证发票与客户关联数据',
          test: () => this.testInvoiceClientRelation()
        }
      ]
    });

    this.testRunner.registerTestSuite({
      name: '发票API性能测试',
      tests: [
        {
          name: '测试发票API响应时间',
          test: () => this.testInvoiceAPIPerformance()
        },
        {
          name: '测试发票并发操作',
          test: () => this.testInvoiceConcurrentOperations()
        }
      ]
    });
  }

  /**
   * 测试发票列表数据完整性
   */
  async testInvoiceListData() {
    console.log('🔍 测试发票列表数据完整性...');

    const result = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders(),
      schema: {
        invoices: 'array',
        total: 'number',
        page: 'number',
        limit: 'number',
        totalPages: 'number'
      }
    });

    if (!result.success) {
      throw new Error(`发票列表数据测试失败: ${result.error?.message}`);
    }

    // 验证发票数据结构
    const invoices = result.response.data.invoices;
    if (invoices.length > 0) {
      const invoice = invoices[0];
      const requiredFields = ['id', 'invoiceNumber', 'clientId', 'amount', 'status', 'createdAt'];
      
      for (const field of requiredFields) {
        if (!(field in invoice)) {
          throw new Error(`发票数据缺少必需字段: ${field}`);
        }
      }
    }

    console.log('✅ 发票列表数据完整性测试通过');
    return { success: true, message: '发票列表数据完整性验证通过' };
  }

  /**
   * 测试发票创建后数据同步
   */
  async testInvoiceCreationSync() {
    console.log('🔍 测试发票创建后数据同步...');

    // 获取创建前的发票总数
    const beforeResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!beforeResult.success) {
      throw new Error(`获取创建前发票数据失败: ${beforeResult.error?.message}`);
    }

    const beforeTotal = beforeResult.response.data.total;

    // 创建测试发票
    const testInvoice = {
      clientId: 1,
      invoiceNumber: `TEST-${Date.now()}`,
      amount: 1000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          description: '测试项目',
          quantity: 1,
          unitPrice: 1000,
          total: 1000
        }
      ]
    };

    const createResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      data: testInvoice,
      expectedStatus: 201
    });

    if (!createResult.success) {
      throw new Error(`创建发票失败: ${createResult.error?.message}`);
    }

    // 获取创建后的发票总数
    const afterResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!afterResult.success) {
      throw new Error(`获取创建后发票数据失败: ${afterResult.error?.message}`);
    }

    const afterTotal = afterResult.response.data.total;

    // 验证发票数量增加
    if (afterTotal !== beforeTotal + 1) {
      throw new Error(`发票创建后数量不一致: 期望 ${beforeTotal + 1}, 实际 ${afterTotal}`);
    }

    console.log('✅ 发票创建后数据同步测试通过');
    return { success: true, message: '发票创建后数据同步验证通过' };
  }

  /**
   * 测试发票状态更新一致性
   */
  async testInvoiceStatusUpdate() {
    console.log('🔍 测试发票状态更新一致性...');

    // 获取第一张发票
    const listResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!listResult.success || listResult.response.data.invoices.length === 0) {
      throw new Error('没有可用的发票进行状态更新测试');
    }

    const invoice = listResult.response.data.invoices[0];
    const originalStatus = invoice.status;
    const newStatus = originalStatus === 'draft' ? 'sent' : 'draft';

    // 更新发票状态
    const updateResult = await this.apiTester.testEndpoint(`/invoices/${invoice.id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      data: { status: newStatus }
    });

    if (!updateResult.success) {
      throw new Error(`更新发票状态失败: ${updateResult.error?.message}`);
    }

    // 验证状态更新
    const verifyResult = await this.apiTester.testEndpoint(`/invoices/${invoice.id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!verifyResult.success) {
      throw new Error(`获取更新后发票数据失败: ${verifyResult.error?.message}`);
    }

    const updatedInvoice = verifyResult.response.data;
    if (updatedInvoice.status !== newStatus) {
      throw new Error(`发票状态更新不一致: 期望 ${newStatus}, 实际 ${updatedInvoice.status}`);
    }

    // 恢复原状态
    await this.apiTester.testEndpoint(`/invoices/${invoice.id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      data: { status: originalStatus }
    });

    console.log('✅ 发票状态更新一致性测试通过');
    return { success: true, message: '发票状态更新一致性验证通过' };
  }

  /**
   * 测试发票搜索筛选功能
   */
  async testInvoiceSearchFilter() {
    console.log('🔍 测试发票搜索筛选功能...');

    // 测试按状态筛选
    const statusFilterResult = await this.apiTester.testEndpoint('/invoices?status=draft', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!statusFilterResult.success) {
      throw new Error(`按状态筛选失败: ${statusFilterResult.error?.message}`);
    }

    // 验证筛选结果
    const filteredInvoices = statusFilterResult.response.data.invoices;
    for (const invoice of filteredInvoices) {
      if (invoice.status !== 'draft') {
        throw new Error(`状态筛选结果不正确: 期望 draft, 实际 ${invoice.status}`);
      }
    }

    console.log('✅ 发票搜索筛选功能测试通过');
    return { success: true, message: '发票搜索筛选功能验证通过' };
  }

  /**
   * 测试发票分页功能
   */
  async testInvoicePagination() {
    console.log('🔍 测试发票分页功能...');

    // 测试第一页
    const page1Result = await this.apiTester.testEndpoint('/invoices?page=1&limit=5', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!page1Result.success) {
      throw new Error(`获取第一页数据失败: ${page1Result.error?.message}`);
    }

    const page1Data = page1Result.response.data;
    
    // 验证分页信息
    if (page1Data.page !== 1) {
      throw new Error(`分页信息不正确: 期望页码 1, 实际 ${page1Data.page}`);
    }

    if (page1Data.limit !== 5) {
      throw new Error(`分页限制不正确: 期望限制 5, 实际 ${page1Data.limit}`);
    }

    console.log('✅ 发票分页功能测试通过');
    return { success: true, message: '发票分页功能验证通过' };
  }

  /**
   * 测试发票金额计算准确性
   */
  async testInvoiceAmountCalculation() {
    console.log('🔍 测试发票金额计算准确性...');

    // 获取发票列表
    const listResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!listResult.success) {
      throw new Error(`获取发票列表失败: ${listResult.error?.message}`);
    }

    const invoices = listResult.response.data.invoices;
    
    // 验证每张发票的金额计算
    for (const invoice of invoices.slice(0, 3)) { // 只检查前3张发票
      if (invoice.items && invoice.items.length > 0) {
        let calculatedTotal = 0;
        for (const item of invoice.items) {
          calculatedTotal += (item.quantity || 1) * (item.unitPrice || 0);
        }
        
        if (Math.abs(calculatedTotal - invoice.amount) > 0.01) {
          throw new Error(`发票 ${invoice.invoiceNumber} 金额计算不正确: 期望 ${calculatedTotal}, 实际 ${invoice.amount}`);
        }
      }
    }

    console.log('✅ 发票金额计算准确性测试通过');
    return { success: true, message: '发票金额计算准确性验证通过' };
  }

  /**
   * 测试发票统计数据一致性
   */
  async testInvoiceStatsConsistency() {
    console.log('🔍 测试发票统计数据一致性...');

    // 获取发票列表
    const listResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!listResult.success) {
      throw new Error(`获取发票列表失败: ${listResult.error?.message}`);
    }

    // 获取仪表板统计数据
    const statsResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!statsResult.success) {
      throw new Error(`获取统计数据失败: ${statsResult.error?.message}`);
    }

    const invoiceTotal = listResult.response.data.total;
    const statsTotal = statsResult.response.data.totalInvoices;

    if (invoiceTotal !== statsTotal) {
      throw new Error(`发票统计数据不一致: 发票列表 ${invoiceTotal}, 统计数据 ${statsTotal}`);
    }

    console.log('✅ 发票统计数据一致性测试通过');
    return { success: true, message: '发票统计数据一致性验证通过' };
  }

  /**
   * 测试发票与客户关联数据
   */
  async testInvoiceClientRelation() {
    console.log('🔍 测试发票与客户关联数据...');

    // 获取发票列表
    const listResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!listResult.success) {
      throw new Error(`获取发票列表失败: ${listResult.error?.message}`);
    }

    const invoices = listResult.response.data.invoices;
    
    // 验证客户关联
    for (const invoice of invoices.slice(0, 3)) { // 只检查前3张发票
      if (invoice.clientId) {
        const clientResult = await this.apiTester.testEndpoint(`/clients/${invoice.clientId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (!clientResult.success) {
          throw new Error(`获取客户 ${invoice.clientId} 信息失败: ${clientResult.error?.message}`);
        }

        const client = clientResult.response.data;
        if (!client || client.id !== invoice.clientId) {
          throw new Error(`发票 ${invoice.invoiceNumber} 的客户关联数据不正确`);
        }
      }
    }

    console.log('✅ 发票与客户关联数据测试通过');
    return { success: true, message: '发票与客户关联数据验证通过' };
  }

  /**
   * 测试发票API响应时间
   */
  async testInvoiceAPIPerformance() {
    console.log('🔍 测试发票API响应时间...');

    const endpoints = [
      '/invoices',
      '/invoices?page=1&limit=10',
      '/invoices?status=draft'
    ];

    const performanceResults = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const result = await this.apiTester.testEndpoint(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const responseTime = Date.now() - startTime;

      if (!result.success) {
        throw new Error(`${endpoint} 请求失败: ${result.error?.message}`);
      }

      performanceResults.push({
        endpoint,
        responseTime,
        success: responseTime < 2000 // 2秒内响应
      });

      console.log(`- ${endpoint}: ${responseTime}ms`);
    }

    const slowEndpoints = performanceResults.filter(r => !r.success);
    if (slowEndpoints.length > 0) {
      throw new Error(`以下端点响应时间过长: ${slowEndpoints.map(r => r.endpoint).join(', ')}`);
    }

    console.log('✅ 发票API响应时间测试通过');
    return { success: true, message: '发票API响应时间验证通过' };
  }

  /**
   * 测试发票并发操作
   */
  async testInvoiceConcurrentOperations() {
    console.log('🔍 测试发票并发操作...');

    // 并发获取发票列表
    const concurrentRequests = Array(5).fill().map(() => 
      this.apiTester.testEndpoint('/invoices', {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
    );

    const results = await Promise.all(concurrentRequests);
    
    // 验证所有请求都成功
    for (let i = 0; i < results.length; i++) {
      if (!results[i].success) {
        throw new Error(`并发请求 ${i + 1} 失败: ${results[i].error?.message}`);
      }
    }

    // 验证返回数据一致性
    const firstResult = results[0].response.data;
    for (let i = 1; i < results.length; i++) {
      const currentResult = results[i].response.data;
      if (currentResult.total !== firstResult.total) {
        throw new Error(`并发请求返回数据不一致: 请求1总数 ${firstResult.total}, 请求${i + 1}总数 ${currentResult.total}`);
      }
    }

    console.log('✅ 发票并发操作测试通过');
    return { success: true, message: '发票并发操作验证通过' };
  }

  async run() {
    try {
      await this.initialize();
      this.setupTests();
      
      console.log('\n🧪 开始执行发票数据一致性测试...\n');
      const results = await this.testRunner.runAllTests();
      
      console.log('\n📊 发票数据一致性测试完成');
      return results;
      
    } catch (error) {
      console.error('❌ 发票数据一致性测试失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const test = new InvoiceConsistencyTest();
  test.run().then(results => {
    console.log('✅ 发票数据一致性测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}

module.exports = InvoiceConsistencyTest;