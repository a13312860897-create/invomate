const axios = require('axios');

async function testInvoiceStatusDisplay() {
  console.log('🎯 测试Invoice Status显示...');
  
  try {
    // 1. 登录获取token
    console.log('1️⃣ 登录...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data?.token;
    if (!token) {
      console.log('❌ 登录失败，未获取到token');
      console.log('登录响应:', loginResponse.data);
      return;
    }
    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...');
    
    // 2. 获取当前月份的Invoice Status数据
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    console.log('2️⃣ 获取Invoice Status数据...');
    console.log('📅 日期范围:', { startDate, endDate });
    
    const statusResponse = await axios.get('http://localhost:8080/api/reports/invoice-status-overview', {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const statusData = statusResponse.data;
    console.log('📊 API返回的原始数据:', JSON.stringify(statusData, null, 2));
    
    // 3. 模拟前端数据处理逻辑
    console.log('3️⃣ 模拟前端数据处理...');
    
    // 检查statusBreakdown
    if (!statusData.statusBreakdown || !Array.isArray(statusData.statusBreakdown)) {
      console.log('❌ statusBreakdown不是数组或为空');
      return;
    }
    
    console.log('📊 statusBreakdown长度:', statusData.statusBreakdown.length);
    console.log('📊 statusBreakdown内容:');
    statusData.statusBreakdown.forEach((item, index) => {
      console.log(`  ${index}: ${item.status} - count=${item.count}, amount=${item.amount}`);
    });
    
    // 4. 模拟前端渲染逻辑
    console.log('4️⃣ 模拟前端渲染逻辑...');
    
    // 过滤掉count为0的状态
    const filteredStatusData = statusData.statusBreakdown.filter(item => item.count > 0);
    console.log('📊 过滤后的状态数据:');
    filteredStatusData.forEach(item => {
      console.log(`  - ${item.status}: count=${item.count}, amount=${item.amount}`);
    });
    
    if (filteredStatusData.length === 0) {
      console.log('❌ 过滤后没有数据，会显示"No status data available"');
      return;
    }
    
    // 生成图表数据
    const labels = filteredStatusData.map(item => {
      const statusLabels = {
        'draft': 'Draft',
        'sent': 'Sent', 
        'paid': 'Paid',
        'overdue': 'Overdue',
        'cancelled': 'Cancelled'
      };
      return statusLabels[item.status] || item.status;
    });
    
    const data = filteredStatusData.map(item => item.count);
    
    console.log('📈 最终图表数据:');
    console.log('  - 标签:', labels);
    console.log('  - 数据:', data);
    
    if (labels.length > 0 && data.length > 0) {
      console.log('✅ 应该正常显示饼图');
    } else {
      console.log('❌ 图表数据为空，会显示"No status data available"');
    }
    
    console.log('🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('❌ 响应数据:', error.response.data);
    }
  }
}

testInvoiceStatusDisplay();