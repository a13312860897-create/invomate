/**
 * AI服务测试启动脚本
 * 用于运行AI服务测试
 */

// 加载环境变量
require('dotenv').config();

// 导入测试函数
const { runAllTests } = require('../src/services/ai/test/aiService.test');

// 运行测试
runAllTests()
  .then(() => {
    console.log('\n测试完成。');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n测试运行出错:', error);
    process.exit(1);
  });