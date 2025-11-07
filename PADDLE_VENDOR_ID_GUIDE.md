# Paddle Vendor ID 和 Webhook Secret 获取指南

## 问题描述
用户在 Paddle Dashboard 中找不到 Vendor ID 和 Webhook Secret，但已找到 API Key 和 Client Token。

## 解决方案

### 1. Vendor ID 获取方法

#### 方法一：通过 URL 获取
1. 登录 Paddle Dashboard
2. 查看浏览器地址栏的 URL
3. URL 格式通常为：`https://vendors.paddle.com/[VENDOR_ID]/...`
4. 其中 `[VENDOR_ID]` 就是您的 Vendor ID

#### 方法二：通过 API 调用获取
1. 使用已获取的 API Key 调用 Paddle API
2. 在 API 响应中查找 vendor_id 字段

#### 方法三：检查账户设置
1. 在 Dashboard 中点击右上角的用户头像
2. 选择 "Account Settings" 或"账户设置"
3. 在账户信息页面查找 Vendor ID

### 2. Webhook Secret 获取方法

#### 步骤一：创建 Webhook 端点
1. 在 Paddle Dashboard 中找到 "Developer Tools" 或"开发者工具"
2. 点击 "Webhooks" 或"Webhook"
3. 如果没有 Webhook，点击 "Add Webhook" 或"添加 Webhook"

#### 步骤二：配置 Webhook
1. **Webhook URL**: 输入您的服务器地址，例如：
   - 开发环境：`http://localhost:8080/api/paddle/webhook`
   - 生产环境：`https://yourdomain.com/api/paddle/webhook`
2. **Events**: 选择需要监听的事件，建议选择：
   - `transaction.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
3. 保存后，系统会生成 Webhook Secret

#### 步骤三：获取 Secret
1. 在 Webhook 列表中点击刚创建的 Webhook
2. 在详情页面找到 "Webhook Secret" 或"密钥"
3. 复制该密钥到环境变量中

### 3. 当前已获取的凭据（示例占位，无敏感信息）

✅ **API Key**: `<YOUR_API_KEY>`
✅ **Client Token**: `<YOUR_CLIENT_TOKEN>`
❌ **Vendor ID**: 需要通过上述方法获取
❌ **Webhook Secret**: 需要配置 Webhook 后获取

### 4. 临时解决方案

如果暂时无法找到 Vendor ID，可以：

1. **使用 API 测试获取**：
```bash
curl -X GET "https://api.paddle.com/vendors" \
  -H "Authorization: Bearer <YOUR_API_KEY>"
```

2. **检查现有产品**：
   - 在 Dashboard 中查看任何现有产品的详情
   - 产品 ID 通常包含 Vendor ID 信息

### 5. 联系支持

如果以上方法都无法获取 Vendor ID：
1. 联系 Paddle 客服支持
2. 提供您的账户邮箱和 API Key
3. 请求协助获取 Vendor ID

## 环境变量配置

### 后端 .env
```
PADDLE_VENDOR_ID=<YOUR_VENDOR_ID>
PADDLE_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
```

### 前端 .env
```
REACT_APP_PADDLE_VENDOR_ID=您的实际Vendor ID
```

## 注意事项

- Vendor ID 是数字格式，通常为 5-7 位数字
- Webhook Secret 由平台生成，请遵循平台提供的格式
- 确保在生产环境中使用正确的凭据
- 保护好所有 API 密钥和令牌的安全性

## 下一步

一旦获取到 Vendor ID 和 Webhook Secret，请：
1. 更新 `backend/.env` 中的 `PADDLE_WEBHOOK_SECRET`
2. 更新 `frontend/.env` 中的 `REACT_APP_PADDLE_VENDOR_ID`
3. 重启前后端服务
4. 测试 Paddle 支付功能