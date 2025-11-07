const axios = require('axios');

// 分析所有数据源和API的数据逻辑
async function analyzeDataSources() {
  try {
    const BASE_URL = 'http://localhost:3002/api';
    
    console.log('=== 数据源分析 ===');
    
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
    console.log('登录成功');
    
    // 2. 获取所有发票数据
    console.log('\n2. 获取所有发票数据...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, { headers });
    const allInvoices = invoicesResponse.data.data.invoices || invoicesResponse.data.data || [];
    
    console.log(`总发票数量: ${allInvoices.length}`);
    
    // 3. 分析9月份发票
    const currentMonth = '2025-09';
    console.log(`\n3. 分析${currentMonth}的发票:`);
    
    const septemberInvoices = allInvoices.filter(inv => {
      const createdMonth = new Date(inv.createdAt).toISOString().slice(0, 7);
      return createdMonth === currentMonth;
    });
    
    console.log(`9月份创建的发票数量: ${septemberInvoices.length}`);
    
    // 按状态分组
    const statusGroups = {};
    septemberInvoices.forEach(inv => {
      if (!statusGroups[inv.status]) {
        statusGroups[inv.status] = [];
      }
      statusGroups[inv.status].push(inv);
    });
    
    console.log('\n按状态分组:');
    Object.keys(statusGroups).forEach(status => {
      const invoices = statusGroups[status];
      const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      console.log(`  ${status}: ${invoices.length}张, 总金额: ${totalAmount}€`);
    });
    
    // 4. 分析已支付发票的支付日期
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    console.log(`\n4. 所有已支付发票分析 (总共${paidInvoices.length}张):`);
    
    const paidByMonth = {};
    paidInvoices.forEach(inv => {
      let paidMonth = 'unknown';
      if (inv.paidDate) {
        paidMonth = new Date(inv.paidDate).toISOString().slice(0, 7);
      } else if (inv.updatedAt) {
        paidMonth = new Date(inv.updatedAt).toISOString().slice(0, 7) + '(updatedAt)';
      }
      
      if (!paidByMonth[paidMonth]) {
        paidByMonth[paidMonth] = [];
      }
      paidByMonth[paidMonth].push(inv);
    });
    
    console.log('按支付月份分组:');
    Object.keys(paidByMonth).sort().forEach(month => {
      const invoices = paidByMonth[month];
      const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      console.log(`  ${month}: ${invoices.length}张, 总金额: ${totalAmount}€`);
    });
    
    // 5. 调用状态分布API
    console.log('\n5. 调用状态分布API...');
    const unifiedResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data`, { headers });
    const statusDistribution = unifiedResponse.data.data.statusDistribution;
    
    console.log('状态分布API结果:');
    statusDistribution.distribution.forEach(item => {
      console.log(`  ${item.label}(${item.status}): ${item.count}张, ${item.amount}€`);
    });
    console.log(`  总发票数: ${statusDistribution.totalInvoices}张`);
    
    // 6. 调用收入趋势API
    console.log('\n6. 调用收入趋势API...');
    const revenueResponse = await axios.get(`${BASE_URL}/dashboard/monthly-revenue-trend`, { headers });
    
    console.log('收入趋势API结果:');
    console.log(`  总收入: ${revenueResponse.data.totalRevenue}€`);
    console.log(`  总数量: ${revenueResponse.data.totalCount}张`);
    console.log(`  月份: ${revenueResponse.data.month}`);
    
    // 7. 数据一致性检查
    console.log('\n7. 数据一致性检查:');
    
    const septemberPaidCount = septemberInvoices.filter(inv => inv.status === 'paid').length;
    const septemberPaidAmount = septemberInvoices.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    
    const currentMonthPaidFromAPI = paidByMonth[currentMonth] || [];
    const currentMonthPaidCount = currentMonthPaidFromAPI.length;
    const currentMonthPaidAmount = currentMonthPaidFromAPI.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    
    console.log(`9月创建的已支付发票: ${septemberPaidCount}张, ${septemberPaidAmount}€`);
    console.log(`9月支付的发票: ${currentMonthPaidCount}张, ${currentMonthPaidAmount}€`);
    console.log(`状态分布API显示已支付: ${statusDistribution.distribution.find(d => d.status === 'paid')?.count || 0}张, ${statusDistribution.distribution.find(d => d.status === 'paid')?.amount || 0}€`);
    console.log(`收入趋势API显示: ${revenueResponse.data.totalCount}张, ${revenueResponse.data.totalRevenue}€`);
    
    // 8. 问题总结
    console.log('\n8. 问题总结:');
    console.log('- 状态分布API统计的是所有发票（不限月份）');
    console.log('- 收入趋势API统计的是本月支付的发票');
    console.log('- 两个API的统计维度不同，导致数据不一致');
    
  } catch (error) {
    console.error('分析失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

analyzeDataSources();