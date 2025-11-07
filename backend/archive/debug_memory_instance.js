// 调试内存数据库实例状态
const path = require('path');

console.log('🔍 调试内存数据库实例状态...');

// 检查不同的内存数据库引用
console.log('\n1. 直接引用 memoryDatabase.js:');
try {
  const memoryDatabase = require('./src/config/memoryDatabase');
  console.log('发票数量:', memoryDatabase.invoices.length);
  console.log('用户数量:', memoryDatabase.users.length);
  console.log('客户数量:', memoryDatabase.clients.length);
} catch (error) {
  console.error('错误:', error.message);
}

console.log('\n2. 通过 models/index.js 引用:');
try {
  const { memoryDb } = require('./src/models/index');
  console.log('发票数量:', memoryDb.invoices.length);
  console.log('用户数量:', memoryDb.users.length);
  console.log('客户数量:', memoryDb.clients.length);
} catch (error) {
  console.error('错误:', error.message);
}

console.log('\n3. 检查环境变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('USE_MEMORY_DB:', process.env.USE_MEMORY_DB);

console.log('\n4. 检查服务器是否在运行:');
const axios = require('axios');

async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3002/api/dashboard/stats', {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('服务器响应状态:', response.status);
    console.log('统计数据:', response.data);
  } catch (error) {
    console.error('服务器连接失败:', error.message);
  }
}

checkServer();