/**
 * 测试Paddle API连接
 */

// 加载环境变量
require('dotenv').config();

const paddleService = require('./src/services/paddleService');

async function testPaddleAPI() {
    console.log('🧪 开始测试Paddle API连接...');
    
    console.log('🔧 Paddle配置:');
    console.log('- Environment:', paddleService.environment);
    console.log('- Base URL:', paddleService.baseURL);
    console.log('- API Key:', paddleService.apiKey ? `${paddleService.apiKey.substring(0, 10)}...` : 'Not set');
    
    try {
        // 测试获取产品列表
        console.log('\n📦 测试获取产品列表...');
        const products = await paddleService.getProducts();
        console.log('✅ 产品列表获取成功:', products);
        
    } catch (error) {
        console.error('❌ 产品列表获取失败:', error.response?.data || error.message);
    }
    
    try {
        // 测试获取价格列表
        console.log('\n💰 测试获取价格列表...');
        const prices = await paddleService.getPrices();
        console.log('✅ 价格列表获取成功:', prices);
        
    } catch (error) {
        console.error('❌ 价格列表获取失败:', error.response?.data || error.message);
    }
    
    try {
        // 测试创建支付链接
        console.log('\n🔗 测试创建支付链接...');
        const paymentLinkData = {
            items: [
                {
                    price_id: 'pri_01k8fvwxgq48qv7smd2e5k3rhz', // 这需要是一个有效的价格ID
                    quantity: 1
                }
            ]
        };
        
        const paymentLink = await paddleService.createPaymentLink(paymentLinkData);
        console.log('✅ 支付链接创建成功:', paymentLink);
        
    } catch (error) {
        console.error('❌ 支付链接创建失败:', error.response?.data || error.message);
        console.error('完整错误:', error.response?.status, error.response?.statusText);
    }
}

// 运行测试
testPaddleAPI().then(() => {
    console.log('\n🏁 Paddle API测试完成');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
});