const axios = require('axios');

// 调试统一图表数据API的详细逻辑
async function debugUnifiedAPI() {
  try {
    const BASE_URL = 'http://localhost:3002/api';
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    console.log('=== 统一图表数据API调试 ===');
    console.log('当前月份:', currentMonth);
    
    // 1. 登录获取token
    console.log('\n1. 登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: 'Ddtb959322'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('登录成功，获取到token');
    
    // 2. 调用统一图表数据API
    console.log('\n2. 调用统一图表数据API...');
    const unifiedResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data`, { 
      headers,
      params: { month: currentMonth }
    });
    
    console.log('API响应结构:');
    console.log('- success:', unifiedResponse.data.success);
    if (unifiedResponse.data.success) {
      const { revenueTrend, statusDistribution, monthInfo } = unifiedResponse.data.data;
      console.log('- 收入趋势总收入:', revenueTrend.totalRevenue);
      console.log('- 收入趋势总数量:', revenueTrend.totalCount);
      console.log('- 时间点数量:', revenueTrend.timePoints.length);
      console.log('- 状态分布总发票数:', statusDistribution.totalInvoices);
      console.log('- 月份信息:', monthInfo.month);
      
      console.log('\n收入趋势时间点详情:');
      revenueTrend.timePoints.forEach((point, index) => {
        console.log(`节点 ${index + 1}: ${point.label} - 收入: ${point.revenue}€, 发票数: ${point.count}`);
      });
      
      console.log('\n状态分布详情:');
      statusDistribution.distribution.forEach(item => {
        console.log(`- ${item.label}: ${item.count} 张, ${item.amount}€`);
      });
    }
    
    // 3. 获取所有发票进行验证
    console.log('\n3. 获取所有发票进行验证...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, { headers });
    
    console.log('发票API响应状态:', invoicesResponse.status);
    console.log('发票API响应结构:', Object.keys(invoicesResponse.data));
    
    if (invoicesResponse.data.success && invoicesResponse.data.data && invoicesResponse.data.data.invoices) {
      const allInvoices = invoicesResponse.data.data.invoices;
      console.log('总发票数:', allInvoices.length);
      
      // 筛选本月已支付发票（使用支付日期）
      const thisMonthPaidInvoices = allInvoices.filter(inv => {
        if (inv.status !== 'paid') return false;
        
        // 检查支付日期
        if (inv.paidDate) {
          const paidMonth = new Date(inv.paidDate).toISOString().slice(0, 7);
          return paidMonth === currentMonth;
        }
        
        // 如果没有支付日期，使用更新日期作为备选
        if (inv.updatedAt) {
          const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
          return updatedMonth === currentMonth;
        }
        
        return false;
      });
      
      console.log('\n本月已支付发票验证（使用支付日期筛选）:');
      console.log('- 本月已支付发票数:', thisMonthPaidInvoices.length);
      const manualTotalRevenue = thisMonthPaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      console.log('- 手动计算总收入:', manualTotalRevenue + '€');
      
      console.log('\n本月已支付发票详情:');
      thisMonthPaidInvoices.forEach((inv, index) => {
        console.log(`${index + 1}. ID: ${inv.id}, 金额: ${inv.total}€, 支付日期: ${inv.paidDate || inv.updatedAt}, 状态: ${inv.status}`);
      });
      
      // 筛选本月所有发票（使用创建日期）
      const thisMonthAllInvoices = allInvoices.filter(inv => {
        if (!inv.createdAt) return false;
        const createdMonth = new Date(inv.createdAt).toISOString().slice(0, 7);
        return createdMonth === currentMonth;
      });
      
      console.log('\n本月所有发票验证（使用创建日期筛选）:');
      console.log('- 本月所有发票数:', thisMonthAllInvoices.length);
      
      console.log('\n本月所有发票详情:');
      thisMonthAllInvoices.forEach((inv, index) => {
        console.log(`${index + 1}. ID: ${inv.id}, 金额: ${inv.total}€, 状态: ${inv.status}, 创建日期: ${inv.createdAt}, 支付日期: ${inv.paidDate || 'N/A'}`);
      });
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

debugUnifiedAPI();