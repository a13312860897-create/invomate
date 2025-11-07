const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testFinalInvoiceStatus() {
  try {
    console.log('🎯 最终Invoice Status测试...\n');

    // 1. 登录
    console.log('1️⃣ 登录测试...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 获取当前月份的Invoice Status数据
    console.log('\n2️⃣ 获取Invoice Status数据...');
    const now = new Date();
    const selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    
    console.log('📅 查询日期范围:', { startDate, endDate });

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
    const rawData = statusResponse.data;

    // 3. 验证数据结构
    console.log('\n3️⃣ 验证数据结构...');
    console.log('📊 Summary:', rawData.summary);
    console.log('📊 StatusBreakdown类型:', typeof rawData.statusBreakdown);
    console.log('📊 StatusBreakdown是否为数组:', Array.isArray(rawData.statusBreakdown));
    console.log('📊 StatusBreakdown长度:', rawData.statusBreakdown?.length);
    console.log('📊 MonthlyTrends长度:', rawData.monthlyTrends?.length);

    // 4. 模拟前端数据转换
    console.log('\n4️⃣ 模拟前端数据转换...');
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

    console.log('📊 转换后的statusBreakdown:');
    Object.entries(statusBreakdownObject).forEach(([key, data]) => {
      console.log(`  ${key}: ${data.status} - count=${data.count}, amount=${data.amount}`);
    });

    // 5. 模拟前端渲染逻辑
    console.log('\n5️⃣ 模拟前端渲染逻辑...');
    
    const statusData = Object.entries(statusBreakdownObject).map(([key, data]) => ({
      status: data.status || key,
      count: data.count || 0,
      amount: data.amount || 0
    })).filter(item => item.count > 0);
    
    console.log('📊 过滤后的状态数据:');
    statusData.forEach(item => {
      console.log(`  - ${item.status}: count=${item.count}, amount=${item.amount}`);
    });

    // 6. 检查是否会显示"No status data available"
    if (statusData.length === 0) {
      console.log('❌ 会显示"No status data available"');
      console.log('🔍 原因分析:');
      console.log('  - 所有状态的count都为0');
      console.log('  - 过滤条件 item.count > 0 导致数组为空');
    } else {
      console.log('✅ 应该正常显示数据');
      
      // 7. 生成最终的图表数据
      const labels = statusData.map(item => item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown');
      const data = statusData.map(item => item.count || 0);
      
      console.log('\n6️⃣ 最终图表数据:');
      console.log('🏷️ 标签:', labels);
      console.log('📈 数据:', data);
      
      // 8. 验证汇总数据
      console.log('\n7️⃣ 汇总数据验证:');
      console.log('📊 总发票数:', rawData.summary?.totalInvoices || 0);
      console.log('💰 总金额:', rawData.summary?.totalAmount || 0);
      console.log('⏱️ 平均处理时间:', rawData.summary?.avgProcessingTime || 0);
      console.log('💳 收款率:', rawData.summary?.collectionRate || 0);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
  }
}

testFinalInvoiceStatus();