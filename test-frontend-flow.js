const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testFrontendFlow() {
  try {
    console.log('🔍 测试前端数据获取流程...\n');

    // 1. 模拟前端登录
    console.log('1️⃣ 模拟前端登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，token长度:', token.length);

    // 2. 模拟前端日期计算（当前月份）
    const now = new Date();
    const selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    
    console.log('📅 计算的日期范围:');
    console.log('  - selectedMonth:', selectedMonth);
    console.log('  - startDate:', startDate);
    console.log('  - endDate:', endDate);

    // 3. 模拟前端API调用
    console.log('\n2️⃣ 模拟前端API调用...');
    
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/reports/invoice-status-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          startDate,
          endDate
        }
      });

      console.log('✅ API调用成功');
      console.log('📊 响应状态:', statusResponse.status);
      console.log('📊 响应数据:', JSON.stringify(statusResponse.data, null, 2));

      // 4. 模拟前端数据处理（reportService.js的逻辑）
      console.log('\n3️⃣ 模拟前端数据处理...');
      
      const rawData = statusResponse.data;
      
      // 模拟reportService.js中的数据转换
      const statusBreakdownArray = rawData.statusBreakdown || [];
      const statusBreakdownObject = {};
      
      statusBreakdownArray.forEach((item, index) => {
        statusBreakdownObject[index] = {
          count: item.count || 0,
          amount: item.amount || 0,
          status: item.status,
          percentage: item.percentage || 0
        };
      });

      const processedData = {
        summary: rawData.summary || {},
        statusBreakdown: statusBreakdownObject,
        monthlyTrends: rawData.monthlyTrends || []
      };

      console.log('📊 处理后的数据:');
      console.log('  - summary:', processedData.summary);
      console.log('  - statusBreakdown:', processedData.statusBreakdown);
      console.log('  - monthlyTrends length:', processedData.monthlyTrends.length);

      // 5. 模拟前端渲染逻辑
      console.log('\n4️⃣ 模拟前端渲染逻辑...');
      
      const invoiceStatusReport = processedData;
      
      // 检查数据是否存在
      if (!invoiceStatusReport?.statusBreakdown || typeof invoiceStatusReport.statusBreakdown !== 'object') {
        console.log('❌ statusBreakdown数据不存在或格式错误');
        console.log('  - statusBreakdown:', invoiceStatusReport?.statusBreakdown);
        console.log('  - 类型:', typeof invoiceStatusReport?.statusBreakdown);
        return;
      }

      const statusBreakdown = invoiceStatusReport.statusBreakdown;
      
      // 转换对象格式为数组格式
      const statusData = Object.entries(statusBreakdown).map(([key, data]) => ({
        status: data.status || key,
        count: data.count || 0,
        amount: data.amount || 0
      })).filter(item => item.count > 0);
      
      console.log('📊 处理后的状态数据:', statusData);
      
      if (statusData.length === 0) {
        console.log('⚠️ 过滤后没有数据，这就是为什么显示"No status data available"');
        
        // 检查原始数据
        console.log('\n🔍 检查原始数据:');
        Object.entries(statusBreakdown).forEach(([key, data]) => {
          console.log(`  - ${key}:`, data, `count=${data.count}, 是否>0:`, data.count > 0);
        });
        
        return;
      }
      
      const labels = statusData.map(item => item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown');
      const data = statusData.map(item => item.count || 0);
      
      console.log('🏷️ 最终标签:', labels);
      console.log('📈 最终数据:', data);
      console.log('✅ 前端渲染应该正常显示');

    } catch (apiError) {
      console.error('❌ API调用失败:', apiError.message);
      if (apiError.response) {
        console.error('📄 错误响应:', apiError.response.status, apiError.response.data);
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
  }
}

testFrontendFlow();