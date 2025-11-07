// 测试图表API对十月份数据的响应
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';
const TEST_TOKEN = 'dev-mock-token'; // 开发模式下的测试token

async function testChartAPIs() {
  try {
    console.log('🧪 开始测试图表API对十月份数据的响应...\n');
    
    const headers = {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // 1. 测试仪表板API - 获取当前月份数据
    console.log('📊 测试仪表板API...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboard`, { headers });
      console.log('✅ 仪表板API响应成功');
      console.log('📈 仪表板数据:', JSON.stringify(dashboardResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 仪表板API失败:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试月度收入趋势API
    console.log('📈 测试月度收入趋势API...');
    try {
      const revenueResponse = await axios.get(`${API_BASE_URL}/api/dashboard/monthly-revenue-trend`, { headers });
      console.log('✅ 月度收入趋势API响应成功');
      console.log('📊 收入趋势数据:', JSON.stringify(revenueResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 月度收入趋势API失败:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 测试发票列表API - 获取十月份发票
    console.log('📋 测试发票列表API...');
    try {
      const invoicesResponse = await axios.get(`${API_BASE_URL}/api/invoices`, { headers });
      console.log('✅ 发票列表API响应成功');
      console.log('📄 发票列表数据:');
      
      if (invoicesResponse.data.invoices && invoicesResponse.data.invoices.length > 0) {
        invoicesResponse.data.invoices.forEach(invoice => {
          console.log(`  - ${invoice.invoiceNumber}: ${invoice.issueDate} - €${invoice.totalAmount} (${invoice.status})`);
        });
        console.log(`\n总计: ${invoicesResponse.data.invoices.length} 张发票`);
        console.log(`总金额: €${invoicesResponse.data.invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)}`);
      } else {
        console.log('  没有找到发票数据');
      }
    } catch (error) {
      console.log('❌ 发票列表API失败:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. 测试特定月份的数据过滤
    console.log('🗓️ 测试十月份数据过滤...');
    try {
      const octoberResponse = await axios.get(`${API_BASE_URL}/api/invoices?month=2025-10`, { headers });
      console.log('✅ 十月份数据过滤API响应成功');
      console.log('📅 十月份发票数据:', JSON.stringify(octoberResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 十月份数据过滤API失败:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. 测试统计API
    console.log('📊 测试统计API...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, { headers });
      console.log('✅ 统计API响应成功');
      console.log('📈 统计数据:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 统计API失败:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 图表API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testChartAPIs();