const fetch = require('node-fetch');

async function createOctoberDataViaAPI() {
  try {
    console.log('=== 通过API创建2025年十月份测试数据 ===');
    
    // 首先登录获取token
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'a133128860897@163.com',
        password: 'Ddtb959322'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功，获取到token');
    
    // 创建十月份发票数据
    const invoices = [
      {
        invoiceNumber: 'INV-2025-10-001',
        issueDate: '2025-10-01',
        dueDate: '2025-10-31',
        status: 'sent',
        totalAmount: 15000,
        clientId: 1
      },
      {
        invoiceNumber: 'INV-2025-10-002',
        issueDate: '2025-10-05',
        dueDate: '2025-11-05',
        status: 'paid',
        totalAmount: 25000,
        clientId: 2
      },
      {
        invoiceNumber: 'INV-2025-10-003',
        issueDate: '2025-10-10',
        dueDate: '2025-11-10',
        status: 'sent',
        totalAmount: 18000,
        clientId: 3
      },
      {
        invoiceNumber: 'INV-2025-10-004',
        issueDate: '2025-10-15',
        dueDate: '2025-11-15',
        status: 'paid',
        totalAmount: 32000,
        clientId: 1
      },
      {
        invoiceNumber: 'INV-2025-10-005',
        issueDate: '2025-10-20',
        dueDate: '2025-11-20',
        status: 'overdue',
        totalAmount: 12000,
        clientId: 2
      },
      {
        invoiceNumber: 'INV-2025-10-006',
        issueDate: '2025-10-25',
        dueDate: '2025-11-25',
        status: 'draft',
        totalAmount: 8000,
        clientId: 3
      },
      {
        invoiceNumber: 'INV-2025-10-007',
        issueDate: '2025-10-30',
        dueDate: '2025-11-30',
        status: 'cancelled',
        totalAmount: 5000,
        clientId: 1
      }
    ];
    
    console.log(`准备创建 ${invoices.length} 张十月份发票...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const invoice of invoices) {
      try {
        const response = await fetch('http://localhost:3002/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(invoice)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ 创建发票成功: ${invoice.invoiceNumber} (${invoice.status})`);
          successCount++;
        } else {
          console.log(`❌ 创建发票失败: ${invoice.invoiceNumber} - ${response.status}`);
          failCount++;
        }
      } catch (error) {
        console.log(`❌ 创建发票异常: ${invoice.invoiceNumber} - ${error.message}`);
        failCount++;
      }
      
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 创建结果统计:');
    console.log(`成功: ${successCount} 张`);
    console.log(`失败: ${failCount} 张`);
    console.log(`总计: ${invoices.length} 张`);
    
    if (successCount > 0) {
      console.log('\n✅ 十月份测试数据创建完成！');
      
      // 验证数据
      console.log('\n=== 验证十月份数据 ===');
      const verifyResponse = await fetch('http://localhost:3002/api/dashboard/unified-chart-data?month=2025-10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('十月份数据验证结果:', JSON.stringify(verifyData, null, 2));
      }
    }
    
  } catch (error) {
    console.error('创建十月份数据失败:', error);
  }
}

createOctoberDataViaAPI();