const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testStatusLabels() {
  try {
    console.log('🔍 测试状态标签修复效果...\n');

    // 1. 登录获取 token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 获取 API 数据
    const apiResponse = await axios.get(`${BASE_URL}/api/reports/invoice-status-overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 3. 模拟前端数据转换（修复后的版本）
    const statusBreakdownArray = apiResponse.data.statusBreakdown || [];
    const statusBreakdownObject = {};
    
    statusBreakdownArray.forEach((item, index) => {
      statusBreakdownObject[index] = {
        count: item.count || 0,
        amount: item.amount || 0,
        status: item.status,
        percentage: item.percentage || 0
      };
    });

    console.log('📊 转换后的 statusBreakdown:');
    console.log(JSON.stringify(statusBreakdownObject, null, 2));

    // 4. 模拟前端渲染逻辑（修复后的版本）
    console.log('\n🎨 模拟前端渲染逻辑...');
    
    const statusBreakdown = statusBreakdownObject;
    
    // 使用修复后的代码：data.status 而不是键名
    const statusData = Object.entries(statusBreakdown).map(([key, data]) => ({
      status: data.status || key, // 使用data.status而不是键名
      count: data.count || 0,
      amount: data.amount || 0
    })).filter(item => item.count > 0);
    
    console.log('📊 处理后的状态数据:');
    statusData.forEach(item => {
      console.log(`  - ${item.status}: count=${item.count}, amount=${item.amount}`);
    });
    
    // 5. 生成饼图数据
    if (statusData.length > 0) {
      console.log('\n🥧 饼图数据:');
      const labels = statusData.map(item => item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown');
      const data = statusData.map(item => item.count || 0);
      
      console.log('  - 标签:', labels);
      console.log('  - 数据:', data);
      
      // 验证标签是否正确
      const expectedStatuses = ['Sent', 'Paid', 'Overdue'];
      const hasCorrectLabels = labels.every(label => expectedStatuses.includes(label));
      
      if (hasCorrectLabels) {
        console.log('✅ 状态标签显示正确！');
      } else {
        console.log('⚠️  状态标签可能有问题');
        console.log('  期望的标签:', expectedStatuses);
        console.log('  实际的标签:', labels);
      }
    }

    console.log('\n✅ 状态标签测试完成');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
  }
}

testStatusLabels();