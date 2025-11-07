const axios = require('axios');
require('dotenv').config();

// 从环境变量加载配置
const PADDLE_ENVIRONMENT = process.env.PADDLE_ENVIRONMENT || 'sandbox';
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_CLIENT_TOKEN = process.env.PADDLE_CLIENT_TOKEN;

// 配置Paddle API
const PADDLE_CONFIG = {
  sandbox: {
    baseURL: 'https://sandbox-api.paddle.com',
    jsURL: 'https://cdn.paddle.com/paddle/paddle.js',
    environment: 'sandbox'
  },
  production: {
    baseURL: 'https://api.paddle.com',
    jsURL: 'https://cdn.paddle.com/paddle/paddle.js',
    environment: 'production'
  }
}[PADDLE_ENVIRONMENT];

// 创建axios实例
const paddleApi = axios.create({
  baseURL: PADDLE_CONFIG.baseURL,
  headers: {
    'Authorization': `Bearer ${PADDLE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// 测试函数
async function testPaddleConnection() {
  console.log('=== Paddle API 连接测试 ===');
  console.log('环境:', PADDLE_ENVIRONMENT);
  console.log('API密钥存在:', PADDLE_API_KEY ? '是' : '否');
  console.log('客户端令牌存在:', PADDLE_CLIENT_TOKEN ? '是' : '否');
  console.log('API基础URL:', PADDLE_CONFIG.baseURL);
  console.log('');

  try {
    // 测试1: 获取产品列表
    console.log('测试1: 获取产品列表...');
    const productsResponse = await paddleApi.get('/products');
    console.log('✓ 产品列表获取成功');
    console.log('  产品数量:', productsResponse.data.data.length);
    console.log('');

    // 测试2: 获取价格列表
    console.log('测试2: 获取价格列表...');
    const pricesResponse = await paddleApi.get('/prices');
    console.log('✓ 价格列表获取成功');
    console.log('  价格数量:', pricesResponse.data.data.length);
    console.log('');

    // 测试3: 获取业务信息
    console.log('测试3: 获取业务信息...');
    try {
      const businessResponse = await paddleApi.get('/business');
      console.log('✓ 业务信息获取成功');
      console.log('  业务名称:', businessResponse.data.data?.name || '未设置');
    } catch (businessError) {
      console.log('⚠ 业务信息获取失败，可能是权限问题:', businessError.response?.data?.error?.detail || businessError.message);
    }
    console.log('');

    // 测试4: 验证客户端令牌格式
    console.log('测试4: 验证客户端令牌格式...');
    if (PADDLE_ENVIRONMENT === 'sandbox') {
      if (PADDLE_CLIENT_TOKEN.startsWith('pdl_test_')) {
        console.log('✓ 沙盒环境客户端令牌格式正确');
      } else {
        console.log('⚠ 沙盒环境客户端令牌格式可能不正确，应以 pdl_test_ 开头');
      }
    } else {
      if (PADDLE_CLIENT_TOKEN.startsWith('pdl_live_')) {
        console.log('✓ 生产环境客户端令牌格式正确');
      } else {
        console.log('⚠ 生产环境客户端令牌格式可能不正确，应以 pdl_live_ 开头');
      }
    }
    console.log('');

    // 测试5: 验证API密钥格式
    console.log('测试5: 验证API密钥格式...');
    if (PADDLE_ENVIRONMENT === 'sandbox') {
      if (PADDLE_API_KEY.startsWith('pdl_sdbx_apikey_')) {
        console.log('✓ 沙盒环境API密钥格式正确');
      } else {
        console.log('⚠ 沙盒环境API密钥格式可能不正确，应以 pdl_sdbx_apikey_ 开头');
      }
    } else {
      if (PADDLE_API_KEY.startsWith('pdl_live_apikey_')) {
        console.log('✓ 生产环境API密钥格式正确');
      } else {
        console.log('⚠ 生产环境API密钥格式可能不正确，应以 pdl_live_apikey_ 开头');
      }
    }
    console.log('');

    // 测试6: 创建支付链接（使用第一个价格ID）
    console.log('测试6: 创建支付链接...');
    if (pricesResponse.data.data.length > 0) {
      const firstPriceId = pricesResponse.data.data[0].id;
      console.log('  使用价格ID:', firstPriceId);
      
      const paymentLinkResponse = await paddleApi.post('/payment-links', {
        items: [
          {
            price_id: firstPriceId,
            quantity: 1
          }
        ]
      });
      
      console.log('✓ 支付链接创建成功');
      console.log('  支付链接URL:', paymentLinkResponse.data.data.url);
      console.log('  支付链接ID:', paymentLinkResponse.data.data.id);
    } else {
      console.log('⚠ 没有可用的价格ID，跳过支付链接创建测试');
    }
    console.log('');

    console.log('=== 所有测试完成 ===');
    console.log('Paddle API连接和配置正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('API错误响应:');
      console.error('  状态码:', error.response.status);
      console.error('  错误数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求错误: 无法连接到Paddle API');
    } else {
      console.error('配置错误:', error.message);
    }
    
    process.exit(1);
  }
}

// 运行测试
testPaddleConnection();