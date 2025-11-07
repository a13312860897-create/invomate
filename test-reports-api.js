const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function testReportsAPI() {
  try {
    console.log('🔍 测试报告API...');
    
    // 登录获取token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ 登录成功\n');
    
    // 测试各个报告端点
    const reportTests = [
      {
        name: '发票状态概览',
        url: '/reports/invoice-status-overview',
        params: { year: 2024, month: 11 }
      },
      {
        name: '应收账款报告',
        url: '/reports/accounts-receivable',
        params: { year: 2024, month: 11 }
      },
      {
        name: '收入报告',
        url: '/reports/revenue',
        params: { 
          startDate: '2024-11-01',
          endDate: '2024-11-30'
        }
      },
      {
        name: '税务报告',
        url: '/reports/tax',
        params: { year: 2024, month: 11 }
      }
    ];
    
    for (const test of reportTests) {
      console.log(`📊 测试 ${test.name}...`);
      
      try {
        const response = await axios.get(`${API_BASE}${test.url}`, {
          headers,
          params: test.params
        });
        
        console.log(`✅ ${test.name} - 状态: ${response.status}`);
        console.log(`📈 数据预览:`, JSON.stringify(response.data, null, 2).substring(0, 300) + '...\n');
        
      } catch (error) {
        console.error(`❌ ${test.name} 失败:`, error.response?.data || error.message);
        console.log('');
      }
    }
    
    console.log('🎉 报告API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testReportsAPI();