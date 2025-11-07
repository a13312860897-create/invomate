/**
 * 发票自然语言问答服务测试启动脚本
 */

// 加载环境变量
require('dotenv').config();

// 导入测试函数
const { runAllTests } = require('../src/services/ai/test/invoiceQAService.test');

// 运行测试
runAllTests()
  .then(results => {
    console.log('\n=== 测试结果总结 ===');
    console.log(`总测试数: ${results.total}`);
    console.log(`通过测试: ${results.passed}`);
    console.log(`失败测试: ${results.failed}`);
    console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    
    if (results.failed > 0) {
      console.log('\n=== 失败的测试 ===');
      results.failures.forEach(failure => {
        console.log(`- ${failure.test}: ${failure.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n所有测试通过！');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('运行测试时发生错误:', error);
    process.exit(1);
  });