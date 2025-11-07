const axios = require('axios');

async function testInvoiceStatusFix() {
  try {
    console.log('=== 测试 Invoice Status 修复效果 ===');
    
    // 1. 登录获取token
    console.log('\n1. 登录...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✓ 登录成功');
      const token = loginResponse.data.data.token;
      
      // 2. 调用 Invoice Status Overview API
      console.log('\n2. 调用 Invoice Status Overview API...');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const apiResponse = await axios.get('http://localhost:8080/api/reports/invoice-status-overview', {
        headers
      });
      
      console.log('✓ API调用成功');
      const data = apiResponse.data;
      
      // 3. 验证数据结构
      console.log('\n=== 数据验证 ===');
      
      // Status Distribution 数据
      console.log('\n📊 Status Distribution:');
      if (data.statusBreakdown && Array.isArray(data.statusBreakdown)) {
        console.log(`✓ statusBreakdown 存在，包含 ${data.statusBreakdown.length} 个状态`);
        data.statusBreakdown.forEach(status => {
          if (status.count > 0) {
            console.log(`  - ${status.status}: ${status.count} 个发票, €${status.amount}, ${status.percentage.toFixed(1)}%`);
          }
        });
      } else {
        console.log('✗ statusBreakdown 不存在或格式错误');
      }
      
      // Monthly Trends 数据
      console.log('\n📈 Monthly Trends:');
      if (data.monthlyTrends && Array.isArray(data.monthlyTrends)) {
        console.log(`✓ monthlyTrends 存在，包含 ${data.monthlyTrends.length} 个月份`);
        const hasData = data.monthlyTrends.some(month => {
          return Object.values(month).some(value => 
            typeof value === 'object' && value.count > 0
          );
        });
        console.log(`  - 是否有实际数据: ${hasData ? '是' : '否'}`);
        
        // 显示有数据的月份
        data.monthlyTrends.forEach(month => {
          const monthHasData = Object.entries(month).some(([key, value]) => 
            key !== 'month' && typeof value === 'object' && value.count > 0
          );
          if (monthHasData) {
            console.log(`  - ${month.month}: 有数据`);
          }
        });
      } else {
        console.log('✗ monthlyTrends 不存在或格式错误');
      }
      
      // Summary 数据
      console.log('\n📋 Summary:');
      if (data.summary) {
        console.log(`✓ summary 存在`);
        console.log(`  - 总发票数: ${data.summary.totalInvoices}`);
        console.log(`  - 总金额: €${data.summary.totalAmount}`);
        console.log(`  - 收款率: ${data.summary.collectionRate}%`);
        console.log(`  - 平均处理时间: ${data.summary.avgProcessingTime} 天`);
      } else {
        console.log('✗ summary 不存在');
      }
      
      // 4. 模拟前端数据处理
      console.log('\n=== 模拟前端数据处理 ===');
      
      // 模拟 reportService.getInvoiceStatusOverview 的返回值
      const frontendData = {
        summary: data.summary || {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          overdue: 0,
          cancelled: 0
        },
        statusBreakdown: data.statusBreakdown || [],
        monthlyTrends: data.monthlyTrends || [],
        statusDetails: data.statusBreakdown || []
      };
      
      console.log('前端接收到的数据结构:');
      console.log(`- statusBreakdown: ${frontendData.statusBreakdown.length > 0 ? '有数据' : '无数据'}`);
      console.log(`- monthlyTrends: ${frontendData.monthlyTrends.length > 0 ? '有数据' : '无数据'}`);
      console.log(`- summary: ${frontendData.summary ? '有数据' : '无数据'}`);
      
      // 5. 检查前端显示逻辑
      console.log('\n=== 前端显示逻辑检查 ===');
      
      // Status Distribution 显示检查
      const statusDistributionCheck = frontendData.statusBreakdown?.length > 0;
      console.log(`Status Distribution 显示: ${statusDistributionCheck ? '✓ 应该显示数据' : '✗ 会显示 No data available'}`);
      
      // Monthly Trends 显示检查
      const monthlyTrendsCheck = frontendData.monthlyTrends?.length > 0;
      console.log(`Monthly Trends 显示: ${monthlyTrendsCheck ? '✓ 应该显示数据' : '✗ 会显示 No data available'}`);
      
      // Status Breakdown 表格显示检查
      const statusBreakdownTableCheck = frontendData.statusBreakdown && typeof frontendData.statusBreakdown === 'object';
      console.log(`Status Breakdown 表格显示: ${statusBreakdownTableCheck ? '✓ 应该显示数据' : '✗ 会显示 No data available'}`);
      
      console.log('\n=== 修复结果 ===');
      if (statusDistributionCheck && monthlyTrendsCheck && statusBreakdownTableCheck) {
        console.log('🎉 修复成功！所有数据都应该正常显示');
      } else {
        console.log('⚠️  仍有问题需要解决');
      }
      
    } else {
      console.log('✗ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testInvoiceStatusFix();