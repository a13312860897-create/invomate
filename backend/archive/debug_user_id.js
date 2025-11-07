const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 调试用户ID问题 ===');

// 检查内存数据库中的用户
console.log('\n用户列表:');
memoryDb.users.forEach(user => {
  console.log(`用户ID: ${user.id}, 邮箱: ${user.email}, 姓名: ${user.firstName} ${user.lastName}`);
});

// 检查内存数据库中的发票
console.log('\n发票列表:');
memoryDb.invoices.forEach(invoice => {
  console.log(`发票ID: ${invoice.id}, 用户ID: ${invoice.userId}, 状态: ${invoice.status}, 创建时间: ${invoice.createdAt}`);
});

// 检查登录用户的ID
console.log('\n登录用户邮箱: a133128860897@163.com');
const loginUser = memoryDb.users.find(user => user.email === 'a133128860897@163.com');
if (loginUser) {
  console.log(`登录用户ID: ${loginUser.id}`);
  
  // 查找该用户的发票
  const userInvoices = memoryDb.invoices.filter(invoice => invoice.userId === loginUser.id);
  console.log(`该用户的发票数量: ${userInvoices.length}`);
  
  userInvoices.forEach(invoice => {
    console.log(`  发票ID: ${invoice.id}, 状态: ${invoice.status}, 创建时间: ${invoice.createdAt}`);
  });
} else {
  console.log('未找到登录用户');
}

// 检查2025年9月的发票
console.log('\n=== 检查2025年9月的发票 ===');
const allInvoices = memoryDb.invoices;
console.log(`总发票数: ${allInvoices.length}`);

allInvoices.forEach(invoice => {
  const createdDate = new Date(invoice.createdAt);
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
  
  console.log(`发票ID: ${invoice.id}`);
  console.log(`  创建时间: ${invoice.createdAt} (年月: ${createdDate.getFullYear()}-${createdDate.getMonth() + 1})`);
  console.log(`  发票日期: ${invoice.issueDate} (年月: ${issueDate ? issueDate.getFullYear() + '-' + (issueDate.getMonth() + 1) : 'N/A'})`);
  console.log(`  用户ID: ${invoice.userId}`);
  console.log(`  状态: ${invoice.status}`);
  console.log('---');
});