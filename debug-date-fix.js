const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugDateFix() {
  console.log('🔍 调试修复后的日期比较逻辑\n');

  try {
    // 1. 登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    }, {
      headers: {
        'Authorization': 'dev-mock-token'
      }
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    // 2. 获取发票数据
    console.log('2. 获取发票数据...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
      headers: {
        'Authorization': 'dev-mock-token'
      }
    });
    
    const invoices = invoicesResponse.data.data.invoices;
    console.log(`📋 发票总数: ${invoices.length}`);
    
    // 显示已支付发票的详细信息
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    console.log(`💰 已支付发票数: ${paidInvoices.length}`);
    
    paidInvoices.forEach(inv => {
      console.log(`  - 发票 ${inv.id}: 支付日期=${inv.paidDate}, 金额=${inv.total || inv.totalAmount}`);
    });
    console.log();

    // 3. 测试特定日期范围
    console.log('3. 测试10月31日的日期范围...');
    
    // 测试包含10月31日的请求
    const testParams = {
      startDate: '2025-10-31',
      endDate: '2025-10-31',
      groupBy: 'day',
      nodeCount: 1
    };
    
    console.log('📅 请求参数:', testParams);
    
    const revenueResponse = await axios.get(`${BASE_URL}/reports/revenue`, {
      headers: {
        'Authorization': 'dev-mock-token'
      },
      params: testParams
    });
    
    console.log('📊 Revenue API 响应:');
    console.log(`  - 总收入: ${revenueResponse.data.totalRevenue}`);
    console.log(`  - 总发票数: ${revenueResponse.data.totalInvoices}`);
    console.log(`  - 数据点数量: ${revenueResponse.data.revenueReport.length}`);
    
    if (revenueResponse.data.revenueReport.length > 0) {
      console.log('  - 数据详情:');
      revenueResponse.data.revenueReport.forEach(item => {
        console.log(`    ${item.period}: 收入=${item.revenue}, 发票数=${item.invoiceCount}`);
      });
    }
    
    // 4. 测试整个10月
    console.log('\n4. 测试整个10月...');
    const monthParams = {
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      groupBy: 'month',
      nodeCount: 1
    };
    
    console.log('📅 请求参数:', monthParams);
    
    const monthResponse = await axios.get(`${BASE_URL}/reports/revenue`, {
      headers: {
        'Authorization': 'dev-mock-token'
      },
      params: monthParams
    });
    
    console.log('📊 10月整月响应:');
    console.log(`  - 总收入: ${monthResponse.data.totalRevenue}`);
    console.log(`  - 总发票数: ${monthResponse.data.totalInvoices}`);
    
    if (monthResponse.data.revenueReport.length > 0) {
      monthResponse.data.revenueReport.forEach(item => {
        console.log(`  - ${item.period}: 收入=${item.revenue}, 发票数=${item.invoiceCount}`);
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
  }
}

debugDateFix();