const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 检查用户数据 ===');
const users = memoryDb.findAllUsers();
console.log(`用户数量: ${users.length}`);

users.forEach((user, index) => {
  console.log(`用户 ${index + 1}:`);
  console.log(`  - ID: ${user.id}`);
  console.log(`  - Email: ${user.email}`);
  console.log(`  - 密码哈希: ${user.password ? '已设置' : '未设置'}`);
  console.log(`  - 创建时间: ${user.createdAt}`);
  console.log('---');
});