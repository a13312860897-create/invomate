const axios = require('axios');

// 测试分页导致的数据不一致问题
async function testPaginationIssue() {
    console.log('=== 测试分页导致的数据不一致问题 ===\n');

    try {
        // 1. 登录获取token
        console.log('1. 登录获取token...');
        const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'a133128860897@163.com',
            password: 'Ddtb959322'
        });

        if (!loginResponse.data.success) {
            throw new Error('登录失败: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.data.token;
        console.log('登录成功，获取到token\n');

        // 2. 获取发票列表（默认分页）
        console.log('2. 获取发票列表（默认分页，每页10张）...');
        const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const invoicesData = invoicesResponse.data.data;
        const invoices = invoicesData.invoices;
        const pagination = invoicesData.pagination;
        
        console.log(`获取到 ${invoices.length} 张发票`);
        console.log('分页信息:', {
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            itemsPerPage: pagination.itemsPerPage
        });

        // 3. 获取所有发票（不分页）
        console.log('\n3. 获取所有发票（设置大的limit值）...');
        const allInvoicesResponse = await axios.get('http://localhost:3002/api/invoices?limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const allInvoicesData = allInvoicesResponse.data.data;
        const allInvoices = allInvoicesData.invoices;
        
        console.log(`获取到所有 ${allInvoices.length} 张发票`);

        // 统计所有发票的状态
        const allStatusCount = {};
        allInvoices.forEach(invoice => {
            allStatusCount[invoice.status] = (allStatusCount[invoice.status] || 0) + 1;
        });
        console.log('所有发票状态统计:', allStatusCount);

        // 4. 获取发票状态分布
        console.log('\n4. 获取发票状态分布...');
        const statusDistResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const statusDistribution = statusDistResponse.data.statusDistribution || [];
        const distributionStatusCount = {};
        statusDistribution.forEach(status => {
            distributionStatusCount[status.status] = status.count;
        });
        
        console.log('状态分布统计:', distributionStatusCount);

        // 5. 数据一致性检查
        console.log('\n5. 数据一致性检查...');
        
        const allInvoicesTotal = allInvoices.length;
        const distributionTotal = statusDistribution.reduce((sum, status) => sum + status.count, 0);
        
        console.log(`所有发票总数: ${allInvoicesTotal}`);
        console.log(`状态分布总数: ${distributionTotal}`);
        console.log(`数据一致性: ${allInvoicesTotal === distributionTotal ? '✓ 一致' : '✗ 不一致'}`);

        // 检查各状态数量是否一致
        console.log('\n各状态数量对比（所有发票 vs 状态分布）:');
        const allStatuses = new Set([...Object.keys(allStatusCount), ...Object.keys(distributionStatusCount)]);
        let statusConsistent = true;
        
        allStatuses.forEach(status => {
            const allCount = allStatusCount[status] || 0;
            const distCount = distributionStatusCount[status] || 0;
            const isConsistent = allCount === distCount;
            if (!isConsistent) statusConsistent = false;
            
            console.log(`  ${status}: 所有发票=${allCount}, 分布=${distCount} ${isConsistent ? '✓' : '✗'}`);
        });

        console.log(`\n状态数量一致性: ${statusConsistent ? '✓ 一致' : '✗ 不一致'}`);

        // 6. 测试前端可能遇到的问题
        console.log('\n6. 模拟前端可能遇到的问题...');
        console.log('前端发票页面显示的发票数量（分页）:', invoices.length);
        console.log('前端仪表板显示的总发票数（状态分布）:', distributionTotal);
        console.log('用户可能看到的不一致现象: 发票页面显示10张，但仪表板显示21张总发票');

        // 7. 验证分页功能
        console.log('\n7. 验证分页功能...');
        if (pagination.totalPages > 1) {
            console.log(`总共有 ${pagination.totalPages} 页，测试获取第2页...`);
            const page2Response = await axios.get('http://localhost:3002/api/invoices?page=2', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const page2Data = page2Response.data.data;
            console.log(`第2页发票数量: ${page2Data.invoices.length}`);
            console.log(`第1页 + 第2页总数: ${invoices.length + page2Data.invoices.length}`);
        }

        console.log('\n=== 分页问题测试完成 ===');
        console.log('\n结论:');
        console.log('1. 发票列表API使用分页，默认每页10张发票');
        console.log('2. 状态分布API返回所有发票的统计数据');
        console.log('3. 这导致前端不同页面显示的数据不一致');
        console.log('4. 前端需要正确处理分页数据，或者在需要总数时使用合适的API');

    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testPaginationIssue();