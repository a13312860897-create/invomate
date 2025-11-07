/**
 * 发票自然语言问答服务交互式测试脚本
 */

require('dotenv').config();
const InvoiceQAService = require('../src/services/ai/invoiceQAService');

// 创建发票QA服务实例
const qaService = new InvoiceQAService();

// 模拟用户ID
const userId = 1;

// 测试查询列表
const testQueries = [
  "客户张三的发票有哪些？",
  "客户李四的未付发票",
  "支付状态如何？",
  "上个月收入多少？",
  "有哪些逾期发票？",
  "客户ABC的付款情况如何？",
  "客户是王五的发票情况",
  "最近30天的收入情况"
];

/**
 * 运行单个测试查询
 * @param {string} query - 测试查询
 */
async function runTestQuery(query) {
  console.log(`\n测试查询: "${query}"`);
  console.log('='.repeat(50));
  
  try {
    // 处理查询
    const result = await qaService.processQuery(query, {}, userId);
    
    if (result.success) {
      console.log('✅ 查询成功');
      console.log(`意图类型: ${result.intent.type}`);
      console.log(`意图参数: ${JSON.stringify(result.intent.params, null, 2)}`);
      console.log(`自然语言响应: ${result.response}`);
      
      // 显示部分数据（避免输出过多）
      if (result.data && result.data.found !== undefined) {
        console.log(`查询结果: ${result.data.found ? '找到相关数据' : '未找到相关数据'}`);
        if (result.data.found && result.data.stats) {
          console.log(`统计信息: ${JSON.stringify(result.data.stats, null, 2)}`);
        }
      }
    } else {
      console.log('❌ 查询失败');
      console.log(`错误信息: ${result.error}`);
    }
    
    console.log(`处理时间: ${result.processingTime}ms`);
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  }
}

/**
 * 运行所有测试查询
 */
async function runAllTests() {
  console.log('开始运行发票自然语言问答服务交互式测试...');
  console.log('='.repeat(60));
  
  for (const query of testQueries) {
    await runTestQuery(query);
  }
  
  console.log('\n所有测试查询已完成！');
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runTestQuery,
  runAllTests
};