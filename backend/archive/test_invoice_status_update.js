const axios = require('axios');

// 测试发票状态更新API的数据一致性
async function testInvoiceStatusUpdate() {
    console.log('=== 测试发票状态更新API数据一致性 ===\n');

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

        // 2. 获取所有发票
        console.log('2. 获取所有发票...');
        const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.data || invoicesResponse.data;
        console.log(`获取到 ${invoices.length} 张发票\n`);

        if (invoices.length === 0) {
            console.log('没有发票可供测试');
            return;
        }

        // 3. 选择一张发票进行状态更新测试
        const testInvoice = invoices.find(inv => inv.status === 'draft' || inv.status === 'sent');
        if (!testInvoice) {
            console.log('没有找到可以更新状态的发票（需要draft或sent状态）');
            return;
        }

        console.log(`3. 测试发票状态更新 - 发票ID: ${testInvoice.id}`);
        console.log(`原始状态: ${testInvoice.status}`);

        // 4. 更新发票状态（使用PUT方法）
        const newStatus = testInvoice.status === 'draft' ? 'sent' : 'paid';
        console.log(`\n4. 使用PUT方法更新状态为: ${newStatus}`);
        
        const updateResponse = await axios.put(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
            status: newStatus
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('PUT更新响应:', updateResponse.data.message);

        // 5. 验证更新后的状态
        console.log('\n5. 验证更新后的状态...');
        const updatedInvoiceResponse = await axios.get(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const updatedInvoice = updatedInvoiceResponse.data.data?.invoice || updatedInvoiceResponse.data.invoice || updatedInvoiceResponse.data;
        console.log(`更新后状态: ${updatedInvoice.status}`);
        console.log(`状态更新是否成功: ${updatedInvoice.status === newStatus ? '✓' : '✗'}`);

        // 6. 测试PATCH方法更新状态
        const patchStatus = updatedInvoice.status === 'sent' ? 'paid' : 'sent';
        console.log(`\n6. 使用PATCH方法更新状态为: ${patchStatus}`);
        
        const patchResponse = await axios.patch(`http://localhost:3002/api/invoices/${testInvoice.id}/status`, {
            status: patchStatus
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('PATCH更新响应:', patchResponse.data.message);

        // 7. 再次验证状态
        console.log('\n7. 验证PATCH更新后的状态...');
        const finalInvoiceResponse = await axios.get(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const finalInvoice = finalInvoiceResponse.data.data?.invoice || finalInvoiceResponse.data.invoice || finalInvoiceResponse.data;
        console.log(`最终状态: ${finalInvoice.status}`);
        console.log(`PATCH状态更新是否成功: ${finalInvoice.status === patchStatus ? '✓' : '✗'}`);

        // 8. 检查发票状态分布API是否反映了更新
        console.log('\n8. 检查发票状态分布API...');
        const statusDistResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('状态分布API响应:');
        console.log('完整响应:', JSON.stringify(statusDistResponse.data, null, 2));
        const distribution = statusDistResponse.data.distribution || statusDistResponse.data;
        if (Array.isArray(distribution)) {
            distribution.forEach(item => {
                console.log(`  ${item.status}: ${item.count}张, 总额: ${item.amount}`);
            });
        } else {
            console.log('状态分布数据格式异常:', distribution);
        }

        // 9. 恢复原始状态
        console.log(`\n9. 恢复原始状态: ${testInvoice.status}`);
        await axios.put(`http://localhost:3002/api/invoices/${testInvoice.id}`, {
            status: testInvoice.status
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('状态已恢复到原始值');
        console.log('\n=== 发票状态更新API测试完成 ===');

    } catch (error) {
        console.error('测试失败:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('认证失败，可能是token无效或JWT_SECRET不匹配');
        }
    }
}

testInvoiceStatusUpdate();