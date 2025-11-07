const axios = require('axios');

// 测试仪表板月度数据一致性
async function testDashboardMonthlyData() {
  const baseURL = 'http://localhost:3002/api'; // 修改端口为3002
  
  try {
    console.log('🔍 开始测试仪表板月度数据一致性...\n');
    
    // 1. 登录获取token
    console.log('1. 登录系统...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'a133128860897@163.com', // 使用实际存在的测试用户
      password: 'Ddtb959322' // 使用正确的密码
    });
    
    console.log('登录响应:', loginResponse.data);
    
    const token = loginResponse.data.data.token; // 修正token路径
    console.log('获取到的token:', token ? '存在' : '不存在');
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ 登录成功\n');
    
    // 2. 获取当前月份
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`📅 当前月份: ${currentMonth}\n`);
    
    // 3. 测试仪表板统计API（现在应该包含月份参数）
    console.log('2. 测试仪表板统计数据...');
    const statsResponse = await axios.get(`${baseURL}/dashboard/stats`, { 
      headers,
      timeout: 10000 // 增加超时时间
    });
    const stats = statsResponse.data;
    
    console.log('📊 仪表板统计数据:');
    console.log(`   - 总发票数: ${stats.totalInvoices}`);
    console.log(`   - 本期发票数: ${stats.thisPeriodInvoices}`);
    console.log(`   - 总收入: ¥${stats.totalRevenue}`);
    console.log(`   - 本期收入: ¥${stats.thisPeriodRevenue}`);
    console.log(`   - 待付款数量: ${stats.pendingCount}`);
    console.log(`   - 逾期数量: ${stats.overdueCount}`);
    console.log(`   - 返回的月份: ${stats.month || '未指定'}\n`);
    
    // 4. 测试发票状态分布API
    console.log('3. 测试发票状态分布数据...');
    const distributionResponse = await axios.get(`${baseURL}/dashboard/invoice-status-distribution?month=${currentMonth}`, { headers });
    const distribution = distributionResponse.data;
    
    console.log('📈 发票状态分布:');
    let distributionTotal = 0;
    distribution.distribution.forEach(item => {
      console.log(`   - ${item.status}: ${item.count}张`);
      distributionTotal += item.count;
    });
    console.log(`   - 分布总数: ${distributionTotal}张\n`);
    
    // 5. 测试发票列表API（获取本月数据）
    console.log('4. 测试发票列表数据...');
    const invoicesResponse = await axios.get(`${baseURL}/invoices?page=1&limit=100`, { headers });
    const invoices = invoicesResponse.data;
    
    console.log('发票响应数据结构:', Object.keys(invoices));
    
    // 检查数据结构并筛选本月发票
    let monthlyInvoices = [];
    if (invoices.invoices && Array.isArray(invoices.invoices)) {
      monthlyInvoices = invoices.invoices.filter(invoice => {
        if (invoice.createdAt) {
          const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
          return createdMonth === currentMonth;
        }
        return false;
      });
    } else if (invoices.data && Array.isArray(invoices.data)) {
      monthlyInvoices = invoices.data.filter(invoice => {
        if (invoice.createdAt) {
          const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
          return createdMonth === currentMonth;
        }
        return false;
      });
    }
    
    console.log('📋 发票列表数据:');
    console.log(`   - 总发票数: ${invoices.totalCount || invoices.total || '未知'}`);
    console.log(`   - 本月发票数: ${monthlyInvoices.length}`);
    console.log(`   - 分页总数: ${invoices.totalCount || invoices.total || '未知'}\n`);
    
    // 6. 测试最近发票API
    console.log('5. 测试最近发票数据...');
    const recentResponse = await axios.get(`${baseURL}/dashboard/recent-invoices?limit=5`, { headers });
    const recentInvoices = recentResponse.data.invoices;
    
    console.log('📝 最近发票:');
    console.log(`   - 最近发票数量: ${recentInvoices.length}`);
    recentInvoices.forEach((invoice, index) => {
      const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
      console.log(`   - 发票${index + 1}: ${invoice.invoiceNumber} (${createdMonth})`);
    });
    console.log('');
    
    // 7. 测试逾期发票API
    console.log('6. 测试逾期发票数据...');
    const overdueResponse = await axios.get(`${baseURL}/dashboard/overdue-invoices?limit=5`, { headers });
    const overdueInvoices = overdueResponse.data.invoices;
    
    console.log('⚠️  逾期发票:');
    console.log(`   - 逾期发票数量: ${overdueInvoices.length}`);
    overdueInvoices.forEach((invoice, index) => {
      try {
        const createdMonth = invoice.createdAt ? new Date(invoice.createdAt).toISOString().slice(0, 7) : '未知';
        console.log(`   - 逾期发票${index + 1}: ${invoice.invoiceNumber} (${createdMonth})`);
      } catch (error) {
        console.log(`   - 逾期发票${index + 1}: ${invoice.invoiceNumber} (时间格式错误)`);
      }
    });
    console.log('');
    
    // 8. 数据一致性检查
    console.log('7. 数据一致性检查...');
    console.log('🔍 检查各API返回的数据是否一致:');
    
    // 检查统计数据与分布数据的一致性
    console.log(`   - 仪表板总发票数: ${stats.totalInvoices}`);
    console.log(`   - 状态分布总数: ${distributionTotal}`);
    console.log(`   - 本月发票列表数: ${monthlyInvoices.length}`);
    
    if (stats.totalInvoices === distributionTotal && stats.totalInvoices === monthlyInvoices.length) {
      console.log('✅ 数据一致性检查通过！所有API返回的本月发票数量一致\n');
    } else {
      console.log('❌ 数据一致性检查失败！不同API返回的数量不一致\n');
    }
    
    // 9. 验证月度筛选效果
    console.log('8. 验证月度筛选效果...');
    
    // 检查最近发票是否都是本月的
    const recentMonthlyCount = recentInvoices.filter(invoice => {
      const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
      return createdMonth === currentMonth;
    }).length;
    
    console.log(`   - 最近发票中本月发票数: ${recentMonthlyCount}/${recentInvoices.length}`);
    
    // 检查逾期发票是否都是本月的
    const overdueMonthlyCount = overdueInvoices.filter(invoice => {
      try {
        if (!invoice.createdAt) return false;
        const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
        return createdMonth === currentMonth;
      } catch (error) {
        return false;
      }
    }).length;
    
    console.log(`   - 逾期发票中本月发票数: ${overdueMonthlyCount}/${overdueInvoices.length}`);
    
    if (recentMonthlyCount === recentInvoices.length && overdueMonthlyCount === overdueInvoices.length) {
      console.log('✅ 月度筛选效果验证通过！所有API都正确筛选了本月数据\n');
    } else {
      console.log('⚠️  月度筛选效果需要确认，部分API可能包含其他月份的数据\n');
    }
    
    console.log('🎉 仪表板月度数据一致性测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testDashboardMonthlyData();