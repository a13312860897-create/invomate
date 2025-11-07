const http = require('http');

// 直接使用Node.js的http模块测试API
function testTaxReportAPI() {
  console.log('🔍 开始直接测试税务报告API...');
  
  // 首先登录获取token
  const loginData = JSON.stringify({
    email: 'a133128860897@163.com',
    password: '123456'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = http.request(loginOptions, (loginRes) => {
    let loginBody = '';
    
    loginRes.on('data', (chunk) => {
      loginBody += chunk;
    });
    
    loginRes.on('end', () => {
      try {
        const loginResponse = JSON.parse(loginBody);
        console.log('✅ 登录成功');
        
        const token = loginResponse.data.token;
        console.log('🔍 Token:', token);
        
        // 调用税务报告API
        const taxOptions = {
          hostname: 'localhost',
          port: 8080,
          path: '/api/reports/tax?startDate=2024-11-01&endDate=2024-11-30',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const taxReq = http.request(taxOptions, (taxRes) => {
          let taxBody = '';
          
          taxRes.on('data', (chunk) => {
            taxBody += chunk;
          });
          
          taxRes.on('end', () => {
            try {
              console.log('📋 原始响应字符串:');
              console.log(taxBody);
              console.log('\n📋 解析后的JSON:');
              const taxResponse = JSON.parse(taxBody);
              console.log(JSON.stringify(taxResponse, null, 2));
              
              // 检查Q3的taxAmount字段
              const q3Data = taxResponse.quarterlyTax.find(q => q.quarter === 'Q3 2025');
              if (q3Data) {
                console.log('\n🔍 Q3数据详情:');
                console.log('- quarter:', q3Data.quarter);
                console.log('- totalRevenue:', q3Data.totalRevenue);
                console.log('- taxAmount:', q3Data.taxAmount);
                console.log('- taxAmount类型:', typeof q3Data.taxAmount);
                console.log('- 是否有taxAmount属性:', q3Data.hasOwnProperty('taxAmount'));
              }
              
            } catch (error) {
              console.error('❌ 解析税务报告响应失败:', error.message);
              console.log('原始响应:', taxBody);
            }
          });
        });

        taxReq.on('error', (error) => {
          console.error('❌ 税务报告请求失败:', error.message);
        });

        taxReq.end();
        
      } catch (error) {
        console.error('❌ 解析登录响应失败:', error.message);
        console.log('原始响应:', loginBody);
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ 登录请求失败:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

testTaxReportAPI();