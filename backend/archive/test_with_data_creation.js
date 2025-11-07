const axios = require('axios');
const memoryDb = require('./src/config/memoryDatabase');

// 创建测试数据的函数
function createTestData() {
  console.log('=== 创建测试数据 ===');
  
  // 清空现有数据
  memoryDb.invoices.length = 0;
  
  let invoiceCounter = 1;
  
  // 1. 创建10张8月份发票
  console.log('创建10张8月份发票...');
  for (let i = 0; i < 10; i++) {
    const invoice = {
      id: invoiceCounter,
      userId: 1,
      invoiceNumber: `INV-${String(invoiceCounter).padStart(3, '0')}`,
      status: 'paid',
      createdAt: `2025-08-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      paidDate: new Date(`2025-08-${Math.floor(Math.random() * 28) + 1}`),
      items: [{
        description: `服务项目 ${invoiceCounter}`,
        quantity: 1,
        rate: Math.floor(Math.random() * 8000) + 2000,
        total: Math.floor(Math.random() * 8000) + 2000
      }]
    };
    invoice.total = invoice.items[0].total;
    memoryDb.invoices.push(invoice);
    invoiceCounter++;
  }
  
  // 2. 创建15张9月份发票，按指定状态分布
  console.log('创建15张9月份发票...');
  const statusDistribution = [
    { status: 'pending', count: 1 },
    { status: 'overdue', count: 2 },
    { status: 'draft', count: 3 },
    { status: 'sent', count: 4 },
    { status: 'paid', count: 5 }
  ];
  
  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const invoice = {
        id: invoiceCounter,
        userId: 1,
        invoiceNumber: `INV-${String(invoiceCounter).padStart(3, '0')}`,
        status: status,
        createdAt: `2025-09-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        items: [{
          description: `服务项目 ${invoiceCounter}`,
          quantity: 1,
          rate: Math.floor(Math.random() * 8000) + 2000,
          total: Math.floor(Math.random() * 8000) + 2000
        }]
      };
      invoice.total = invoice.items[0].total;
      
      // 根据状态设置特定字段
      if (status === 'paid') {
        invoice.paidDate = new Date(`2025-09-${Math.floor(Math.random() * 28) + 1}`);
      } else if (status === 'overdue') {
        invoice.dueDate = new Date(`2025-09-${Math.floor(Math.random() * 15) + 1}`);
      }
      
      memoryDb.invoices.push(invoice);
      invoiceCounter++;
    }
  }
  
  console.log(`✅ 创建完成，总发票数: ${memoryDb.invoices.length}`);
  
  // 统计9月份发票
  const septemberInvoices = memoryDb.invoices.filter(inv => inv.createdAt.startsWith('2025-09'));
  console.log(`9月份发票数: ${septemberInvoices.length}`);
  
  const septemberStatusCount = {};
  septemberInvoices.forEach(invoice => {
    septemberStatusCount[invoice.status] = (septemberStatusCount[invoice.status] || 0) + 1;
  });
  
  console.log('9月份发票状态分布:');
  Object.entries(septemberStatusCount).forEach(([status, count]) => {
    const statusLabels = {
      'paid': '已支付',
      'pending': '待付款',
      'overdue': '逾期',
      'draft': '草稿',
      'sent': '已发送'
    };
    console.log(`  ${statusLabels[status] || status}: ${count} 张`);
  });
}

// 测试统一API的函数
async function testUnifiedAPI() {
  try {
    const testMonth = '2025-09';
    
    // 使用开发模式的模拟token
    const token = 'dev-mock-token';
    console.log('\n=== 测试统一API ===');
    console.log('使用开发模式模拟token');
    console.log('测试月份:', testMonth);
    
    // 调用统一图表数据API
    console.log('调用统一图表数据API...');
    const response = await axios.get(`http://localhost:3002/api/dashboard/unified-chart-data?month=${testMonth}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API响应状态:', response.status);
    
    if (response.data.success) {
      const { revenueTrend, statusDistribution, monthInfo } = response.data.data;
      
      console.log('\n=== 收入趋势数据 ===');
      console.log('总收入:', revenueTrend.totalRevenue);
      console.log('总数量:', revenueTrend.totalCount);
      console.log('时间点数量:', revenueTrend.timePoints.length);
      
      console.log('\n=== 发票状态分布数据 ===');
      console.log('总发票数:', statusDistribution.totalInvoices);
      statusDistribution.distribution.forEach(item => {
        console.log(`  ${item.label}(${item.status}): ${item.count}张, ${item.amount}元`);
      });
      
      // 数据一致性检查
      console.log('\n=== 数据一致性检查 ===');
      const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
      
      console.log('收入趋势中的已支付发票数:', revenueTrend.totalCount);
      console.log('状态分布中的已支付发票数:', paidFromStatus?.count || 0);
      console.log('已支付发票数量一致:', revenueTrend.totalCount === (paidFromStatus?.count || 0) ? '✅' : '❌');
      
      console.log('收入趋势中的总收入:', revenueTrend.totalRevenue);
      console.log('状态分布中的已支付金额:', paidFromStatus?.amount || 0);
      console.log('已支付金额一致:', revenueTrend.totalRevenue === (paidFromStatus?.amount || 0) ? '✅' : '❌');
      
    } else {
      console.error('API调用失败:', response.data);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 主函数
async function main() {
  // 1. 创建测试数据
  createTestData();
  
  // 2. 等待一下确保数据创建完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 3. 测试API
  await testUnifiedAPI();
}

main();