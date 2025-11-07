/**
 * Paddle API认证诊断脚本
 * 检查API密钥格式、API版本和认证问题
 */

const axios = require('axios');
require('dotenv').config();

async function diagnosePaddleAuth() {
    console.log('🔍 开始诊断Paddle API认证问题...\n');

    const apiKey = process.env.PADDLE_API_KEY;
    const environment = process.env.PADDLE_ENVIRONMENT || 'sandbox';

    console.log('📋 当前配置:');
    console.log(`- API Key: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'Not set'}`);
    console.log(`- Environment: ${environment}`);
    console.log(`- API Key Length: ${apiKey ? apiKey.length : 0}`);
    console.log(`- API Key Format: ${apiKey ? (apiKey.startsWith('test_') ? 'Test Key' : apiKey.startsWith('live_') ? 'Live Key' : 'Unknown Format') : 'N/A'}\n`);

    // 检查API密钥格式
    if (!apiKey) {
        console.error('❌ API密钥未设置');
        return;
    }

    if (environment === 'sandbox' && !apiKey.startsWith('test_')) {
        console.warn('⚠️  沙盒环境应使用test_开头的API密钥');
    }

    if (environment === 'production' && !apiKey.startsWith('live_')) {
        console.warn('⚠️  生产环境应使用live_开头的API密钥');
    }

    // 测试不同的API端点和版本
    const testConfigs = [
        {
            name: 'Paddle Billing API (Current)',
            baseURL: environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Paddle-Version': '1'
            },
            endpoint: '/products'
        },
        {
            name: 'Paddle Classic API',
            baseURL: environment === 'production' ? 'https://vendors.paddle.com/api/2.0' : 'https://sandbox-vendors.paddle.com/api/2.0',
            headers: {
                'Content-Type': 'application/json'
            },
            endpoint: '/product/get_products',
            data: {
                vendor_id: process.env.PADDLE_VENDOR_ID,
                vendor_auth_code: apiKey
            }
        },
        {
            name: 'Paddle Billing API (No Version)',
            baseURL: environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            endpoint: '/products'
        }
    ];

    for (const config of testConfigs) {
        console.log(`🧪 测试 ${config.name}...`);
        console.log(`   URL: ${config.baseURL}${config.endpoint}`);
        
        try {
            const axiosConfig = {
                method: config.data ? 'POST' : 'GET',
                url: `${config.baseURL}${config.endpoint}`,
                headers: config.headers,
                timeout: 10000
            };

            if (config.data) {
                axiosConfig.data = config.data;
            }

            const response = await axios(axiosConfig);
            console.log(`   ✅ 成功! 状态码: ${response.status}`);
            console.log(`   📊 响应数据类型: ${typeof response.data}`);
            
            if (response.data && typeof response.data === 'object') {
                const keys = Object.keys(response.data);
                console.log(`   🔑 响应字段: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
            }
            
        } catch (error) {
            console.log(`   ❌ 失败: ${error.message}`);
            
            if (error.response) {
                console.log(`   📄 状态码: ${error.response.status}`);
                console.log(`   📝 错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
            } else if (error.request) {
                console.log(`   🌐 网络错误: 无法连接到服务器`);
            }
        }
        console.log('');
    }

    // 检查API密钥格式建议
    console.log('💡 建议和解决方案:');
    
    if (apiKey.startsWith('test_')) {
        console.log('✅ API密钥格式正确 (测试环境)');
        console.log('📝 如果认证失败，请检查:');
        console.log('   1. API密钥是否有效且未过期');
        console.log('   2. 是否使用了正确的Paddle API版本');
        console.log('   3. 账户是否有访问相应API的权限');
    } else {
        console.log('⚠️  API密钥格式可能不正确');
        console.log('📝 Paddle Billing API密钥应该:');
        console.log('   - 测试环境: 以 "test_" 开头');
        console.log('   - 生产环境: 以 "live_" 开头');
        console.log('   - 长度通常为 40-50 个字符');
    }

    console.log('\n🔗 有用的链接:');
    console.log('- Paddle Billing API文档: https://developer.paddle.com/api-reference/overview');
    console.log('- API密钥管理: https://sandbox-vendors.paddle.com/authentication');
    console.log('- Paddle Classic vs Billing: https://developer.paddle.com/classic/guides-reference/classic-vs-billing');
}

// 运行诊断
if (require.main === module) {
    diagnosePaddleAuth()
        .then(() => {
            console.log('\n🏁 诊断完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 诊断过程中发生错误:', error);
            process.exit(1);
        });
}

module.exports = { diagnosePaddleAuth };