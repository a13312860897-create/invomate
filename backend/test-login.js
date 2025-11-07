const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试登录...');
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    console.log('登录响应:', response.data);
    return response.data.token;
  } catch (error) {
    console.log('登录错误:', error.response?.data || error.message);
    return null;
  }
}

testLogin();