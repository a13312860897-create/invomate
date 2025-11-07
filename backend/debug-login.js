const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugLogin() {
    console.log('=== 调试登录响应 ===\n');
    
    try {
        console.log('发送登录请求...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        console.log('登录响应状态码:', loginResponse.status);
        console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
        
        const token = loginResponse.data.data.token;
        console.log('提取的token:', token);
        
        if (token) {
            console.log('\n测试token有效性...');
            const testResponse = await axios.get(`${BASE_URL}/invoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Token有效');
            console.log('发票API响应:', JSON.stringify(testResponse.data, null, 2));
        } else {
            console.log('❌ 未找到token');
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('状态码:', error.response.status);
        }
    }
}

debugLogin();