const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function debugReportsRevenue() {
  try {
    console.log('🔍 调试 Reports Revenue API\n');

    // 1. 登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    // 2. 测试10月数据（我们知道有数据的月份）
    console.log('2. 测试10月数据...');
    const octParams = {
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      groupBy: 'day',
      nodeCount: 31
    };
    
    console.log('📅 请求参数:', octParams);
    
    const octResponse = await axios.get(`${API_BASE_URL}/reports/revenue`, {
      headers: { Authorization: `Bearer dev-mock-token` },
      params: octParams
    });
    
    console.log('📊 10月响应数据:');
    console.log('  - 总收入:', octResponse.data.totalRevenue);
    console.log('  - 总发票数:', octResponse.data.totalInvoices);
    console.log('  - 月度数据长度:', octResponse.data.monthlyData?.length);
    
    if (octResponse.data.monthlyData && octResponse.data.monthlyData.length > 0) {
      console.log('  - 前5天数据:');
      octResponse.data.monthlyData.slice(0, 5).forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.period}: 收入=${item.revenue}, 发票数=${item.invoiceCount}`);
      });
      
      // 找到有数据的天
      const daysWithData = octResponse.data.monthlyData.filter(item => item.revenue > 0);
      console.log(`  - 有收入的天数: ${daysWithData.length}`);
      if (daysWithData.length > 0) {
        console.log('  - 有收入的天:');
        daysWithData.forEach(item => {
          console.log(`    ${item.period}: 收入=${item.revenue}, 发票数=${item.invoiceCount}`);
        });
      }
    }

    // 3. 测试9月数据
    console.log('\n3. 测试9月数据...');
    const sepParams = {
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      groupBy: 'day',
      nodeCount: 30
    };
    
    const sepResponse = await axios.get(`${API_BASE_URL}/reports/revenue`, {
      headers: { Authorization: `Bearer dev-mock-token` },
      params: sepParams
    });
    
    console.log('📊 9月响应数据:');
    console.log('  - 总收入:', sepResponse.data.totalRevenue);
    console.log('  - 总发票数:', sepResponse.data.totalInvoices);
    
    const sepDaysWithData = sepResponse.data.monthlyData?.filter(item => item.revenue > 0) || [];
    console.log(`  - 有收入的天数: ${sepDaysWithData.length}`);
    if (sepDaysWithData.length > 0) {
      console.log('  - 有收入的天:');
      sepDaysWithData.forEach(item => {
        console.log(`    ${item.period}: 收入=${item.revenue}, 发票数=${item.invoiceCount}`);
      });
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.response?.data || error.message);
  }
}

debugReportsRevenue();