const axios = require('axios');

async function testApiAfterFix() {
  try {
    console.log('🔍 测试修复后的API响应...');
    
    const authHeaders = {
      'Authorization': 'Bearer dev-mock-token',
      'Content-Type': 'application/json'
    };
    
    // 1. 测试不指定月份（应该使用UTC时间计算的当前月份）
    console.log('\n1. 测试不指定月份（默认值）:');
    try {
      const defaultResponse = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data', {
        headers: authHeaders
      });
      
      if (defaultResponse.data.success) {
        const data = defaultResponse.data.data;
        console.log(`  使用的月份: ${data.monthInfo.month}`);
        console.log(`  收入趋势: ${data.revenueTrend.totalRevenue}€ (${data.revenueTrend.totalCount}张)`);
        console.log(`  状态分布: ${data.statusDistribution.totalInvoices}张发票`);
        
        // 显示已支付发票的详细信息
        const paidDistribution = data.statusDistribution.distribution.find(d => d.status === 'paid');
        if (paidDistribution) {
          console.log(`  已支付发票: ${paidDistribution.count}张, 金额: ${paidDistribution.amount}€`);
        }
      }
    } catch (error) {
      console.error('  默认月份API错误:', error.message);
    }
    
    // 2. 测试指定2025-09月
    console.log('\n2. 测试指定2025-09月:');
    try {
      const septemberResponse = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data?month=2025-09', {
        headers: authHeaders
      });
      
      if (septemberResponse.data.success) {
        const data = septemberResponse.data.data;
        console.log(`  使用的月份: ${data.monthInfo.month}`);
        console.log(`  收入趋势: ${data.revenueTrend.totalRevenue}€ (${data.revenueTrend.totalCount}张)`);
        console.log(`  状态分布: ${data.statusDistribution.totalInvoices}张发票`);
        
        const paidDistribution = data.statusDistribution.distribution.find(d => d.status === 'paid');
        if (paidDistribution) {
          console.log(`  已支付发票: ${paidDistribution.count}张, 金额: ${paidDistribution.amount}€`);
        }
      }
    } catch (error) {
      console.error('  2025-09月API错误:', error.message);
    }
    
    // 3. 验证数据一致性
    console.log('\n3. 验证数据一致性:');
    try {
      const response = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data?month=2025-09', {
        headers: authHeaders
      });
      
      if (response.data.success) {
        const { revenueTrend, statusDistribution } = response.data.data;
        const paidDistribution = statusDistribution.distribution.find(d => d.status === 'paid');
        
        console.log('  收入趋势数据:');
        console.log(`    总收入: ${revenueTrend.totalRevenue}€`);
        console.log(`    总数量: ${revenueTrend.totalCount}张`);
        
        console.log('  状态分布中的已支付数据:');
        console.log(`    已支付数量: ${paidDistribution?.count || 0}张`);
        console.log(`    已支付金额: ${paidDistribution?.amount || 0}€`);
        
        const isCountConsistent = revenueTrend.totalCount === (paidDistribution?.count || 0);
        const isAmountConsistent = revenueTrend.totalRevenue === (paidDistribution?.amount || 0);
        
        console.log('  一致性检查:');
        console.log(`    数量一致: ${isCountConsistent ? '✅' : '❌'}`);
        console.log(`    金额一致: ${isAmountConsistent ? '✅' : '❌'}`);
        
        if (isCountConsistent && isAmountConsistent) {
          console.log('  🎉 数据一致性验证通过！');
        } else {
          console.log('  ⚠️ 数据一致性验证失败！');
        }
      }
    } catch (error) {
      console.error('  一致性验证错误:', error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testApiAfterFix();