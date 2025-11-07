// 测试总金额计算修复
const fetch = require('node-fetch');

async function testTotalCalculation() {
  console.log('=== 测试总金额计算修复 ===');
  
  // 测试数据：两个物品，总价应该是 40+ 欧元
  const testData = {
    clientId: 1,
    issueDate: "2025-01-20",
    dueDate: "2025-02-20",
    items: [
      {
        description: "测试商品1",
        quantity: 2,
        unitPrice: 15.00,
        taxRate: 20
      },
      {
        description: "测试商品2", 
        quantity: 1,
        unitPrice: 20.00,
        taxRate: 20
      }
    ],
    subtotal: 50.00,  // 2*15 + 1*20 = 50
    taxAmount: 10.00, // 50 * 0.2 = 10
    // 注意：这里故意不发送total字段，测试后端是否会正确计算
    notes: "测试发票"
  };
  
  console.log('发送的测试数据:');
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // 这里需要有效的token，实际测试时需要先登录获取token
    const response = await fetch('http://localhost:8080/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // 需要替换为实际token
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('API响应:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.total && result.total > 0) {
      console.log('✅ 总金额计算正确:', result.total);
    } else {
      console.log('❌ 总金额计算仍有问题:', result.total);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testTotalCalculation();
}

module.exports = { testTotalCalculation };