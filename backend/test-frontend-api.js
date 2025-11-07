const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testFrontendAPI() {
  try {
    console.log('🔍 测试前端API调用流程...');
    
    // 1. 用户登录
    console.log('\n1. 尝试用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    console.log('✅ 登录成功!');
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    const user = loginResponse.data.user || loginResponse.data.data?.user;
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    
    if (user) {
      console.log('用户信息:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      });
    }
    
    if (!token) {
      throw new Error('未能获取到token');
    }
    
    console.log('🔑 获取到token:', token.substring(0, 20) + '...');
    
    // 2. 调用Revenue API
    console.log('\n2. 调用Revenue API...');
    const revenueResponse = await axios.get(`${BASE_URL}/api/reports/revenue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        startDate: '2025-10-01',
        endDate: '2025-11-30',
        groupBy: 'month',
        nodeCount: 6
      }
    });
    
    console.log('✅ Revenue API调用成功!');
    console.log('📊 Revenue数据:');
    console.log(JSON.stringify(revenueResponse.data, null, 2));
    
    // 3. 分析数据
    console.log('\n3. 分析Revenue数据...');
    const monthlyData = revenueResponse.data.monthlyData || [];
    const totalRevenue = monthlyData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalInvoices = monthlyData.reduce((sum, item) => sum + (item.invoiceCount || 0), 0);
    
    console.log(`💰 总收入: ${totalRevenue}`);
    console.log(`📄 总发票数: ${totalInvoices}`);
    
    monthlyData.forEach((item, index) => {
      console.log(`月份 ${index + 1}: ${item.period} - 收入: ${item.revenue}, 发票数: ${item.invoiceCount}`);
    });
    
    if (totalRevenue > 0) {
      console.log('\n🎉 成功！前端应该能够正常显示Revenue图表数据了！');
    } else {
      console.log('\n⚠️  警告：Revenue数据为0，图表可能仍然为空');
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 认证失败，请检查用户凭据');
    } else if (error.response?.status === 500) {
      console.log('🔧 服务器内部错误，请检查后端日志');
    }
  }
}

testFrontendAPI();