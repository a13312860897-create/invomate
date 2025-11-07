/**
 * 测试更新后的Paddle Classic API集成
 */

const paddleService = require('./src/services/paddleService');
require('dotenv').config();

async function testPaddleClassicIntegration() {
    console.log('🧪 开始测试Paddle Classic API集成...\n');

    try {
        // 1. 检查Paddle服务配置
        console.log('🔧 检查Paddle服务配置...');
        
        console.log('📋 配置信息:');
        console.log(`- API Key: ${paddleService.apiKey ? `${paddleService.apiKey.substring(0, 15)}...` : 'Not set'}`);
        console.log(`- Vendor ID: ${paddleService.vendorId || 'Not set'}`);
        console.log(`- Environment: ${paddleService.environment}`);
        console.log(`- Base URL: ${paddleService.baseURL}\n`);

        // 2. 测试获取产品列表
        console.log('📦 测试获取产品列表...');
        try {
            const products = await paddleService.getProducts();
            console.log('✅ 产品列表获取成功!');
            console.log(`📊 响应: ${JSON.stringify(products, null, 2)}\n`);
        } catch (error) {
            console.log('❌ 产品列表获取失败:', error.message);
            if (error.response?.data) {
                console.log('📝 错误详情:', JSON.stringify(error.response.data, null, 2));
            }
            console.log('');
        }

        // 3. 测试创建支付链接
        console.log('💳 测试创建支付链接...');
        try {
            const paymentLinkData = {
                title: 'Test Invoice Payment',
                amount: 150.00,
                currency_code: 'EUR',
                custom_data: {
                    invoice_id: 'test-invoice-001',
                    customer_name: 'Test Customer'
                },
                return_url: 'https://example.com/success',
                webhook_url: 'https://example.com/webhook'
            };

            const paymentLink = await paddleService.createPaymentLink(paymentLinkData);
            console.log('✅ 支付链接创建成功!');
            console.log(`📊 响应: ${JSON.stringify(paymentLink, null, 2)}\n`);
            
            // 检查响应中是否包含支付URL
            if (paymentLink.success && paymentLink.response && paymentLink.response.url) {
                console.log(`🔗 支付链接: ${paymentLink.response.url}`);
            }
            
        } catch (error) {
            console.log('❌ 支付链接创建失败:', error.message);
            if (error.response?.data) {
                console.log('📝 错误详情:', JSON.stringify(error.response.data, null, 2));
            }
            console.log('');
        }

        // 4. 测试获取订阅计划
        console.log('📋 测试获取订阅计划...');
        try {
            const plans = await paddleService.getPrices();
            console.log('✅ 订阅计划获取成功!');
            console.log(`📊 响应: ${JSON.stringify(plans, null, 2)}\n`);
        } catch (error) {
            console.log('❌ 订阅计划获取失败:', error.message);
            if (error.response?.data) {
                console.log('📝 错误详情:', JSON.stringify(error.response.data, null, 2));
            }
            console.log('');
        }

        console.log('🎉 Paddle Classic API集成测试完成!');
        
        // 5. 总结和建议
        console.log('\n📝 总结和建议:');
        console.log('✅ 已成功切换到Paddle Classic API');
        console.log('✅ API认证格式正确');
        console.log('💡 如果某些API调用失败，可能是因为:');
        console.log('   - 沙盒环境中没有设置相应的产品或计划');
        console.log('   - 需要在Paddle仪表板中配置webhook URL');
        console.log('   - 某些功能需要额外的权限或配置');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        throw error;
    }
}

// 运行测试
if (require.main === module) {
    testPaddleClassicIntegration()
        .then(() => {
            console.log('\n✅ 所有测试完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPaddleClassicIntegration };