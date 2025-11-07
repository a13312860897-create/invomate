const bcrypt = require('bcryptjs');
const { verifyPassword } = require('./src/utils/encryption');
const { User } = require('./src/models');

async function testPasswordVerification() {
  try {
    console.log('=== 密码验证测试 ===');
    
    // 获取用户数据
    const user = await User.findOne({ where: { email: 'a133128860897@163.com' } });
    if (!user) {
      console.log('用户不存在');
      return;
    }
    
    console.log('用户信息:');
    console.log('- 邮箱:', user.email);
    console.log('- 密码哈希:', user.password);
    console.log('- 密码哈希长度:', user.password.length);
    
    const testPassword = 'Ddtb959322';
    console.log('\n测试密码:', testPassword);
    
    // 测试1: 使用bcrypt.compare直接验证
    console.log('\n=== 测试1: bcrypt.compare直接验证 ===');
    try {
      const result1 = await bcrypt.compare(testPassword, user.password);
      console.log('bcrypt.compare结果:', result1);
    } catch (error) {
      console.log('bcrypt.compare错误:', error.message);
    }
    
    // 测试2: 使用verifyPassword函数验证
    console.log('\n=== 测试2: verifyPassword函数验证 ===');
    try {
      const result2 = await verifyPassword(testPassword, user.password);
      console.log('verifyPassword结果:', result2);
    } catch (error) {
      console.log('verifyPassword错误:', error.message);
    }
    
    // 测试3: 生成新的哈希并验证
    console.log('\n=== 测试3: 生成新哈希并验证 ===');
    try {
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('新生成的哈希:', newHash);
      const result3 = await bcrypt.compare(testPassword, newHash);
      console.log('新哈希验证结果:', result3);
    } catch (error) {
      console.log('新哈希验证错误:', error.message);
    }
    
    // 测试4: 检查哈希格式
    console.log('\n=== 测试4: 检查哈希格式 ===');
    const hashPattern = /^\$2[aby]?\$\d+\$/;
    const isValidFormat = hashPattern.test(user.password);
    console.log('哈希格式是否有效:', isValidFormat);
    
    if (user.password.startsWith('$2a$10$placeholder')) {
      console.log('发现占位符密码，这是问题所在！');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testPasswordVerification().then(() => {
    console.log('\n密码验证测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testPasswordVerification };