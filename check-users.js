const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function checkUsers() {
  console.log('🔍 检查用户信息');
  
  try {
    // 尝试不同的密码
    const passwords = ['password123', '123456', 'admin123', 'test123'];
    const email = 'a133128860897@163.com';
    
    for (const password of passwords) {
      console.log(`\n尝试密码: ${password}`);
      
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password
        });
        
        if (loginResponse.data.success) {
          console.log('✅ 登录成功！');
          console.log('用户信息:', loginResponse.data.user || loginResponse.data.data?.user);
          console.log('Token:', loginResponse.data.token || loginResponse.data.data?.token);
          return;
        }
      } catch (error) {
        console.log(`❌ 密码 ${password} 失败:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n所有密码都失败了，可能需要检查用户数据');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkUsers();