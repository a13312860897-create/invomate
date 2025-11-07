const { Invoice } = require('./backend/src/models');

async function debugTaxData() {
  try {
    console.log('检查数据库中的发票税务数据...');
    
    // 获取所有发票
    const invoices = await Invoice.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`找到 ${invoices.length} 张发票`);
    
    if (invoices.length > 0) {
      console.log('\n=== 发票税务数据样本 ===');
      invoices.forEach((invoice, index) => {
        console.log(`\n发票 ${index + 1}:`);
        console.log('  - ID:', invoice.id);
        console.log('  - Invoice Number:', invoice.invoiceNumber);
        console.log('  - Subtotal:', invoice.subtotal);
        console.log('  - Tax Rate:', invoice.taxRate);
        console.log('  - Tax Amount:', invoice.taxAmount);
        console.log('  - Tax (legacy):', invoice.tax);
        console.log('  - Total:', invoice.total);
        console.log('  - Total Amount:', invoice.totalAmount);
        console.log('  - Status:', invoice.status);
        console.log('  - Issue Date:', invoice.issueDate);
      });
      
      // 统计税率分布
      console.log('\n=== 税率统计 ===');
      const taxRateStats = {};
      let totalTaxAmount = 0;
      let totalSubtotal = 0;
      
      invoices.forEach(invoice => {
        const taxRate = parseFloat(invoice.taxRate) || 0;
        const taxAmount = parseFloat(invoice.taxAmount) || parseFloat(invoice.tax) || 0;
        const subtotal = parseFloat(invoice.subtotal) || 0;
        
        if (!taxRateStats[taxRate]) {
          taxRateStats[taxRate] = {
            count: 0,
            totalTaxAmount: 0,
            totalSubtotal: 0
          };
        }
        
        taxRateStats[taxRate].count++;
        taxRateStats[taxRate].totalTaxAmount += taxAmount;
        taxRateStats[taxRate].totalSubtotal += subtotal;
        
        totalTaxAmount += taxAmount;
        totalSubtotal += subtotal;
      });
      
      console.log('总税额:', totalTaxAmount);
      console.log('总小计:', totalSubtotal);
      
      Object.keys(taxRateStats).forEach(rate => {
        const stats = taxRateStats[rate];
        console.log(`税率 ${rate}%:`);
        console.log(`  - 发票数量: ${stats.count}`);
        console.log(`  - 税额总计: ${stats.totalTaxAmount}`);
        console.log(`  - 小计总计: ${stats.totalSubtotal}`);
      });
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugTaxData();