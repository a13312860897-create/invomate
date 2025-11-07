# Paddle 快速入门指南

本指南将帮助您快速开始使用Paddle集成到发票软件项目中。

## 1. 环境配置

### 1.1 获取Paddle凭据

1. 注册Paddle账户：[https://www.paddle.com/](https://www.paddle.com/)
2. 登录Paddle控制台
3. 获取以下凭据：
   - 供应商ID (Vendor ID)
   - API密钥 (API Key)
   - 客户端令牌 (Client-side Token)
   - Webhook密钥 (Webhook Secret)

### 1.2 配置环境变量

在`backend/.env`文件中添加以下配置：

```
# Paddle配置
PADDLE_VENDOR_ID=your_vendor_id
PADDLE_API_KEY=your_api_key
PADDLE_CLIENT_TOKEN=your_client_token
PADDLE_WEBHOOK_SECRET=your_webhook_secret
PADDLE_API_URL=https://sandbox-api.paddle.com
```

在`frontend/.env`文件中添加以下配置：

```
# Paddle配置
REACT_APP_PADDLE_VENDOR_ID=your_vendor_id
REACT_APP_PADDLE_ENVIRONMENT=sandbox
```

## 2. 创建产品和价格

### 2.1 使用脚本创建产品和价格

在backend目录下运行以下命令：

```bash
npm run paddle:create-products
```

这将创建以下产品和价格：

- 入门版 (Starter)
  - 月度价格: $10
  - 年度价格: $100

- 专业版 (Pro)
  - 月度价格: $30
  - 年度价格: $300

- 企业版 (Enterprise)
  - 月度价格: $300
  - 年度价格: $3000

### 2.2 手动创建产品和价格

1. 登录Paddle控制台
2. 前往"目录" > "产品"
3. 点击"新建产品"
4. 填写产品信息并保存
5. 在产品页面点击"新建价格"
6. 设置价格信息并保存

## 3. 测试Webhook

### 3.1 使用脚本测试Webhook

在backend目录下运行以下命令：

```bash
npm run paddle:test-webhooks
```

这将测试以下Webhook事件：

- `subscription.created` - 订阅创建
- `subscription.activated` - 订阅激活
- `subscription.updated` - 订阅更新
- `subscription.cancelled` - 订阅取消
- `subscription.past_due` - 订阅逾期
- `payment.succeeded` - 支付成功
- `payment.failed` - 支付失败

### 3.2 配置Webhook目标

1. 登录Paddle控制台
2. 前往"开发者工具" > "通知"
3. 点击"新建目的地"
4. 输入目的地名称
5. 设置URL为您的webhook端点（例如：`https://yourdomain.com/api/paddle/webhook`）
6. 选择要接收的事件类型
7. 保存目的地

## 4. 启动服务器

### 4.1 启动后端服务器

在backend目录下运行：

```bash
npm start
```

或使用开发模式：

```bash
npm run dev
```

### 4.2 启动前端服务器

在frontend目录下运行：

```bash
npm start
```

## 5. 访问定价页面

打开浏览器并访问以下URL：

- 完整Paddle集成示例：`http://localhost:3000/paddle-pricing`
- 简化Paddle集成示例：`http://localhost:3000/paddle-pricing-example`

## 6. 测试支付流程

1. 访问定价页面
2. 选择一个计划（入门版或专业版）
3. 点击"立即订阅"按钮
4. 在弹出的Paddle结账页面中填写测试信息：
   - 电子邮件：您的电子邮件地址
   - 国家：任何Paddle支持的国家
   - 邮政编码：任何有效的邮政编码
   - 卡号：`4242 4242 4242 4242`
   - 卡上姓名：任何姓名
   - 过期日期：未来的任何有效日期
   - 安全码：`100`
5. 完成支付流程

## 7. 验证Webhook

1. 在Paddle控制台中查看webhook日志
2. 检查您的应用程序是否正确接收和处理了webhook事件
3. 验证数据库中的订阅数据是否正确更新

## 8. 常见问题

### 8.1 Paddle.js无法加载

确保您的网络可以访问`https://cdn.paddle.com/paddle/paddle.js`。如果无法访问，可以考虑使用CDN或本地托管Paddle.js。

### 8.2 Webhook验证失败

检查以下几点：
- 确保在`.env`文件中正确配置了`PADDLE_WEBHOOK_SECRET`
- 确保webhook中间件正确验证签名
- 检查webhook请求的时间戳是否在有效范围内（5分钟）

### 8.3 价格显示不正确

确保以下几点：
- 确保在Paddle控制台中正确创建了产品和价格
- 确保在前端代码中正确配置了价格ID
- 检查Paddle.js是否正确初始化

## 9. 部署注意事项

### 9.1 切换到生产环境

1. 在Paddle控制台中创建生产环境的产品和价格
2. 更新`.env`文件中的配置：
   ```
   PADDLE_API_URL=https://api.paddle.com
   REACT_APP_PADDLE_ENVIRONMENT=production
   ```
3. 更新前端代码中的产品和价格ID

### 9.2 安全考虑

1. 确保不要在前端代码中暴露API密钥
2. 确保webhook端点使用HTTPS
3. 定期轮换API密钥和webhook密钥

## 10. 资源链接

- [Paddle官方文档](https://developer.paddle.com/)
- [Paddle.js文档](https://developer.paddle.com/paddle-js/overview)
- [Paddle Webhook文档](https://developer.paddle.com/webhooks/overview)
- [Paddle API文档](https://developer.paddle.com/api-reference/overview)

## 总结

通过本指南，您已经了解了如何：

1. 配置Paddle环境
2. 创建产品和价格
3. 测试webhook
4. 启动服务器
5. 访问定价页面
6. 测试支付流程
7. 验证webhook
8. 解决常见问题
9. 部署到生产环境

现在您可以开始使用Paddle处理发票软件项目的支付和订阅管理了！