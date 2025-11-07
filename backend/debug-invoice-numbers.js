const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 发票编号调试工具 ===');

// 获取所有发票
const allInvoices = memoryDb.findAllInvoices();
console.log(`总发票数量: ${allInvoices.length}`);

// 按发票编号分组
const invoicesByNumber = {};
allInvoices.forEach(invoice => {
  if (invoice.invoiceNumber) {
    if (!invoicesByNumber[invoice.invoiceNumber]) {
      invoicesByNumber[invoice.invoiceNumber] = [];
    }
    invoicesByNumber[invoice.invoiceNumber].push(invoice);
  }
});

// 查找重复的发票编号
const duplicates = {};
Object.keys(invoicesByNumber).forEach(number => {
  if (invoicesByNumber[number].length > 1) {
    duplicates[number] = invoicesByNumber[number];
  }
});

console.log('\n=== 重复的发票编号 ===');
if (Object.keys(duplicates).length === 0) {
  console.log('没有发现重复的发票编号');
} else {
  Object.keys(duplicates).forEach(number => {
    console.log(`发票编号 ${number} 重复 ${duplicates[number].length} 次:`);
    duplicates[number].forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, 用户ID: ${invoice.userId}, 创建时间: ${invoice.createdAt}`);
    });
  });
}

// 显示所有发票编号
console.log('\n=== 所有发票编号 ===');
allInvoices.forEach(invoice => {
  console.log(`ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}, 用户: ${invoice.userId}, 时间: ${invoice.createdAt}`);
});

// 清理重复的发票编号（保留最新的）
console.log('\n=== 清理重复发票编号 ===');
Object.keys(duplicates).forEach(number => {
  const invoicesWithSameNumber = duplicates[number];
  // 按创建时间排序，保留最新的
  invoicesWithSameNumber.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 删除除了最新的之外的所有发票
  for (let i = 1; i < invoicesWithSameNumber.length; i++) {
    const invoiceToDelete = invoicesWithSameNumber[i];
    console.log(`删除重复发票: ID ${invoiceToDelete.id}, 编号 ${invoiceToDelete.invoiceNumber}`);
    memoryDb.deleteInvoice(invoiceToDelete.id);
  }
});

console.log('\n=== 清理完成 ===');
const remainingInvoices = memoryDb.findAllInvoices();
console.log(`剩余发票数量: ${remainingInvoices.length}`);