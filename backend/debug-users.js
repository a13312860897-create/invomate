const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 内存数据库用户信息 ===');
console.log('用户数量:', memoryDb.users.length);
memoryDb.users.forEach((user, index) => {
  console.log(`用户 ${index + 1}:`);
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Password:', user.password);
  console.log('  Name:', user.name);
  console.log('  ---');
});