const DataService = require('./src/services/DataService');
const memoryDb = require('./src/config/memoryDatabase');

async function testConsistencyFix() {
  console.log('=== 测试数据一致性修正效果 ===\n');
  
  try {
    // 初始化数据库
    console.log('初始化内存数据库...');
    
    // 清空现有发票数据
    memoryDb.invoices = [];
    memoryDb.nextIds.invoices = 1;
    
    // 创建测试数据
    console.log('1. 创建测试发票数据...');
    
    // 创建2024年12月的发票
    const testInvoices = [
      {
        id: 1,
        userId: 1,
        clientId: 1,
        total: 1000,
        status: 'paid',
        createdAt: '2024-12-05',
        paidDate: '2024-12-10'
      },
      {
        id: 2,
        userId: 1,
        clientId: 2,
        total: 2000,
        status: 'paid',
        createdAt: '2024-12-15',
        paidDate: '2025-01-05'  // 支付在下个月
      },
      {
        id: 3,
        userId: 1,
        clientId: 3,
        total: 1500,
        status: 'pending',
        createdAt: '2024-12-20'
      },
      {
        id: 4,
        userId: 1,
        clientId: 1,
        total: 800,
        status: 'overdue',
        createdAt: '2024-12-25'
      }
    ];
    
    // 添加测试发票
    for (const invoice of testInvoices) {
        const createdInvoice = memoryDb.createInvoice(invoice);
        // 手动设置正确的创建时间，因为createInvoice会覆盖createdAt
        createdInvoice.createdAt = new Date(invoice.createdAt);
    }
    
    // 验证发票是否正确创建
    console.log(`实际创建的发票数量: ${memoryDb.invoices.length}`);
    console.log('发票详情:', memoryDb.invoices.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        status: inv.status,
        total: inv.total,
        createdAt: inv.createdAt
    })));
    
    console.log('\n=== 创建的测试发票 ===');
    memoryDb.invoices.forEach(inv => {
      console.log(`ID: ${inv.id}, 用户: ${inv.userId}, 状态: ${inv.status}, 金额: ${inv.total}, 创建时间: ${inv.createdAt}`);
    });
    
    console.log(`创建了 ${testInvoices.length} 张测试发票`);
    console.log('- 2张已支付发票（创建于2024-12，其中1张支付于2024-12，1张支付于2025-01）');
    console.log('- 1张待支付发票');
    console.log('- 1张逾期发票\n');
    
    // 测试修正后的API一致性
    const dataService = new DataService(memoryDb);
    const month = '2024-12';
    const userId = 1;
    
    console.log('2. 测试修正后的API数据一致性...\n');
    
    // 获取状态分布
    console.log('2.1 发票状态分布API:');
    const statusDistribution = await dataService.getInvoiceStatusDistribution(userId, month);
    console.log(`- 总发票数: ${statusDistribution.totalInvoices}`);
    statusDistribution.distribution.forEach(item => {
      console.log(`- ${item.status}: ${item.count}张, ${item.amount}元`);
    });
    console.log(`- 筛选说明: ${statusDistribution.filteringNote}\n`);
    
    // 获取收入趋势
    console.log('2.2 收入趋势API:');
    const revenueTrend = await dataService.getRevenueTrend(userId, month);
    console.log(`- 已支付发票数: ${revenueTrend.totalCount}张`);
    console.log(`- 总收入: ${revenueTrend.totalRevenue}元\n`);
    
    // 获取月度摘要
    console.log('2.3 月度摘要API:');
    const summary = await dataService.getMonthlyInvoiceSummary(userId, month);
    console.log(`- 创建发票数: ${summary.created.count}张`);
    console.log(`- 已支付发票数: ${summary.paid.count}张`);
    console.log(`- 已支付总金额: ${summary.paid.totalAmount}元\n`);
    
    // 数据一致性验证
    console.log('3. 数据一致性验证:');
    const statusPaid = statusDistribution.distribution.find(d => d.status === 'paid');
    const statusPaidCount = statusPaid ? statusPaid.count : 0;
    const statusPaidAmount = statusPaid ? statusPaid.amount : 0;
    
    console.log(`状态分布中已支付: ${statusPaidCount}张, ${statusPaidAmount}元`);
    console.log(`收入趋势中已支付: ${revenueTrend.totalCount}张, ${revenueTrend.totalRevenue}元`);
    console.log(`月度摘要中已支付: ${summary.paid.count}张, ${summary.paid.totalAmount}元`);
    
    const isConsistent = (
      statusPaidCount === revenueTrend.totalCount &&
      statusPaidCount === summary.paid.count &&
      statusPaidAmount === revenueTrend.totalRevenue &&
      statusPaidAmount === summary.paid.totalAmount
    );
    
    console.log(`\n数据一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
    
    if (isConsistent) {
      console.log('\n🎉 修正成功！所有API的已支付发票数据现在完全一致');
      console.log('📋 统一筛选逻辑: 所有发票按创建月份筛选，确保业务活动的准确反映');
    } else {
      console.log('\n⚠️  仍存在数据不一致问题，需要进一步检查');
    }
    
    // 测试统一图表数据API
    console.log('\n4. 测试统一图表数据API:');
    try {
      const unifiedData = await dataService.getUnifiedChartData(userId, month);
      
      // 手动验证统一图表数据的一致性
      const statusPaid = unifiedData.statusDistribution.distribution.find(item => item.status === 'paid');
      const statusPaidCount = statusPaid ? statusPaid.count : 0;
      const statusPaidAmount = statusPaid ? statusPaid.amount : 0;
      
      const revenuePaidCount = unifiedData.revenueTrend.totalCount;
      const revenuePaidAmount = unifiedData.revenueTrend.totalRevenue;
      
      const isUnifiedConsistent = 
        statusPaidCount === revenuePaidCount &&
        statusPaidAmount === revenuePaidAmount;
      
      console.log(`- 状态分布中已支付: ${statusPaidCount}张, ${statusPaidAmount}元`);
      console.log(`- 收入趋势中已支付: ${revenuePaidCount}张, ${revenuePaidAmount}元`);
      console.log(`- 数据一致性: ${isUnifiedConsistent ? '✅ 一致' : '❌ 不一致'}`);
      
    } catch (error) {
      console.error('获取统一图表数据失败:', error.message);
    }
    
    console.log('\n✅ 数据一致性修正测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testConsistencyFix();