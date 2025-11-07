const http = require('http');

// 模拟完整的前端数据获取流程
async function testDashboardFlow() {
  console.log('=== 测试Dashboard数据获取流程 ===\n');
  
  // 1. 登录获取token
  console.log('1. 登录获取token...');
  const token = await login();
  if (!token) {
    console.error('登录失败，无法继续测试');
    return;
  }
  console.log('✓ 登录成功\n');
  
  // 2. 获取dashboard stats
  console.log('2. 获取Dashboard统计数据...');
  const stats = await getDashboardStats(token);
  if (stats) {
    console.log('✓ Dashboard统计数据获取成功:');
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.error('✗ Dashboard统计数据获取失败');
  }
}

function login() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.token) {
            resolve(jsonData.token);
          } else {
            console.error('登录响应:', data);
            resolve(null);
          }
        } catch (e) {
          console.error('登录解析失败:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('登录请求错误:', e.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

function getDashboardStats(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/dashboard/stats?month=2025-11',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      console.log('Stats API状态码:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          console.error('Stats API解析失败:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Stats API请求错误:', e.message);
      resolve(null);
    });

    req.end();
  });
}

// 运行测试
testDashboardFlow().catch(console.error);