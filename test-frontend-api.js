// 简单测试前端API调用
const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testFrontendAPI() {
  try {
    console.log('=== 测试前端API调用 ===\n');
    
    // 1. 测试登录
    console.log('1. 测试登录API...');
    const loginOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('登录响应状态:', loginResponse.statusCode);
    console.log('登录响应数据:', loginResponse.data);
    
    let token = null;
    if (loginResponse.statusCode === 200) {
      const loginResult = JSON.parse(loginResponse.data);
      if (loginResult.success && loginResult.data && loginResult.data.token) {
        token = loginResult.data.token;
        console.log('✅ 登录成功，获得token:', token.substring(0, 20) + '...');
      }
    }
    
    if (!token) {
      console.log('❌ 登录失败，无法继续测试');
      return;
    }
    
    // 2. 测试Dashboard Stats API
    console.log('\n2. 测试Dashboard Stats API...');
    const statsOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/dashboard/stats?month=2025-11',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const statsResponse = await makeRequest(statsOptions);
    console.log('Stats响应状态:', statsResponse.statusCode);
    console.log('Stats响应数据:', statsResponse.data);
    
    if (statsResponse.statusCode === 200) {
      const statsData = JSON.parse(statsResponse.data);
      console.log('\n=== Dashboard数据分析 ===');
      console.log('总收入:', statsData.totalRevenue);
      console.log('总发票数:', statsData.totalInvoices);
      console.log('待处理数量:', statsData.pendingCount);
      console.log('待处理金额:', statsData.pendingAmount);
      console.log('总客户数:', statsData.totalClients);
      
      // 检查数据是否为0
      const hasZeroData = statsData.totalRevenue === 0 || 
                         statsData.totalInvoices === 0 || 
                         statsData.pendingAmount === 0;
      
      if (hasZeroData) {
        console.log('\n❌ 发现零值数据！');
      } else {
        console.log('\n✅ 数据看起来正常');
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testFrontendAPI();