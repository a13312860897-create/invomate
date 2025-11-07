const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function testReportsRevenueAPI() {
  console.log('🧪 测试Reports页面Revenue API调用');
  
  try {
    // 1. 用户登录
    console.log('\n1. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('✅ 登录成功，获取到token');
    
    // 2. 调用Reports Revenue API
    console.log('\n2. 调用Reports Revenue API...');
    
    // 模拟Reports页面的API调用参数
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0]; // 月末日期
    
    console.log('📅 请求参数:', {
      startDate,
      endDate,
      groupBy: 'day',
      nodeCount: 31
    });
    
    const revenueResponse = await axios.get(`${API_BASE_URL}/reports/revenue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        startDate,
        endDate,
        groupBy: 'day',
        nodeCount: 31
      }
    });
    
    console.log('✅ Revenue API调用成功');
    console.log('📊 响应数据结构:', {
      monthlyData: revenueResponse.data.monthlyData?.length || 0,
      totalRevenue: revenueResponse.data.totalRevenue,
      totalInvoices: revenueResponse.data.totalInvoices
    });
    
    if (revenueResponse.data.monthlyData && revenueResponse.data.monthlyData.length > 0) {
      console.log('📈 月度数据示例:');
      revenueResponse.data.monthlyData.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. 期间: ${item.period || item.month}, 收入: ${item.revenue || item.amount}, 发票数: ${item.invoiceCount}`);
      });
    } else {
      console.log('⚠️ 没有找到月度数据');
    }
    
    // 3. 测试11月数据
    console.log('\n3. 测试11月数据...');
    const nov2025Response = await axios.get(`${API_BASE_URL}/reports/revenue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        startDate: '2025-11-01',
        endDate: '2025-11-30',
        groupBy: 'day',
        nodeCount: 31
      }
    });
    
    console.log('📊 11月数据:', {
      monthlyData: nov2025Response.data.monthlyData?.length || 0,
      totalRevenue: nov2025Response.data.totalRevenue,
      totalInvoices: nov2025Response.data.totalInvoices
    });
    
    // 4. 测试10月数据
    console.log('\n4. 测试10月数据...');
    const oct2025Response = await axios.get(`${API_BASE_URL}/reports/revenue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        groupBy: 'day',
        nodeCount: 31
      }
    });
    
    console.log('📊 10月数据:', {
      monthlyData: oct2025Response.data.monthlyData?.length || 0,
      totalRevenue: oct2025Response.data.totalRevenue,
      totalInvoices: oct2025Response.data.totalInvoices
    });
    
    if (oct2025Response.data.monthlyData && oct2025Response.data.monthlyData.length > 0) {
      console.log('📈 10月数据详情:');
      oct2025Response.data.monthlyData.forEach((item, index) => {
        if (item.revenue > 0) {
          console.log(`  ${index + 1}. 日期: ${item.segmentStart}, 收入: ${item.revenue}, 发票数: ${item.invoiceCount}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.data);
      console.error('🔢 状态码:', error.response.status);
    }
  }
}

testReportsRevenueAPI();