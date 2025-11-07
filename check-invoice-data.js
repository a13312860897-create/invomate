const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function checkInvoiceData() {
  try {
    console.log('🔍 检查发票数据\n');

    // 1. 登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token\n');

    // 2. 获取发票列表
    console.log('2. 获取发票列表...');
    const invoicesResponse = await axios.get(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer dev-mock-token` }
    });
    
    const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.invoices;
    console.log(`📋 发票总数: ${Array.isArray(invoices) ? invoices.length : 'Not an array'}`);
    console.log('📋 响应结构:', Object.keys(invoicesResponse.data));
    if (invoicesResponse.data.data) {
      console.log('📋 data字段结构:', Object.keys(invoicesResponse.data.data));
    }
    
    if (Array.isArray(invoices) && invoices.length > 0) {
      console.log('\n📊 发票数据示例:');
      invoices.slice(0, 5).forEach((invoice, index) => {
        console.log(`  ${index + 1}. ID: ${invoice.id}`);
        console.log(`     金额: ${invoice.total || invoice.totalAmount || invoice.amount || 'N/A'}`);
        console.log(`     状态: ${invoice.status}`);
        console.log(`     创建日期: ${invoice.createdAt}`);
        console.log(`     支付日期: ${invoice.paidDate || 'N/A'}`);
        console.log(`     到期日期: ${invoice.dueDate || 'N/A'}`);
        console.log('');
      });
      
      // 统计已支付发票
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      console.log(`💰 已支付发票数: ${paidInvoices.length}`);
      
      if (paidInvoices.length > 0) {
        console.log('\n💳 已支付发票示例:');
        paidInvoices.slice(0, 3).forEach((invoice, index) => {
          console.log(`  ${index + 1}. ID: ${invoice.id}, 金额: ${invoice.total || invoice.totalAmount || invoice.amount}, 支付日期: ${invoice.paidDate}`);
        });
        
        // 按月份统计
        const monthlyStats = {};
        paidInvoices.forEach(invoice => {
          if (invoice.paidDate) {
            const month = invoice.paidDate.substring(0, 7); // YYYY-MM
            if (!monthlyStats[month]) {
              monthlyStats[month] = { count: 0, total: 0 };
            }
            monthlyStats[month].count++;
            monthlyStats[month].total += parseFloat(invoice.total || invoice.totalAmount || invoice.amount || 0);
          }
        });
        
        console.log('\n📅 按月份统计:');
        Object.entries(monthlyStats).forEach(([month, stats]) => {
          console.log(`  ${month}: ${stats.count} 张发票, 总金额: ${stats.total.toFixed(2)}`);
        });
      }
    } else {
      console.log('⚠️ 没有找到任何发票数据');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
  }
}

checkInvoiceData();