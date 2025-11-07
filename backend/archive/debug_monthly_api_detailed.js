const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// 测试用户凭据
const testUser = {
  email: 'a133128860897@163.com',
  password: 'Ddtb959322'
};

async function debugMonthlyRevenueAPI() {
  try {
    console.log('=== 本月收入趋势API详细调试 ===\n');
    
    // 1. 登录
    console.log('1. 登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('登录成功，获取到token\n');
    
    // 2. 获取所有发票
    console.log('2. 获取所有发票...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, { headers });
    const allInvoices = invoicesResponse.data.data.invoices;
    console.log('总发票数:', allInvoices.length);
    
    // 3. 手动模拟API的筛选逻辑
    console.log('\n3. 手动模拟API筛选逻辑...');
    const userId = 1; // 假设用户ID为1
    const currentMonth = new Date().toISOString().slice(0, 7); // 2025-09
    console.log('当前月份:', currentMonth);
    console.log('用户ID:', userId);
    
    // 模拟API的筛选条件
    const filteredInvoices = allInvoices.filter(inv => {
      console.log(`\n检查发票 ID ${inv.id}:`);
      console.log(`- userId: ${inv.userId} (需要: ${userId})`);
      console.log(`- status: ${inv.status} (需要: paid)`);
      console.log(`- paidDate: ${inv.paidDate}`);
      console.log(`- updatedAt: ${inv.updatedAt}`);
      
      if (inv.userId !== userId) {
        console.log('❌ 用户ID不匹配');
        return false;
      }
      
      if (inv.status !== 'paid') {
        console.log('❌ 状态不是已支付');
        return false;
      }
      
      // 检查支付日期
      if (inv.paidDate) {
        const paidMonth = new Date(inv.paidDate).toISOString().slice(0, 7);
        console.log(`- paidDate月份: ${paidMonth}`);
        if (paidMonth === currentMonth) {
          console.log('✅ 支付日期匹配');
          return true;
        }
      }
      
      // 如果没有支付日期，使用更新日期作为备选
      if (inv.updatedAt) {
        const updatedMonth = new Date(inv.updatedAt).toISOString().slice(0, 7);
        console.log(`- updatedAt月份: ${updatedMonth}`);
        if (updatedMonth === currentMonth) {
          console.log('✅ 更新日期匹配');
          return true;
        }
      }
      
      console.log('❌ 日期不匹配');
      return false;
    });
    
    console.log('\n4. 筛选结果:');
    console.log('筛选出的发票数:', filteredInvoices.length);
    console.log('筛选出的发票详情:');
    filteredInvoices.forEach((inv, index) => {
      console.log(`${index + 1}. ID: ${inv.id}, 金额: ${inv.total}€, 状态: ${inv.status}`);
      console.log(`   支付日期: ${inv.paidDate || 'N/A'}, 更新日期: ${inv.updatedAt}`);
    });
    
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    console.log(`总收入: ${totalRevenue}€`);
    
    // 5. 调用实际API进行对比
    console.log('\n5. 调用实际API进行对比...');
    const apiResponse = await axios.get(`${BASE_URL}/dashboard/monthly-revenue-trend`, { headers });
    console.log('API返回的总收入:', apiResponse.data.totalRevenue);
    console.log('API返回的总数量:', apiResponse.data.totalCount);
    
    console.log('\n6. 对比结果:');
    console.log(`手动计算收入: ${totalRevenue}€`);
    console.log(`API返回收入: ${apiResponse.data.totalRevenue}€`);
    console.log(`收入匹配: ${totalRevenue === apiResponse.data.totalRevenue ? '✅' : '❌'}`);
    console.log(`手动计算数量: ${filteredInvoices.length}`);
    console.log(`API返回数量: ${apiResponse.data.totalCount}`);
    console.log(`数量匹配: ${filteredInvoices.length === apiResponse.data.totalCount ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('调试过程中出错:');
    console.error('错误详情:', error.response?.data || error.message);
    console.error('错误堆栈:', error.stack);
  }
}

debugMonthlyRevenueAPI();