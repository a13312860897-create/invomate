const axios = require('axios');
const memoryDb = require('./src/config/memoryDatabase');

async function testRevenueAPI() {
  try {
    console.log('🔍 测试Revenue API...');
    
    // 首先获取用户信息
    const users = memoryDb.findAllUsers();
    console.log(`👥 找到 ${users.length} 个用户`);
    
    if (users.length === 0) {
      console.log('❌ 没有用户数据');
      return;
    }
    
    const testUser = users[0];
    console.log(`🧪 使用测试用户: ${testUser.email} (ID: ${testUser.id})`);
    
    // 模拟登录获取token
    try {
      const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
        email: testUser.email,
        password: 'password123' // 假设这是默认密码
      });
      
      const token = loginResponse.data.token;
      console.log('✅ 登录成功，获得token');
      
      // 测试Revenue API
      const revenueResponse = await axios.get('http://localhost:8080/api/reports/revenue', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          startDate: '2025-10-01',
          endDate: '2025-11-30',
          groupBy: 'month',
          nodeCount: 6
        }
      });
      
      console.log('📊 Revenue API 响应:');
      console.log('状态码:', revenueResponse.status);
      console.log('数据:', JSON.stringify(revenueResponse.data, null, 2));
      
    } catch (loginError) {
      console.log('⚠️ 登录失败，尝试直接调用API...');
      console.log('登录错误:', loginError.response?.data || loginError.message);
      
      // 直接测试API（可能需要token）
      try {
        const directResponse = await axios.get('http://localhost:8080/api/reports/revenue', {
          params: {
            startDate: '2025-10-01',
            endDate: '2025-11-30',
            groupBy: 'month',
            nodeCount: 6
          }
        });
        
        console.log('📊 直接调用 Revenue API 响应:');
        console.log('状态码:', directResponse.status);
        console.log('数据:', JSON.stringify(directResponse.data, null, 2));
        
      } catch (directError) {
        console.log('❌ 直接调用也失败:', directError.response?.data || directError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

testRevenueAPI();