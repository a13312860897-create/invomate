const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 检查内存数据库中的用户 ===');

const users = memoryDb.getAllUsers();
console.log('所有用户:');
users.forEach(user => {
  console.log(`ID: ${user.id}, Email: ${user.email}, 密码哈希: ${user.password.substring(0, 20)}...`);
});

console.log('\n=== 尝试验证密码 ===');
const bcrypt = require('bcrypt');

// 测试常见密码
const testPasswords = ['Ddtb959322', '123456', 'password123'];

users.forEach(user => {
  console.log(`\n用户 ${user.email}:`);
  testPasswords.forEach(password => {
    const isValid = bcrypt.compareSync(password, user.password);
    console.log(`  密码 "${password}": ${isValid ? '✓ 正确' : '✗ 错误'}`);
  });
});