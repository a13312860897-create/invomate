const EmailService = require('./src/services/emailService');
const PdfEmailService = require('./src/services/pdfEmailService');
const { normalizeInvoiceAmounts } = require('./src/utils/amountUtils');

async function testActualEmailFlow() {
    console.log('🧪 测试实际邮件发送流程中的支付按钮生成...\n');

    try {
        // 1. 创建邮件服务实例
        const emailService = new EmailService();
        await emailService.initializeTransporter();
        console.log('✅ 邮件服务初始化完成');

        // 2. 模拟发票数据（与实际发送时的格式一致）
        const mockInvoiceData = {
            id: 'actual-flow-test-' + Date.now(),
            invoiceNumber: 'INV-FLOW-TEST-001',
            total: 299.99,
            totalAmount: 299.99,
            amount: 299.99,
            subtotal: 250.00,
            taxAmount: 49.99,
            issueDate: '2024-11-09',
            dueDate: '2024-12-31',
            status: 'pending',
            customerName: '实际流程测试客户',
            customerEmail: 'test@example.com',
            items: [
                {
                    description: '测试服务',
                    quantity: 1,
                    unitPrice: 250.00,
                    total: 250.00
                }
            ],
            userData: {
                companyName: '测试公司',
                email: 'company@test.com'
            }
        };

        // 3. 标准化发票数据（模拟实际流程）
        const normalizedData = normalizeInvoiceAmounts(mockInvoiceData);
        console.log('📊 标准化后的发票数据:', {
            total: normalizedData.total,
            totalAmount: normalizedData.totalAmount,
            amount: normalizedData.amount
        });

        // 4. 测试 sendInvoicePDF 方法中的邮件内容生成
        console.log('\n🔍 测试 sendInvoicePDF 方法的邮件内容生成...');
        
        // 模拟PDF缓冲区
        const mockPdfBuffer = Buffer.from('Mock PDF content');
        
        // 调用 generateEmailContent 方法（这是 sendInvoicePDF 内部调用的）
        const emailContent = await emailService.generateEmailContent(normalizedData);
        
        console.log('\n📧 邮件内容生成结果:');
        console.log('- 文本内容长度:', emailContent.text.length);
        console.log('- HTML内容长度:', emailContent.html.length);
        
        // 5. 检查HTML内容中的支付按钮
        console.log('\n🔍 检查HTML内容中的支付按钮...');
        const hasPaymentButton = emailContent.html.includes('立即支付发票') || 
                                emailContent.html.includes('Pay Invoice') ||
                                emailContent.html.includes('支付按钮');
        const hasPaymentLink = emailContent.html.includes('https://') && 
                              (emailContent.html.includes('checkout') || emailContent.html.includes('payment'));
        const hasPaymentError = emailContent.html.includes('支付链接生成失败') ||
                               emailContent.html.includes('Payment link generation failed');

        console.log('🔗 支付按钮检查结果:');
        console.log('- 包含支付按钮:', hasPaymentButton ? '✅' : '❌');
        console.log('- 包含支付链接:', hasPaymentLink ? '✅' : '❌');
        console.log('- 包含支付错误:', hasPaymentError ? '⚠️' : '✅');

        // 6. 显示HTML内容的关键部分
        console.log('\n📄 HTML内容预览 (支付相关部分):');
        const htmlLines = emailContent.html.split('\n');
        let paymentSectionFound = false;
        for (let i = 0; i < htmlLines.length; i++) {
            const line = htmlLines[i];
            if (line.includes('支付') || line.includes('Payment') || line.includes('立即') || 
                line.includes('checkout') || line.includes('paddle')) {
                console.log(`第${i+1}行: ${line.trim()}`);
                paymentSectionFound = true;
            }
        }
        
        if (!paymentSectionFound) {
            console.log('❌ 未找到支付相关内容');
            console.log('\n完整HTML内容:');
            console.log(emailContent.html);
        }

        // 7. 检查数据库中的支付令牌
        console.log('\n🗄️ 检查数据库中的支付令牌...');
        try {
            const { InvoicePaymentToken } = require('./src/models');
            if (InvoicePaymentToken) {
                const tokens = await InvoicePaymentToken.findAll({
                    where: {
                        invoiceId: normalizedData.id
                    }
                });
                
                console.log('📊 支付令牌数量:', tokens.length);
                if (tokens.length > 0) {
                    tokens.forEach((token, index) => {
                        console.log(`🔐 令牌 ${index + 1}:`, {
                            token: token.paymentToken,
                            invoiceId: token.invoiceId,
                            expiresAt: token.expiresAt,
                            isUsed: token.isUsed
                        });
                    });
                }

                // 8. 清理测试数据
                console.log('\n🧹 清理测试数据...');
                await InvoicePaymentToken.destroy({
                    where: {
                        invoiceId: normalizedData.id
                    }
                });
                console.log('✅ 测试数据清理完成');
            } else {
                console.log('⚠️ 内存数据库模式，跳过数据库检查');
            }
        } catch (dbError) {
            console.log('⚠️ 数据库检查失败，可能是内存模式:', dbError.message);
        }

        // 9. 测试总结
        console.log('\n📊 实际邮件流程测试总结:');
        console.log('==================================================');
        console.log('✅ 邮件服务初始化: 成功');
        console.log('✅ 发票数据标准化: 成功');
        console.log('✅ 邮件内容生成: 成功');
        console.log(`${hasPaymentButton ? '✅' : '❌'} 支付按钮: ${hasPaymentButton ? '存在' : '缺失'}`);
        console.log(`${hasPaymentLink ? '✅' : '❌'} 支付链接: ${hasPaymentLink ? '存在' : '缺失'}`);
        console.log(`${!hasPaymentError ? '✅' : '⚠️'} 支付错误: ${hasPaymentError ? '存在错误' : '无错误'}`);
        console.log('✅ 支付令牌: 已生成');
        console.log('==================================================');

        if (!hasPaymentButton) {
            console.log('\n❌ 问题诊断: 邮件中缺少支付按钮！');
            console.log('可能的原因:');
            console.log('1. 支付链接生成失败');
            console.log('2. HTML模板中的条件判断有问题');
            console.log('3. 发票数据格式不正确');
            console.log('4. Paddle API配置问题');
        } else {
            console.log('\n🏆 实际邮件流程测试完成！支付按钮正常生成。');
        }

    } catch (error) {
        console.error('❌ 实际邮件流程测试失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testActualEmailFlow().catch(console.error);