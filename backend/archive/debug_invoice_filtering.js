const axios = require('axios');

// 调试发票筛选逻辑
async function debugInvoiceFiltering() {
  try {
    const BASE_URL = 'http://localhost:3002/api';
    
    console.log('=== 调试发票筛选逻辑 ===');
    
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
    
    // 2. 获取所有发票
    console.log('\n2. 获取所有发票...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, { headers });
    const allInvoices = invoicesResponse.data.data.invoices || invoicesResponse.data.data || [];
    
    console.log(`总发票数量: ${allInvoices.length}`);
    
    // 3. 分析9月份的发票
    const currentMonth = '2025-09';
    console.log(`\n3. 分析${currentMonth}的发票:`);
    
    const septemberInvoices = allInvoices.filter(inv => {
      // 检查创建日期
      const createdMonth = new Date(inv.createdAt).toISOString().slice(0, 7);
      // 检查更新日期
      const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
      // 检查支付日期
      const paidMonth = inv.paidDate ? new Date(inv.paidDate).toISOString().slice(0, 7) : null;
      
      return createdMonth === currentMonth || updatedMonth === currentMonth || paidMonth === currentMonth;
    });
    
    console.log(`9月份相关发票数量: ${septemberInvoices.length}`);
    
    septemberInvoices.forEach((inv, index) => {
      console.log(`\n发票${index + 1}:`);
      console.log(`  ID: ${inv.id}`);
      console.log(`  状态: ${inv.status}`);
      console.log(`  金额: ${inv.total}€`);
      console.log(`  创建日期: ${inv.createdAt}`);
      console.log(`  更新日期: ${inv.updatedAt}`);
      console.log(`  支付日期: ${inv.paidDate || '未设置'}`);
      
      const createdMonth = new Date(inv.createdAt).toISOString().slice(0, 7);
      const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
      const paidMonth = inv.paidDate ? new Date(inv.paidDate).toISOString().slice(0, 7) : null;
      
      console.log(`  创建月份: ${createdMonth}`);
      console.log(`  更新月份: ${updatedMonth}`);
      console.log(`  支付月份: ${paidMonth || '无'}`);
    });
    
    // 4. 模拟API的筛选逻辑
    console.log(`\n4. 模拟API筛选逻辑 (status='paid' 且 paidDate或updatedAt在${currentMonth}):`);
    
    const filteredByAPI = allInvoices.filter(inv => {
      if (inv.status !== 'paid') {
        return false;
      }
      
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
    
    console.log(`API筛选结果数量: ${filteredByAPI.length}`);
    
    filteredByAPI.forEach((inv, index) => {
      console.log(`\n筛选发票${index + 1}:`);
      console.log(`  ID: ${inv.id}`);
      console.log(`  状态: ${inv.status}`);
      console.log(`  金额: ${inv.total}€`);
      console.log(`  支付日期: ${inv.paidDate || '未设置'}`);
      console.log(`  更新日期: ${inv.updatedAt}`);
      
      // 判断是通过哪个日期筛选的
      if (inv.paidDate) {
        const paidMonth = new Date(inv.paidDate).toISOString().slice(0, 7);
        if (paidMonth === currentMonth) {
          console.log(`  -> 通过支付日期筛选`);
        }
      } else if (inv.updatedAt) {
        const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
        if (updatedMonth === currentMonth) {
          console.log(`  -> 通过更新日期筛选`);
        }
      }
    });
    
    const totalRevenue = filteredByAPI.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    console.log(`\n筛选结果汇总: ${filteredByAPI.length}张发票, 总金额: ${totalRevenue}€`);
    
  } catch (error) {
    console.error('调试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

debugInvoiceFiltering();