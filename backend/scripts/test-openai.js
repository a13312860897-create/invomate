/**
 * OpenAI API测试脚本
 * 用于验证OpenAI SDK安装和API连接
 */

require('dotenv').config();

// 检查是否安装了OpenAI SDK
let OpenAI;
try {
  OpenAI = require('openai');
  console.log('✅ OpenAI SDK已安装');
} catch (error) {
  console.error('❌ OpenAI SDK未安装');
  console.log('请运行以下命令安装OpenAI SDK:');
  console.log('npm install openai');
  process.exit(1);
}

// 检查API密钥是否设置
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ 未找到OpenAI API密钥');
  console.log('请在.env文件中设置OPENAI_API_KEY环境变量');
  console.log('或者在终端中运行:');
  console.log('set OPENAI_API_KEY="your_api_key_here"');
  process.exit(1);
}

console.log('✅ OpenAI API密钥已设置');

// 创建OpenAI客户端
const client = new OpenAI();

/**
 * 测试基本的API请求
 */
async function testBasicAPIRequest() {
  console.log('\n测试基本的API请求...');
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "请用一句话介绍你自己" }],
      max_tokens: 100
    });
    
    console.log('✅ API请求成功');
    console.log('响应:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ API请求失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('开始运行OpenAI API测试...');
  console.log('='.repeat(50));
  
  const success = await testBasicAPIRequest();
  
  if (success) {
    console.log('\n🎉 所有测试通过！OpenAI API已正确配置。');
  } else {
    console.log('\n❌ 测试失败，请检查您的API密钥和网络连接。');
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBasicAPIRequest,
  runTests
};