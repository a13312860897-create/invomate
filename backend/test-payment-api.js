const axios = require('axios');

async function testPaymentAPI() {
    try {
        console.log('=== 测试支付API ===');
        
        const token = '7ba9cbed66e3992319d39c47c48cbd596d43337b25554427792b05e35c140d79';
        console.log('测试令牌:', token);
        
        const response = await axios.get(`http://localhost:8080/api/invoices/payment/${token}`);
        
        console.log('✅ API响应成功!');
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ API测试失败:', error.response?.data?.message || error.message);
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentAPI();