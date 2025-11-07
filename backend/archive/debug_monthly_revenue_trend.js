const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// 测试用户凭据
const testUser = {
  email: 'a133128860897@163.com',
  password: 'Ddtb959322'
};

async function debugMonthlyRevenueTrend() {
  try {
    console.log('=== 本月收入趋势API调试 ===\n');

    // 1. 登录获取token
    console.log('1. 登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');

    // 设置请求头
    const headers = { Authorization: `Bearer ${token}` };

    // 2. 调用本月收入趋势API
    console.log('\n2. 调用本月收入趋势API...');
    const trendResponse = await axios.get(`${BASE_URL}/dashboard/monthly-revenue-trend`, { headers });
    
    console.log('API响应结构:');
    console.log('- month:', trendResponse.data.month);
    console.log('- totalRevenue:', trendResponse.data.totalRevenue);
    console.log('- totalCount:', trendResponse.data.totalCount);
    console.log('- chartData length:', trendResponse.data.chartData?.length);
    
    if (trendResponse.data.chartData && trendResponse.data.chartData.length > 0) {
      console.log('\n图表数据详情:');
      trendResponse.data.chartData.forEach((item, index) => {
        console.log(`节点 ${index + 1}: ${item.period} - 收入: ${item.revenue}€, 发票数: ${item.count}`);
      });
    }

    // 3. 获取所有发票进行验证
    console.log('\n3. 获取所有发票进行验证...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, { headers });
    const allInvoices = invoicesResponse.data.data.invoices || [];
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('当前月份:', currentMonth);
    
    // 筛选本月已支付的发票
    const thisMonthPaidInvoices = allInvoices.filter(inv => {
      if (inv.status !== 'paid') return false;
      
      // 检查支付日期
      if (inv.paidDate) {
        const paidMonth = new Date(inv.paidDate).toISOString().slice(0, 7);
        return paidMonth === currentMonth;
      }
      
      // 如果没有支付日期，使用更新日期
      if (inv.updatedAt) {
        const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
        return updatedMonth === currentMonth;
      }
      
      return false;
    });
    
    console.log(`\n本月已支付发票验证:`);
    console.log(`- 总发票数: ${allInvoices.length}`);
    console.log(`- 本月已支付发票数: ${thisMonthPaidInvoices.length}`);
    
    if (thisMonthPaidInvoices.length > 0) {
      const manualTotalRevenue = thisMonthPaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      console.log(`- 手动计算总收入: ${manualTotalRevenue}€`);
      console.log(`- API返回总收入: ${trendResponse.data.totalRevenue}€`);
      console.log(`- 收入匹配: ${manualTotalRevenue === trendResponse.data.totalRevenue ? '✓' : '✗'}`);
      
      console.log('\n本月已支付发票详情:');
      thisMonthPaidInvoices.forEach((inv, index) => {
        console.log(`${index + 1}. ID: ${inv.id}, 金额: ${inv.total}€, 支付日期: ${inv.paidDate || inv.updatedAt}, 状态: ${inv.status}`);
      });
    }

    // 4. 检查数据一致性
    console.log('\n4. 数据一致性检查:');
    const apiTotalRevenue = trendResponse.data.totalRevenue;
    const apiTotalCount = trendResponse.data.totalCount;
    const chartTotalRevenue = trendResponse.data.chartData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
    const chartTotalCount = trendResponse.data.chartData?.reduce((sum, item) => sum + item.count, 0) || 0;
    
    console.log(`- API总收入 vs 图表数据总收入: ${apiTotalRevenue} vs ${chartTotalRevenue} ${apiTotalRevenue === chartTotalRevenue ? '✓' : '✗'}`);
    console.log(`- API总数量 vs 图表数据总数量: ${apiTotalCount} vs ${chartTotalCount} ${apiTotalCount === chartTotalCount ? '✓' : '✗'}`);

    // 5. 调用统一图表数据API进行对比
    console.log('\n5. 调用统一图表数据API进行对比...');
    try {
      const unifiedResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data`, { 
        headers,
        params: { month: currentMonth }
      });
      
      if (unifiedResponse.data.success) {
        const unifiedData = unifiedResponse.data.data.revenueTrend;
        console.log('统一API数据:');
        console.log(`- 总收入: ${unifiedData.totalRevenue}€`);
        console.log(`- 总数量: ${unifiedData.totalCount}`);
        console.log(`- 数据点数量: ${unifiedData.timePoints?.length}`);
        
        console.log('\n两个API数据对比:');
        console.log(`- 收入匹配: ${apiTotalRevenue === unifiedData.totalRevenue ? '✓' : '✗'} (${apiTotalRevenue} vs ${unifiedData.totalRevenue})`);
        console.log(`- 数量匹配: ${apiTotalCount === unifiedData.totalCount ? '✓' : '✗'} (${apiTotalCount} vs ${unifiedData.totalCount})`);
      }
    } catch (unifiedError) {
      console.log('统一API调用失败:', unifiedError.response?.data?.message || unifiedError.message);
    }

  } catch (error) {
    console.error('调试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('HTTP状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('完整错误对象:', error);
    console.error('错误堆栈:', error.stack);
  }
}

debugMonthlyRevenueTrend();