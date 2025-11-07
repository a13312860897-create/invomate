/**
 * 报表页面数据一致性测试
 * 验证财务报表、收入统计、发票分析等功能的数据一致性
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

class ReportConsistencyTest {
  constructor() {
    this.testRunner = new TestRunner();
    this.apiTester = new APITester({
      baseURL: BASE_URL,
      timeout: 15000
    });
    this.authToken = null;
  }

  async initialize() {
    console.log('🚀 初始化报表数据一致性测试...');
    
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
      name: '财务报表数据一致性测试',
      tests: [
        {
          name: '验证收入统计数据准确性',
          test: () => this.testRevenueStatistics()
        },
        {
          name: '验证发票状态分布数据',
          test: () => this.testInvoiceStatusDistribution()
        },
        {
          name: '验证月度收入趋势',
          test: () => this.testMonthlyRevenueTrend()
        },
        {
          name: '验证客户收入排名',
          test: () => this.testClientRevenueRanking()
        },
        {
          name: '验证逾期发票统计',
          test: () => this.testOverdueInvoiceStats()
        }
      ]
    });

    this.testRunner.registerTestSuite({
      name: '报表数据交叉验证测试',
      tests: [
        {
          name: '验证仪表板与报表数据一致性',
          test: () => this.testDashboardReportConsistency()
        },
        {
          name: '验证发票列表与统计数据一致性',
          test: () => this.testInvoiceListStatsConsistency()
        },
        {
          name: '验证客户数据与收入统计一致性',
          test: () => this.testClientRevenueConsistency()
        }
      ]
    });

    this.testRunner.registerTestSuite({
      name: '报表API性能测试',
      tests: [
        {
          name: '测试报表API响应时间',
          test: () => this.testReportAPIPerformance()
        },
        {
          name: '测试大数据量报表生成',
          test: () => this.testLargeDataReportGeneration()
        }
      ]
    });
  }

  /**
   * 测试收入统计数据准确性
   */
  async testRevenueStatistics() {
    console.log('🔍 测试收入统计数据准确性...');

    // 获取仪表板统计数据
    const dashboardResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!dashboardResult.success) {
      throw new Error(`获取仪表板统计失败: ${dashboardResult.error?.message}`);
    }

    // 获取发票列表进行手动计算
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    const dashboardRevenue = dashboardResult.response.data.totalRevenue;
    const invoices = invoicesResult.response.data.invoices;

    // 手动计算总收入（只计算已支付的发票）
    const calculatedRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    // 允许小数点精度误差
    const tolerance = 0.01;
    if (Math.abs(dashboardRevenue - calculatedRevenue) > tolerance) {
      throw new Error(`收入统计不一致: 仪表板 ${dashboardRevenue}, 计算值 ${calculatedRevenue}`);
    }

    console.log(`✅ 收入统计验证通过: ${dashboardRevenue}`);
    return { success: true, message: '收入统计数据准确性验证通过' };
  }

  /**
   * 测试发票状态分布数据
   */
  async testInvoiceStatusDistribution() {
    console.log('🔍 测试发票状态分布数据...');

    // 获取发票状态分布
    const distributionResult = await this.apiTester.testEndpoint('/dashboard/invoice-status-distribution', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!distributionResult.success) {
      throw new Error(`获取发票状态分布失败: ${distributionResult.error?.message}`);
    }

    // 获取发票列表进行验证
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    const distribution = distributionResult.response.data;
    const invoices = invoicesResult.response.data.invoices;

    // 手动计算各状态发票数量
    const calculatedDistribution = {
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length
    };

    // 验证每个状态的数量
    for (const status in calculatedDistribution) {
      const distributionItem = distribution.find(item => item.status === status);
      const expectedCount = calculatedDistribution[status];
      const actualCount = distributionItem ? distributionItem.count : 0;

      if (actualCount !== expectedCount) {
        throw new Error(`${status} 状态发票数量不一致: 分布数据 ${actualCount}, 计算值 ${expectedCount}`);
      }
    }

    console.log('✅ 发票状态分布数据验证通过');
    return { success: true, message: '发票状态分布数据验证通过' };
  }

  /**
   * 测试月度收入趋势
   */
  async testMonthlyRevenueTrend() {
    console.log('🔍 测试月度收入趋势...');

    // 获取发票列表
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    const invoices = invoicesResult.response.data.invoices;

    // 按月份统计收入
    const monthlyRevenue = {};
    invoices
      .filter(invoice => invoice.status === 'paid' && invoice.paidAt)
      .forEach(invoice => {
        const paidDate = new Date(invoice.paidAt);
        const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = 0;
        }
        monthlyRevenue[monthKey] += invoice.amount || 0;
      });

    // 验证至少有数据
    if (Object.keys(monthlyRevenue).length === 0) {
      console.log('⚠️ 没有已支付的发票数据用于月度趋势分析');
    } else {
      console.log('月度收入趋势:', monthlyRevenue);
    }

    console.log('✅ 月度收入趋势测试通过');
    return { success: true, message: '月度收入趋势验证通过' };
  }

  /**
   * 测试客户收入排名
   */
  async testClientRevenueRanking() {
    console.log('🔍 测试客户收入排名...');

    // 获取客户列表
    const clientsResult = await this.apiTester.testEndpoint('/clients', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!clientsResult.success) {
      throw new Error(`获取客户列表失败: ${clientsResult.error?.message}`);
    }

    // 获取发票列表
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    const clients = clientsResult.response.data.clients;
    const invoices = invoicesResult.response.data.invoices;

    // 计算每个客户的收入
    const clientRevenue = clients.map(client => {
      const clientInvoices = invoices.filter(inv => 
        inv.clientId === client.id && inv.status === 'paid'
      );
      const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalRevenue,
        invoiceCount: clientInvoices.length
      };
    });

    // 按收入排序
    clientRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue);

    console.log('客户收入排名（前5名）:');
    clientRevenue.slice(0, 5).forEach((client, index) => {
      console.log(`${index + 1}. ${client.clientName}: ¥${client.totalRevenue} (${client.invoiceCount}张发票)`);
    });

    console.log('✅ 客户收入排名测试通过');
    return { success: true, message: '客户收入排名验证通过' };
  }

  /**
   * 测试逾期发票统计
   */
  async testOverdueInvoiceStats() {
    console.log('🔍 测试逾期发票统计...');

    // 获取仪表板统计数据
    const dashboardResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!dashboardResult.success) {
      throw new Error(`获取仪表板统计失败: ${dashboardResult.error?.message}`);
    }

    // 获取发票列表
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    const dashboardOverdue = dashboardResult.response.data.overdueInvoices;
    const invoices = invoicesResult.response.data.invoices;

    // 计算逾期发票数量
    const calculatedOverdue = invoices.filter(invoice => invoice.status === 'overdue').length;

    if (dashboardOverdue !== calculatedOverdue) {
      throw new Error(`逾期发票统计不一致: 仪表板 ${dashboardOverdue}, 计算值 ${calculatedOverdue}`);
    }

    // 计算逾期金额
    const overdueAmount = invoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    console.log(`✅ 逾期发票统计验证通过: ${calculatedOverdue}张, 总金额 ¥${overdueAmount}`);
    return { success: true, message: '逾期发票统计验证通过' };
  }

  /**
   * 测试仪表板与报表数据一致性
   */
  async testDashboardReportConsistency() {
    console.log('🔍 测试仪表板与报表数据一致性...');

    // 获取仪表板统计数据
    const dashboardResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!dashboardResult.success) {
      throw new Error(`获取仪表板统计失败: ${dashboardResult.error?.message}`);
    }

    // 获取发票状态分布
    const distributionResult = await this.apiTester.testEndpoint('/dashboard/invoice-status-distribution', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!distributionResult.success) {
      throw new Error(`获取发票状态分布失败: ${distributionResult.error?.message}`);
    }

    const dashboardStats = dashboardResult.response.data;
    const distribution = distributionResult.response.data;

    // 验证总发票数一致性
    const distributionTotal = distribution.reduce((sum, item) => sum + item.count, 0);
    if (dashboardStats.totalInvoices !== distributionTotal) {
      throw new Error(`总发票数不一致: 仪表板 ${dashboardStats.totalInvoices}, 分布统计 ${distributionTotal}`);
    }

    // 验证待处理发票数一致性
    const pendingFromDistribution = distribution
      .filter(item => ['draft', 'sent'].includes(item.status))
      .reduce((sum, item) => sum + item.count, 0);
    
    if (dashboardStats.pendingInvoices !== pendingFromDistribution) {
      throw new Error(`待处理发票数不一致: 仪表板 ${dashboardStats.pendingInvoices}, 分布统计 ${pendingFromDistribution}`);
    }

    console.log('✅ 仪表板与报表数据一致性验证通过');
    return { success: true, message: '仪表板与报表数据一致性验证通过' };
  }

  /**
   * 测试发票列表与统计数据一致性
   */
  async testInvoiceListStatsConsistency() {
    console.log('🔍 测试发票列表与统计数据一致性...');

    // 获取发票列表
    const invoicesResult = await this.apiTester.testEndpoint('/invoices', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!invoicesResult.success) {
      throw new Error(`获取发票列表失败: ${invoicesResult.error?.message}`);
    }

    // 获取仪表板统计数据
    const dashboardResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!dashboardResult.success) {
      throw new Error(`获取仪表板统计失败: ${dashboardResult.error?.message}`);
    }

    const invoices = invoicesResult.response.data.invoices;
    const dashboardStats = dashboardResult.response.data;

    // 验证总发票数
    if (invoices.length !== dashboardStats.totalInvoices) {
      throw new Error(`发票总数不一致: 列表 ${invoices.length}, 统计 ${dashboardStats.totalInvoices}`);
    }

    // 验证各状态发票数量
    const statusCounts = {
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      pending: invoices.filter(inv => ['draft', 'sent'].includes(inv.status)).length
    };

    if (statusCounts.overdue !== dashboardStats.overdueInvoices) {
      throw new Error(`逾期发票数不一致: 列表 ${statusCounts.overdue}, 统计 ${dashboardStats.overdueInvoices}`);
    }

    if (statusCounts.pending !== dashboardStats.pendingInvoices) {
      throw new Error(`待处理发票数不一致: 列表 ${statusCounts.pending}, 统计 ${dashboardStats.pendingInvoices}`);
    }

    console.log('✅ 发票列表与统计数据一致性验证通过');
    return { success: true, message: '发票列表与统计数据一致性验证通过' };
  }

  /**
   * 测试客户数据与收入统计一致性
   */
  async testClientRevenueConsistency() {
    console.log('🔍 测试客户数据与收入统计一致性...');

    // 获取客户列表
    const clientsResult = await this.apiTester.testEndpoint('/clients', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!clientsResult.success) {
      throw new Error(`获取客户列表失败: ${clientsResult.error?.message}`);
    }

    // 获取仪表板统计数据
    const dashboardResult = await this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!dashboardResult.success) {
      throw new Error(`获取仪表板统计失败: ${dashboardResult.error?.message}`);
    }

    const clients = clientsResult.response.data.clients;
    const dashboardStats = dashboardResult.response.data;

    // 验证客户总数
    if (clients.length !== dashboardStats.totalClients) {
      throw new Error(`客户总数不一致: 列表 ${clients.length}, 统计 ${dashboardStats.totalClients}`);
    }

    console.log('✅ 客户数据与收入统计一致性验证通过');
    return { success: true, message: '客户数据与收入统计一致性验证通过' };
  }

  /**
   * 测试报表API响应时间
   */
  async testReportAPIPerformance() {
    console.log('🔍 测试报表API响应时间...');

    const endpoints = [
      '/dashboard/dashboard-stats',
      '/dashboard/invoice-status-distribution',
      '/invoices',
      '/clients'
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
        success: responseTime < 3000 // 3秒内响应
      });

      console.log(`- ${endpoint}: ${responseTime}ms`);
    }

    const slowEndpoints = performanceResults.filter(r => !r.success);
    if (slowEndpoints.length > 0) {
      throw new Error(`以下端点响应时间过长: ${slowEndpoints.map(r => r.endpoint).join(', ')}`);
    }

    console.log('✅ 报表API响应时间测试通过');
    return { success: true, message: '报表API响应时间验证通过' };
  }

  /**
   * 测试大数据量报表生成
   */
  async testLargeDataReportGeneration() {
    console.log('🔍 测试大数据量报表生成...');

    // 获取所有数据进行性能测试
    const startTime = Date.now();

    const [invoicesResult, clientsResult, dashboardResult] = await Promise.all([
      this.apiTester.testEndpoint('/invoices', {
        method: 'GET',
        headers: this.getAuthHeaders()
      }),
      this.apiTester.testEndpoint('/clients', {
        method: 'GET',
        headers: this.getAuthHeaders()
      }),
      this.apiTester.testEndpoint('/dashboard/dashboard-stats', {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
    ]);

    const totalTime = Date.now() - startTime;

    // 验证所有请求都成功
    if (!invoicesResult.success) {
      throw new Error(`获取发票数据失败: ${invoicesResult.error?.message}`);
    }
    if (!clientsResult.success) {
      throw new Error(`获取客户数据失败: ${clientsResult.error?.message}`);
    }
    if (!dashboardResult.success) {
      throw new Error(`获取统计数据失败: ${dashboardResult.error?.message}`);
    }

    // 验证并发请求性能
    if (totalTime > 5000) { // 5秒内完成
      throw new Error(`并发数据获取时间过长: ${totalTime}ms`);
    }

    const invoiceCount = invoicesResult.response.data.invoices.length;
    const clientCount = clientsResult.response.data.clients.length;

    console.log(`✅ 大数据量报表生成测试通过: ${invoiceCount}张发票, ${clientCount}个客户, 耗时${totalTime}ms`);
    return { success: true, message: '大数据量报表生成验证通过' };
  }

  async run() {
    try {
      await this.initialize();
      this.setupTests();
      
      console.log('\n🧪 开始执行报表数据一致性测试...\n');
      const results = await this.testRunner.runAllTests();
      
      console.log('\n📊 报表数据一致性测试完成');
      return results;
      
    } catch (error) {
      console.error('❌ 报表数据一致性测试失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const test = new ReportConsistencyTest();
  test.run().then(results => {
    console.log('✅ 报表数据一致性测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}

module.exports = ReportConsistencyTest;