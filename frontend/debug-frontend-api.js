const axios = require('axios');

async function testClientAPI() {
  try {
    console.log('=== 测试前端客户端API调用 ===');
    
    const response = await axios.get('http://localhost:8080/api/clients', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc2MTI3NjkyMywiZXhwIjoxNzYxODgxNzIzfQ.ll226hyS-oYipmPwIguw2h2tn8oo0jw0dNjSrG0z0qg',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查数据格式
    const data = response.data;
    if (data.success && data.data && Array.isArray(data.data.clients)) {
      console.log('\n=== 客户端数据 (success格式) ===');
      console.log('客户端数量:', data.data.clients.length);
      data.data.clients.forEach((client, index) => {
        console.log(`客户端 ${index + 1}: ID=${client.id}, Name=${client.name}, UserId=${client.userId}`);
      });
    } else if (Array.isArray(data)) {
      console.log('\n=== 客户端数据 (直接数组格式) ===');
      console.log('客户端数量:', data.length);
      data.forEach((client, index) => {
        console.log(`客户端 ${index + 1}: ID=${client.id}, Name=${client.name}, UserId=${client.userId}`);
      });
    } else {
      console.log('\n=== 未知数据格式 ===');
      console.log('数据类型:', typeof data);
      console.log('数据内容:', data);
    }
    
  } catch (error) {
    console.error('API调用失败:', error.message);
    console.error('错误详情:', error);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

testClientAPI();