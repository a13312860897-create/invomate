const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testAPIsWithAuth() {
    try {
        console.log('=== 登录获取认证token ===');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: 'Ddtb959322'
        });
        
        console.log('登录状态码:', loginResponse.status);
        console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
        const token = loginResponse.data.data.token;
        console.log('获取到token:', token ? '成功' : '失败');
        
        if (!token) {
            console.error('登录失败，无法获取token');
            return;
        }
        
        // 设置认证头
        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('\n=== 测试本月收入趋势API ===');
        const monthlyResponse = await axios.get(`${BASE_URL}/dashboard/monthly-revenue-trend`, {
            params: { userId: 1, month: '2025-09' },
            headers: authHeaders
        });
        
        console.log('本月收入趋势API响应:');
        console.log('状态码:', monthlyResponse.status);
        console.log('数据:', JSON.stringify(monthlyResponse.data, null, 2));
        
        // 计算总收入和总数量
        const monthlyData = monthlyResponse.data;
        let monthlyTotalRevenue = 0;
        let monthlyTotalCount = 0;
        
        if (monthlyData && monthlyData.chartData && monthlyData.chartData.length > 0) {
            monthlyData.chartData.forEach(point => {
                monthlyTotalRevenue += point.revenue || 0;
                monthlyTotalCount += point.count || 0;
            });
        }
        
        console.log('本月收入趋势API - 总收入:', monthlyTotalRevenue);
        console.log('本月收入趋势API - 总数量:', monthlyTotalCount);
        
        console.log('\n=== 测试统一图表数据API ===');
        const unifiedResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data`, {
            params: { userId: 1, month: '2025-09' },
            headers: authHeaders
        });
        
        console.log('统一图表数据API响应:');
        console.log('状态码:', unifiedResponse.status);
        console.log('数据:', JSON.stringify(unifiedResponse.data, null, 2));
        
        // 调试：检查统一API的数据结构
        console.log('\n=== 统一API数据结构调试 ===');
        console.log('响应数据键:', Object.keys(unifiedResponse.data));
        if (unifiedResponse.data.revenueTrend) {
            console.log('revenueTrend键:', Object.keys(unifiedResponse.data.revenueTrend));
        }
        
        // 提取收入趋势数据
        const unifiedData = unifiedResponse.data.data; // 修正：需要访问data.data
        let unifiedTotalRevenue = 0;
        let unifiedTotalCount = 0;
        
        console.log('\n=== 统一API收入趋势数据结构调试 ===');
        if (unifiedData && unifiedData.revenueTrend) {
            console.log('revenueTrend存在:', true);
            console.log('revenueTrend键:', Object.keys(unifiedData.revenueTrend));
            
            if (unifiedData.revenueTrend.timePoints) {
                console.log('timePoints存在:', true);
                console.log('timePoints长度:', unifiedData.revenueTrend.timePoints.length);
                console.log('前3个数据点:', JSON.stringify(unifiedData.revenueTrend.timePoints.slice(0, 3), null, 2));
                
                // 计算总收入和总数量
                unifiedData.revenueTrend.timePoints.forEach(point => {
                    unifiedTotalRevenue += point.revenue || 0;
                    unifiedTotalCount += point.count || 0;
                });
            } else {
                console.log('timePoints不存在');
            }
        } else {
            console.log('revenueTrend不存在');
            if (unifiedData) {
                console.log('unifiedData键:', Object.keys(unifiedData));
            }
        }
        
        console.log('统一图表数据API - 总收入:', unifiedTotalRevenue);
        console.log('统一图表数据API - 总数量:', unifiedTotalCount);
        
        console.log('\n=== 数据对比 ===');
        console.log('本月收入趋势API:', { revenue: monthlyTotalRevenue, count: monthlyTotalCount });
        console.log('统一图表数据API:', { revenue: unifiedTotalRevenue, count: unifiedTotalCount });
        console.log('数据是否一致:', monthlyTotalRevenue === unifiedTotalRevenue && monthlyTotalCount === unifiedTotalCount);
        
        if (monthlyTotalRevenue !== unifiedTotalRevenue || monthlyTotalCount !== unifiedTotalCount) {
            console.log('\n=== 数据不一致分析 ===');
            console.log('收入差异:', unifiedTotalRevenue - monthlyTotalRevenue);
            console.log('数量差异:', unifiedTotalCount - monthlyTotalCount);
        }
        
    } catch (error) {
        console.error('API测试失败:', error.message);
        console.error('错误详情:', error);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        if (error.code) {
            console.error('错误代码:', error.code);
        }
    }
}

testAPIsWithAuth();