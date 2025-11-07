# QQ邮箱SMTP设置指南

## 为什么选择QQ邮箱？

QQ邮箱的SMTP服务相比163邮箱更加稳定，设置也更简单：
- ✅ 授权码设置更直观
- ✅ SMTP连接更稳定
- ✅ 错误提示更清晰
- ✅ 支持更好

## QQ邮箱SMTP设置步骤

### 1. 登录QQ邮箱
- 访问：https://mail.qq.com
- 使用您的QQ号登录

### 2. 开启SMTP服务
1. 点击右上角的"设置"
2. 选择"账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"IMAP/SMTP服务"

### 3. 生成授权码
1. 在开启SMTP服务时，系统会提示设置授权码
2. 发送短信到指定号码（按页面提示操作）
3. 系统会生成一个16位的授权码
4. **重要：这个授权码就是SMTP密码，不是QQ密码！**

### 4. 推荐的QQ邮箱SMTP配置

```env
# QQ邮箱SMTP配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=您的QQ号@qq.com
SMTP_PASS=生成的16位授权码
FROM_EMAIL=您的QQ号@qq.com
```

### 5. 测试配置

使用以下Node.js代码测试：

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: '您的QQ号@qq.com',
        pass: '您的授权码'
    }
});

// 测试连接
transporter.verify((error, success) => {
    if (error) {
        console.log('连接失败:', error);
    } else {
        console.log('连接成功!');
    }
});
```

## 常见问题

### Q: 为什么选择QQ邮箱而不是163邮箱？
A: QQ邮箱的SMTP服务更稳定，授权码设置更简单，错误提示更清晰。

### Q: 授权码和QQ密码有什么区别？
A: 授权码是专门用于第三方应用的密码，QQ密码是登录QQ邮箱的密码。SMTP必须使用授权码。

### Q: 授权码忘记了怎么办？
A: 可以重新生成授权码，旧的会自动失效。

### Q: 还是连接失败怎么办？
A: 请检查：
1. QQ邮箱地址是否正确
2. 授权码是否正确复制
3. SMTP服务是否已开启
4. 网络连接是否正常

## 优势对比

| 特性 | QQ邮箱 | 163邮箱 |
|------|--------|---------|
| 设置难度 | ⭐⭐ | ⭐⭐⭐⭐ |
| 连接稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 错误提示 | ⭐⭐⭐⭐ | ⭐⭐ |
| 文档完整性 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 建议

如果您有QQ邮箱，强烈建议使用QQ邮箱作为SMTP服务提供商，它会为您节省大量调试时间。