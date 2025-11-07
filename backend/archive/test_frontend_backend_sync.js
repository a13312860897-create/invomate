const axios = require('axios');

// 测试前端和后端数据同步
async function testFrontendBackendSync() {
    console.log('=== 测试前端和后端数据同步 ===\n');

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

        // 2. 获取发票列表（模拟前端发票页面的API调用）
        console.log('2. 获取发票列表（模拟前端发票页面）...');
        const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.data || invoicesResponse.data;
        console.log(`获取到 ${invoices.length} 张发票`);

        // 统计各状态发票数量
        const statusCount = {};
        invoices.forEach(invoice => {
            statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
        });
        console.log('发票状态统计:', statusCount);

        // 3. 获取仪表板统计数据
        console.log('\n3. 获取仪表板统计数据...');
        const dashboardResponse = await axios.get('http://localhost:3002/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const dashboardStats = dashboardResponse.data.data || dashboardResponse.data;
        console.log('仪表板统计:', {
            totalInvoices: dashboardStats.totalInvoices,
            totalRevenue: dashboardStats.totalRevenue,
            pendingAmount: dashboardStats.pendingAmount,
            overdueCount: dashboardStats.overdueCount
        });

        // 4. 获取发票状态分布（模拟仪表板图表数据）
        console.log('\n4. 获取发票状态分布...');
        const statusDistResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const statusDistribution = statusDistResponse.data.statusDistribution || [];
        console.log('状态分布数据:');
        statusDistribution.forEach(status => {
            console.log(`  ${status.status}: ${status.count}张, ${status.amount}€`);
        });

        // 5. 数据一致性检查
        console.log('\n5. 数据一致性检查...');
        
        // 检查发票列表和状态分布的数据是否一致
        const listTotalCount = invoices.length;
        const distributionTotalCount = statusDistribution.reduce((sum, status) => sum + status.count, 0);
        
        console.log(`发票列表总数: ${listTotalCount}`);
        console.log(`状态分布总数: ${distributionTotalCount}`);
        console.log(`数据一致性: ${listTotalCount === distributionTotalCount ? '✓ 一致' : '✗ 不一致'}`);

        // 检查各状态数量是否一致
        console.log('\n各状态数量对比:');
        const allStatuses = new Set([...Object.keys(statusCount), ...statusDistribution.map(s => s.status)]);
        let statusConsistent = true;
        
        allStatuses.forEach(status => {
            const listCount = statusCount[status] || 0;
            const distCount = statusDistribution.find(s => s.status === status)?.count || 0;
            const isConsistent = listCount === distCount;
            if (!isConsistent) statusConsistent = false;
            
            console.log(`  ${status}: 列表=${listCount}, 分布=${distCount} ${isConsistent ? '✓' : '✗'}`);
        });

        console.log(`\n状态数量一致性: ${statusConsistent ? '✓ 一致' : '✗ 不一致'}`);

        // 6. 测试发票状态更新后的数据同步
        console.log('\n6. 测试发票状态更新后的数据同步...');
        
        if (invoices.length > 0) {
            const testInvoice = invoices.find(inv => inv.status === 'draft' || inv.status === 'sent') || invoices[0];
            const originalStatus = testInvoice.status;
            const newStatus = originalStatus === 'draft' ? 'sent' : 'paid';
            
            console.log(`选择发票ID ${testInvoice.id}，原状态: ${originalStatus}`);
            
            // 更新发票状态
            console.log(`更新状态为: ${newStatus}`);
            await axios.put(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
                status: newStatus
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // 重新获取发票列表
            const updatedInvoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const updatedInvoices = updatedInvoicesResponse.data.data?.invoices || updatedInvoicesResponse.data.data || updatedInvoicesResponse.data;
            const updatedInvoice = updatedInvoices.find(inv => inv.id === testInvoice.id);
            
            // 重新获取状态分布
            const updatedStatusDistResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const updatedStatusDistribution = updatedStatusDistResponse.data.statusDistribution || [];
            
            console.log(`发票列表中的状态: ${updatedInvoice?.status}`);
            console.log(`状态更新是否成功: ${updatedInvoice?.status === newStatus ? '✓' : '✗'}`);
            
            // 检查状态分布是否同步更新
            const newStatusInDist = updatedStatusDistribution.find(s => s.status === newStatus);
            const oldStatusInDist = updatedStatusDistribution.find(s => s.status === originalStatus);
            
            console.log(`新状态在分布中的数量: ${newStatusInDist?.count || 0}`);
            console.log(`原状态在分布中的数量: ${oldStatusInDist?.count || 0}`);
            
            // 恢复原始状态
            console.log(`\n恢复原始状态: ${originalStatus}`);
            await axios.put(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
                status: originalStatus
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('状态已恢复');
        }

        console.log('\n=== 前端和后端数据同步测试完成 ===');

    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testFrontendBackendSync();