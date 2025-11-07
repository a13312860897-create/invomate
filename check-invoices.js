const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function checkInvoices() {
  try {
    console.log('🔍 检查现有发票...');
    
    // 登录获取token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 获取所有发票
    const invoicesResponse = await axios.get(`${API_BASE}/invoices`, { headers });
    console.log('发票响应:', invoicesResponse.data);
    
    const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.invoices || invoicesResponse.data.data || [];
    
    if (!Array.isArray(invoices)) {
      console.log('❌ 发票数据格式不正确:', typeof invoices);
      return;
    }
    
    console.log(`📊 找到 ${invoices.length} 张发票:`);
    
    invoices.forEach((invoice, index) => {
      console.log(`\n📄 发票 ${index + 1}:`);
      console.log(`  ID: ${invoice.id}`);
      console.log(`  编号: ${invoice.invoiceNumber}`);
      console.log(`  客户ID: ${invoice.clientId}`);
      console.log(`  状态: ${invoice.status}`);
      console.log(`  发票日期: ${invoice.issueDate}`);
      console.log(`  到期日期: ${invoice.dueDate}`);
      console.log(`  小计: ${invoice.subtotal}€`);
      console.log(`  税额: ${invoice.taxAmount}€`);
      console.log(`  总计: ${invoice.total}€`);
      if (invoice.paidDate) {
        console.log(`  支付日期: ${invoice.paidDate}`);
      }
    });
    
    // 检查十一月份的发票
    const novemberInvoices = invoices.filter(invoice => 
      invoice.issueDate && invoice.issueDate.startsWith('2024-11')
    );
    
    console.log(`\n📅 十一月份发票: ${novemberInvoices.length} 张`);
    
    if (novemberInvoices.length > 0) {
      console.log('✅ 十一月份发票已存在，可以测试报告功能');
    } else {
      console.log('❌ 没有十一月份发票，需要创建测试数据');
    }
    
  } catch (error) {
    console.error('❌ 检查发票失败:', error.response?.data || error.message);
  }
}

checkInvoices();