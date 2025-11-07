# Paddle集成使用说明

本文档提供了如何使用已实现的Paddle集成功能的详细说明。

## 快速开始

### 1. 配置环境变量

首先，您需要配置Paddle相关的环境变量。复制`.env.example`文件为`.env`，并填入您的Paddle凭据：

```bash
cp .env.example .env
```

然后编辑`.env`文件，添加您的Paddle凭据：

```env
# Paddle Configuration
PADDLE_VENDOR_ID=your_vendor_id_here
PADDLE_API_KEY=your_api_key_here
PADDLE_CLIENT_TOKEN=your_client_token_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
PADDLE_API_URL=https://api.paddle.com
```

### 2. 创建Paddle产品和价格

运行以下命令创建Paddle产品和价格：

```bash
npm run paddle:create-products
```

这将创建以下产品和价格：

- **入门版**：月付$10，年付$100
- **专业版**：月付$30，年付$300
- **企业版**：月付$300，年付$3000

### 3. 测试Webhook处理

运行以下命令测试webhook处理：

```bash
npm run paddle:test-webhooks
```

这将测试所有支持的webhook事件，包括：

- 订阅创建
- 订阅激活
- 订阅更新
- 订阅取消
- 订阅逾期
- 支付成功
- 支付失败

### 4. 启动服务器

启动后端服务器：

```bash
npm start
```

或使用开发模式：

```bash
npm run dev
```

### 5. 访问定价页面

在前端应用中，访问`/paddle-pricing`页面，查看Paddle定价页面。

## API端点

### 1. 产品和价格

#### 获取产品列表

```http
GET /api/paddle/products
```

#### 获取价格列表

```http
GET /api/paddle/prices
```

#### 获取特定价格信息

```http
GET /api/paddle/prices/:priceId
```

### 2. 支付链接

#### 创建支付链接

```http
POST /api/paddle/payment-links
Content-Type: application/json

{
  "priceId": "pri_123456789",
  "options": {
    "customer_id": "cus_123456789"
  }
}
```

### 3. 订阅管理

#### 创建订阅

```http
POST /api/paddle/subscriptions
Content-Type: application/json

{
  "priceId": "pri_123456789",
  "customerId": "cus_123456789",
  "options": {
    "custom_data": {
      "userId": 1
    }
  }
}
```

#### 获取订阅信息

```http
GET /api/paddle/subscriptions/:subscriptionId
```

#### 更新订阅

```http
PATCH /api/paddle/subscriptions/:subscriptionId
Content-Type: application/json

{
  "options": {
    "items": [
      {
        "price_id": "pri_987654321",
        "quantity": 1
      }
    ]
  }
}
```

#### 取消订阅

```http
POST /api/paddle/subscriptions/:subscriptionId/cancel
Content-Type: application/json

{
  "options": {
    "effective_from": "immediately"
  }
}
```

### 4. 用户订阅

#### 获取用户订阅

```http
GET /api/paddle/user-subscriptions/:userId
```

#### 取消用户订阅

```http
POST /api/paddle/user-subscriptions/:userId/cancel
```

### 5. Webhook

#### 接收Paddle webhook

```http
POST /api/paddle/webhook
```

#### 测试webhook（仅开发环境）

```http
POST /api/paddle/webhook/test
```

## 前端组件

### PaddlePricing组件

`PaddlePricing`组件提供了一个完整的Paddle定价页面，包括：

- 显示不同的定价计划
- 处理计划选择
- 打开Paddle结账页面
- 处理支付成功/失败的回调

#### 使用示例

```jsx
import PaddlePricing from './pages/PaddlePricing';

function App() {
  return (
    <div className="App">
      <PaddlePricing />
    </div>
  );
}
```

## 数据库模型

### Subscription模型

`Subscription`模型用于存储订阅信息，包含以下字段：

- `id`: 主键
- `userId`: 用户ID
- `paddleSubscriptionId`: Paddle订阅ID
- `paddlePlanId`: Paddle计划ID
- `planId`: 计划ID
- `status`: 订阅状态（active, inactive, cancelled, past_due）
- `currentPeriodStart`: 当前计费周期开始时间
- `currentPeriodEnd`: 当前计费周期结束时间
- `cancelledAt`: 取消时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## Webhook事件处理

系统支持处理以下Paddle webhook事件：

### 订阅相关事件

- `subscription.created`: 订阅创建
- `subscription.activated`: 订阅激活
- `subscription.updated`: 订阅更新
- `subscription.cancelled`: 订阅取消
- `subscription.past_due`: 订阅逾期

### 支付相关事件

- `payment.succeeded`: 支付成功
- `payment.failed`: 支付失败

## 测试

### 创建测试产品和价格

```bash
npm run paddle:create-products
```

### 测试webhook处理

```bash
npm run paddle:test-webhooks
```

### 手动测试webhook

您可以使用以下命令手动发送特定的webhook事件：

```javascript
const { testSubscriptionCreated } = require('./src/scripts/testPaddleWebhooks');
testSubscriptionCreated();
```

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

### 2. Webhook端点

在生产环境中，确保您的webhook端点可以通过公共URL访问，并配置Paddle仪表板中的webhook设置。

### 3. 安全性

- 确保Paddle API密钥和webhook密钥安全存储
- 使用HTTPS保护您的webhook端点
- 验证所有传入的webhook请求

## 常见问题

### Q: 如何处理订阅续费失败？

A: 订阅续费失败时，Paddle会发送`subscription.past_due`事件。系统会自动更新订阅状态为"逾期"，您可以根据需要实现额外的通知逻辑。

### Q: 如何处理退款？

A: 退款可以在Paddle仪表板中手动处理。退款后，Paddle会发送`payment.refunded`事件。您可以根据需要扩展系统以处理此事件。

### Q: 如何处理订阅升级/降级？

A: 订阅升级/降级可以通过Paddle API或仪表板处理。升级/降级后，Paddle会发送`subscription.updated`事件，系统会自动更新订阅信息。

## 资源链接

- [Paddle官方文档](https://developer.paddle.com/)
- [Paddle API参考](https://developer.paddle.com/api-reference/intro)
- [Paddle Webhook文档](https://developer.paddle.com/webhooks/intro)
- [Paddle.js文档](https://developer.paddle.com/paddle-js/intro)