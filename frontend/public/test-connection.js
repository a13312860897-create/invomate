// 前后端连接测试
async function testConnection() {
  console.log('🔍 测试前后端连接...\n');

  const apiUrl = window.location.origin.includes('3000') ? 'http://localhost:3001' : 'http://localhost:3001';
  
  const tests = [
    {
      name: '基础API连接',
      url: `${apiUrl}/`,
      expectStatus: 200
    },
    {
      name: '发票API（无认证）',
      url: `${apiUrl}/api/invoices`,
      expectStatus: 401
    },
    {
      name: '认证API',
      url: `${apiUrl}/api/auth/status`,
      expectStatus: 200
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const passed = response.status === test.expectStatus;
      console.log(`${passed ? '✅' : '❌'} ${test.name}`);
      console.log(`   状态码: ${response.status} (期望: ${test.expectStatus})`);
      
      if (!passed) {
        console.log(`   问题: 期望状态码 ${test.expectStatus}，但实际得到 ${response.status}`);
      }
      
      // 尝试解析响应
      try {
        const data = await response.json();
        console.log(`   响应: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (e) {
        console.log(`   响应: 非JSON格式`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log(`   可能原因: 服务器未运行、CORS问题、网络连接问题`);
    }
    
    console.log('');
  }

  // 测试前端配置
  console.log('📋 前端配置检查:');
  console.log(`   API URL: ${process.env.REACT_APP_API_URL || '未设置'}`);
  console.log(`   当前页面: ${window.location.origin}`);
  
  // 检查CORS问题
  console.log('\n🔍 CORS问题诊断:');
  console.log('   如果看到"CORS"或"跨域"错误，请检查:');
  console.log('   1. 后端服务器是否正确配置了CORS');
  console.log('   2. 前端API_URL是否正确指向后端地址');
  console.log('   3. 是否有防火墙或代理阻止连接');
}

// 运行测试
testConnection().catch(console.error);