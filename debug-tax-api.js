const axios = require('axios');

async function debugTaxAPI() {
  try {
    console.log('🔍 开始调试税务API...');
    
    // 首先登录获取有效token
    console.log('📝 正在登录...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', loginResponse.data);
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 测试税务API
    console.log('🧪 测试税务API...');
    const taxResponse = await axios.get('http://localhost:8080/api/reports/tax', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        startDate: '2025-11-01',
        endDate: '2025-11-29'
      }
    });
    
    console.log('✅ 税务API响应成功');
    console.log('📊 响应数据:', JSON.stringify(taxResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

debugTaxAPI();