# Stripe 支付测试指南

## 🔒 支付页面安全隔离确认

✅ **已修复的安全问题：**
- 支付页面错误时不再跳转到主应用dashboard
- 支付成功页面移除了返回主应用的按钮
- 支付相关路由完全独立于主应用认证系统

## 💳 Stripe 测试卡号

### 成功支付测试卡
```
卡号: 4242 4242 4242 4242
过期日期: 任何未来日期 (如: 12/25)
CVC: 任何3位数字 (如: 123)
邮编: 任何5位数字 (如: 12345)
```

### 其他测试场景

#### 1. 需要3D验证的卡
```
卡号: 4000 0027 6000 3184
过期日期: 任何未来日期
CVC: 任何3位数字
```

#### 2. 支付失败测试卡
```
卡号: 4000 0000 0000 0002 (卡被拒绝)
卡号: 4000 0000 0000 9995 (余额不足)
卡号: 4000 0000 0000 9987 (CVC错误)
卡号: 4000 0000 0000 9979 (过期卡)
```

#### 3. 不同国家/地区测试卡
```
美国: 4242 4242 4242 4242
英国: 4000 0082 6000 0000
法国: 4000 0025 0000 0003
德国: 4000 0027 6000 0016
```

## 🧪 支付测试步骤

### 1. 生成测试支付链接
```bash
# 在backend目录运行
cd G:\发票软件\backend
node -e "
const axios = require('axios');
(async () => {
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    
    // 获取未支付发票
    const invoicesResponse = await axios.get('http://localhost:8080/api/invoices', {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    
    const unpaidInvoice = invoicesResponse.data.find(inv => inv.status === 'pending');
    if (!unpaidInvoice) {
      console.log('没有找到未支付的发票');
      return;
    }
    
    // 生成支付链接
    const paymentLinkResponse = await axios.post(
      \`http://localhost:8080/api/invoices/\${unpaidInvoice.id}/payment-link\`,
      { paymentMethod: 'stripe' },
      { headers: { Authorization: \`Bearer \${token}\` } }
    );
    
    console.log('=== 支付测试链接 ===');
    console.log('支付URL:', paymentLinkResponse.data.paymentUrl);
    console.log('支付令牌:', paymentLinkResponse.data.token);
    console.log('发票金额:', unpaidInvoice.total, 'EUR');
    console.log('');
    console.log('请在浏览器中打开支付URL进行测试');
    
  } catch (error) {
    console.error('生成支付链接失败:', error.response?.data || error.message);
  }
})();
"
```

### 2. 测试支付流程

1. **打开支付页面**
   - 使用上面生成的支付URL
   - 确认发票信息显示正确

2. **填写测试卡信息**
   - 卡号: `4242 4242 4242 4242`
   - 过期日期: `12/25`
   - CVC: `123`
   - 邮编: `12345`

3. **提交支付**
   - 点击"安全支付"按钮
   - 观察支付处理过程

4. **验证支付结果**
   - 成功: 应显示支付成功页面
   - 失败: 应显示错误信息，不跳转到其他页面

### 3. 测试错误场景

#### 测试支付失败
- 使用失败测试卡号 `4000 0000 0000 0002`
- 确认显示错误信息
- 确认不会跳转到dashboard或其他主应用页面

#### 测试无效令牌
- 访问 `http://localhost:3000/payment/invalid-token`
- 确认显示"发票未找到或支付链接已过期"
- 确认有重新加载按钮

## 🔐 安全规范验证

### 1. 页面隔离检查
- ✅ 支付页面不包含主应用导航
- ✅ 错误时不跳转到主应用
- ✅ 成功后不提供返回主应用的链接
- ✅ 支付路由独立于认证系统

### 2. 数据安全检查
- ✅ 支付令牌有过期时间(30天)
- ✅ 支付令牌是一次性使用
- ✅ 客户端不存储敏感支付信息
- ✅ 使用HTTPS加密传输

### 3. Stripe安全最佳实践
- ✅ 使用Stripe Elements安全收集卡信息
- ✅ 客户端不处理真实卡号
- ✅ 支付确认在服务端完成
- ✅ 使用clientSecret进行支付验证

## 📋 测试检查清单

- [ ] 支付页面正常加载发票信息
- [ ] 使用成功测试卡能完成支付
- [ ] 使用失败测试卡显示正确错误信息
- [ ] 支付成功后显示成功页面
- [ ] 支付失败时不跳转到主应用
- [ ] 无效令牌显示正确错误页面
- [ ] 支付页面完全独立于主应用
- [ ] SSL加密保护提示显示正确

## 🚨 注意事项

1. **测试环境**: 确保使用Stripe测试密钥，不要在生产环境测试
2. **数据隔离**: 支付页面客户看不到主应用的任何信息
3. **错误处理**: 所有错误都在支付页面内处理，不跳转
4. **安全提示**: 页面底部显示SSL加密保护提示
5. **令牌安全**: 支付令牌只能使用一次，有效期30天

## 🔗 相关文档

- [Stripe测试卡文档](https://stripe.com/docs/testing#cards)
- [Stripe Elements文档](https://stripe.com/docs/stripe-js)
- [支付安全最佳实践](https://stripe.com/docs/security)