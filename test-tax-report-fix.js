const axios = require('axios');

async function testTaxReportFix() {
  try {
    console.log('🔍 开始测试税务报告修复...');
    
    // 1. 登录获取token
    console.log('📝 正在登录...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }
    
    console.log('✅ 登录成功');
    
    const token = loginResponse.data.data.token;
    
    // 2. 调用税务报告API
    console.log('📊 正在获取税务报告...');
    const taxResponse = await axios.get('http://localhost:8080/api/reports/tax', {
      params: {
        startDate: '2024-11-01',
        endDate: '2024-11-30'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 税务报告API调用成功');
    console.log('📋 完整响应数据:');
    console.log(JSON.stringify(taxResponse.data, null, 2));
    
    // 3. 验证修复效果
    const data = taxResponse.data;
    
    console.log('\n🔍 验证修复效果:');
    console.log(`总税额: ${data.summary.totalTax}€`);
    console.log(`发票数量: ${data.summary.invoiceCount}`);
    
    if (data.taxByRate && data.taxByRate.length > 0) {
      console.log('\n📊 按税率分组:');
      data.taxByRate.forEach(item => {
        console.log(`  税率 ${item.rate}%: 税额 ${item.amount}€, 小计 ${item.subtotal}€, 数量 ${item.count}`);
      });
      
      // 检查是否还有税率为0的问题
      const zeroRateItems = data.taxByRate.filter(item => item.rate === 0);
      if (zeroRateItems.length > 0 && zeroRateItems[0].amount === 0) {
        console.log('❌ 问题仍然存在: 税率为0且税额为0');
      } else {
        console.log('✅ 修复成功: 税率和税额计算正确');
      }
    } else {
      console.log('❌ 没有税率分组数据');
    }
    
    // 4. 验证季度税务数据
    if (data.quarterlyTax && data.quarterlyTax.length > 0) {
      console.log('\n📊 季度税务数据:');
      data.quarterlyTax.forEach(quarter => {
        console.log(`  ${quarter.quarter}: 收入 ${quarter.totalRevenue}€, 税额 ${quarter.taxAmount}€`);
      });
      
      // 检查Q3是否有taxAmount字段
      const q3Data = data.quarterlyTax.find(q => q.quarter === 'Q3 2025');
      if (q3Data && q3Data.hasOwnProperty('taxAmount')) {
        console.log('✅ Q3季度数据完整');
      } else {
        console.log('❌ Q3季度数据缺少taxAmount字段');
      }
    } else {
      console.log('❌ 没有季度税务数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('❌ 响应状态:', error.response.status);
      console.error('❌ 响应数据:', error.response.data);
    }
  }
}

testTaxReportFix();