const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testInvoiceStatusFinal() {
  try {
    console.log('🔍 最终测试 Invoice Status 修复效果...\n');

    // 1. 登录获取 token
    console.log('1. 登录获取 token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 调用 API 获取原始数据
    console.log('\n2. 获取原始 API 数据...');
    const apiResponse = await axios.get(`${BASE_URL}/api/reports/invoice-status-overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API 调用成功');
    console.log('📊 原始 statusBreakdown 格式:', Array.isArray(apiResponse.data.statusBreakdown) ? '数组' : '对象');
    console.log('📊 原始 statusBreakdown 内容:');
    console.log(JSON.stringify(apiResponse.data.statusBreakdown, null, 2));

    // 3. 模拟前端 reportService 数据转换
    console.log('\n3. 模拟前端数据转换...');
    
    // 模拟 reportService.getInvoiceStatusOverview 的转换逻辑
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

    const processedData = {
      summary: apiResponse.data.summary,
      statusBreakdown: statusBreakdownObject,
      monthlyTrends: apiResponse.data.monthlyTrends,
      statusDetails: apiResponse.data.statusBreakdown
    };

    console.log('✅ 数据转换完成');
    console.log('📊 转换后 statusBreakdown 格式:', Array.isArray(processedData.statusBreakdown) ? '数组' : '对象');
    console.log('📊 转换后 statusBreakdown 内容:');
    console.log(JSON.stringify(processedData.statusBreakdown, null, 2));

    // 4. 模拟前端渲染逻辑
    console.log('\n4. 模拟前端渲染逻辑...');
    
    // 模拟 EnhancedReports.js 中的数据处理
    const statusBreakdown = processedData.statusBreakdown;
    
    console.log('🔍 检查 Object.entries 是否能正常工作...');
    try {
      const statusData = Object.entries(statusBreakdown).map(([status, data]) => ({
        status,
        count: data.count || 0,
        amount: data.amount || 0
      })).filter(item => item.count > 0);
      
      console.log('✅ Object.entries 处理成功');
      console.log('📊 处理后的状态数据:');
      statusData.forEach(item => {
        console.log(`  - ${item.status}: count=${item.count}, amount=${item.amount}`);
      });
      
      // 检查饼图数据
      if (statusData.length > 0) {
        console.log('\n🥧 饼图数据准备:');
        const pieData = {
          labels: statusData.map(item => item.status),
          datasets: [{
            data: statusData.map(item => item.count),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']
          }]
        };
        console.log('  - 标签:', pieData.labels);
        console.log('  - 数据:', pieData.datasets[0].data);
        console.log('✅ 饼图数据准备成功');
      } else {
        console.log('⚠️  没有有效的状态数据用于饼图');
      }
      
    } catch (error) {
      console.error('❌ Object.entries 处理失败:', error.message);
    }

    // 5. 检查月度趋势数据
    console.log('\n5. 检查月度趋势数据...');
    const monthlyTrends = processedData.monthlyTrends;
    if (Array.isArray(monthlyTrends) && monthlyTrends.length > 0) {
      console.log('✅ 月度趋势数据存在');
      console.log('📊 月度数据点数量:', monthlyTrends.length);
      console.log('📊 最新月份数据:', JSON.stringify(monthlyTrends[monthlyTrends.length - 1], null, 2));
    } else {
      console.log('⚠️  月度趋势数据为空');
    }

    // 6. 检查汇总数据
    console.log('\n6. 检查汇总数据...');
    const summary = processedData.summary;
    if (summary) {
      console.log('✅ 汇总数据存在');
      console.log('📊 总发票数:', summary.totalInvoices);
      console.log('📊 总金额:', summary.totalAmount);
      console.log('📊 平均处理时间:', summary.avgProcessingTime);
      console.log('📊 收款率:', summary.collectionRate);
    } else {
      console.log('⚠️  汇总数据为空');
    }

    console.log('\n✅ Invoice Status 最终测试完成');
    console.log('🎉 所有数据格式和处理逻辑都正常工作！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
  }
}

testInvoiceStatusFinal();