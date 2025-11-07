# Paddle集成指南

本文档提供了如何将Paddle计费平台集成到发票软件中的详细步骤。

## 目录

1. [Paddle简介](#paddle简介)
2. [环境配置](#环境配置)
3. [后端集成](#后端集成)
4. [前端集成](#前端集成)
5. [Webhook配置](#webhook配置)
6. [测试流程](#测试流程)
7. [部署注意事项](#部署注意事项)

## Paddle简介

Paddle是一个完整的数字产品销售和订阅管理平台，专为现代软件企业设计。它提供了支付处理、税务计算、本地化和订阅管理等功能。

## 环境配置

### 1. 注册Paddle账户

首先，您需要注册一个Paddle账户：

1. 访问 [Paddle官网](https://www.paddle.com/)
2. 点击"Sign Up"按钮
3. 填写注册信息
4. 验证您的邮箱地址

### 2. 获取API凭据

登录Paddle仪表板后，获取以下API凭据：

1. **供应商ID (Vendor ID)**:
   - 导航到 "Developer Tools" > "Authentication"
   - 在"Vendor ID"部分找到您的供应商ID

2. **API密钥**:
   - 导航到 "Developer Tools" > "Authentication"
   - 点击"API Keys"选项卡
   - 创建一个新的API密钥

3. **客户端令牌**:
   - 导航到 "Developer Tools" > "Authentication"
   - 点击"Client-side Tokens"选项卡
   - 创建一个新的客户端令牌

4. **Webhook密钥**:
   - 导航到 "Developer Tools" > "Notifications"
   - 创建一个新的通知目标
   - 复制webhook密钥

### 3. 配置环境变量

将获取的API凭据添加到您的`.env`文件中：

```env
# Paddle Configuration
PADDLE_VENDOR_ID=your_vendor_id_here
PADDLE_API_KEY=your_api_key_here
PADDLE_CLIENT_TOKEN=your_client_token_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
PADDLE_API_URL=https://api.paddle.com
```

## 后端集成

### 1. 安装依赖

确保已安装axios库用于HTTP请求：

```bash
npm install axios
```

### 2. 创建Paddle服务

我们已创建了一个Paddle服务类 (`backend/src/services/paddleService.js`)，它封装了所有与Paddle API的交互。

### 3. 创建订阅模型

我们已创建了一个订阅模型 (`backend/src/models/Subscription.js`)，用于存储订阅信息。

### 4. 创建Webhook验证中间件

我们已创建了一个Webhook验证中间件 (`backend/src/middleware/paddleWebhook.js`)，用于验证Paddle webhook的签名。

### 5. 添加Paddle路由

我们已在服务器中添加了Paddle路由 (`backend/src/routes/paddle.js`)，用于处理Paddle相关的API请求和webhook。

### 6. 数据库迁移

如果使用SQL数据库，请运行以下命令创建订阅表：

```bash
npx sequelize-cli db:migrate
```

## 前端集成

### 1. 安装Paddle.js

在您的HTML文件中添加Paddle.js脚本：

```html
<script src="https://cdn.paddle.com/paddle/paddle.js"></script>
```

### 2. 初始化Paddle

在您的应用中初始化Paddle：

```javascript
// 初始化Paddle
Paddle.Setup({
  vendor: parseInt(process.env.PADDLE_VENDOR_ID),
  token: process.env.PADDLE_CLIENT_TOKEN
});
```

### 3. 创建定价页面

我们已创建了一个Paddle定价页面组件 (`frontend/src/pages/PaddlePricing.js`)，它展示了不同的定价计划并处理支付流程。

### 4. 处理支付流程

定价页面组件包含以下功能：

- 显示不同的定价计划
- 处理计划选择
- 打开Paddle结账页面
- 处理支付成功/失败的回调

## Webhook配置

### 1. 配置Webhook端点

在Paddle仪表板中配置webhook端点：

1. 导航到 "Developer Tools" > "Notifications"
2. 点击"New Destination"
3. 输入您的webhook端点URL（例如：`https://yourdomain.com/api/paddle/webhook`）
4. 选择要接收的事件类型
5. 保存配置

### 2. 处理Webhook事件

我们的后端已配置为处理以下Paddle webhook事件：

- `subscription.created` - 订阅创建
- `subscription.activated` - 订阅激活
- `subscription.updated` - 订阅更新
- `subscription.cancelled` - 订阅取消
- `subscription.past_due` - 订阅逾期
- `payment.succeeded` - 支付成功
- `payment.failed` - 支付失败

### 3. 验证Webhook签名

我们的Webhook验证中间件会验证每个传入的webhook请求，确保它们来自Paddle并且未被篡改。

## 测试流程

### 1. 测试环境设置

Paddle提供了沙盒环境用于测试：

1. 在Paddle仪表板中，确保您处于沙盒模式
2. 使用沙盒API密钥和客户端令牌
3. 使用测试信用卡信息进行测试支付

### 2. 测试支付流程

1. 访问定价页面 (`/paddle-pricing`)
2. 选择一个定价计划
3. 点击"订阅"按钮
4. 在Paddle结账页面中输入测试信用卡信息：
   - 卡号：`4242 4242 4242 4242`
   - 过期日期：任何未来的日期
   - CVC：`100`
   - 邮编：任何有效的邮编
5. 完成支付流程

### 3. 测试Webhook

1. 使用工具如ngrok创建一个本地隧道的公共URL
2. 在Paddle仪表板中配置webhook端点为ngrok URL
3. 进行测试支付
4. 检查您的应用是否正确处理了webhook事件

## 部署注意事项

### 1. 环境变量

在生产环境中，确保设置以下环境变量：

```env
# Paddle Configuration
PADDLE_VENDOR_ID=your_production_vendor_id
PADDLE_API_KEY=your_production_api_key
PADDLE_CLIENT_TOKEN=your_production_client_token
PADDLE_WEBHOOK_SECRET=your_production_webhook_secret
PADDLE_API_URL=https://api.paddle.com
```

### 2. 安全性

- 确保Paddle API密钥和webhook密钥安全存储
- 使用HTTPS保护您的webhook端点
- 验证所有传入的webhook请求

### 3. 错误处理

- 实现适当的错误处理机制
- 记录所有Paddle API调用和webhook事件
- 设置警报以监控支付和订阅问题

### 4. 数据同步

- 定期同步订阅状态，确保您的数据库与Paddle保持一致
- 实现重试机制处理失败的API调用

## 常见问题

### Q: 如何处理订阅续费失败？

A: 订阅续费失败时，Paddle会发送`subscription.past_due`事件。您应该：

1. 更新订阅状态为"逾期"
2. 通知用户支付失败
3. 提供更新支付方式的选项

### Q: 如何处理退款？

A: 退款可以在Paddle仪表板中手动处理。退款后，Paddle会发送`payment.refunded`事件。您应该：

1. 更新相关订单或订阅的状态
2. 根据您的业务逻辑调整用户权限

### Q: 如何处理订阅升级/降级？

A: 订阅升级/降级可以通过Paddle API或仪表板处理。升级/降级后，Paddle会发送`subscription.updated`事件。您应该：

1. 更新订阅计划和价格信息
2. 根据新计划调整用户权限

## 资源链接

- [Paddle官方文档](https://developer.paddle.com/)
- [Paddle API参考](https://developer.paddle.com/api-reference/intro)
- [Paddle Webhook文档](https://developer.paddle.com/webhooks/intro)
- [Paddle.js文档](https://developer.paddle.com/paddle-js/intro)