# Paddle 配置指南

## 1. 获取 Paddle 凭据

### 步骤 1: 注册 Paddle 账户
1. 访问 [Paddle 官网](https://paddle.com/)
2. 点击 "Sign Up" 注册账户
3. 完成邮箱验证

### 步骤 2: 获取沙盒环境凭据
1. 登录 Paddle Dashboard
2. 在左侧菜单中找到 "Developer Tools" > "Authentication"
3. 获取以下信息：
   - **Vendor ID**: 在 Dashboard 右上角显示
   - **API Key**: 在 Authentication 页面生成 (Sandbox)
   - **Client Token**: 在 Authentication 页面生成 (Sandbox)

### 步骤 3: 设置 Webhook
1. 在 Paddle Dashboard 中，转到 "Developer Tools" > "Webhooks"
2. 添加新的 Webhook 端点：`http://localhost:3002/api/paddle/webhook`
3. 选择需要的事件类型（订阅创建、更新、取消等）
4. 获取 Webhook Secret

## 2. 更新配置文件

### 后端配置 (backend/.env)
```env
# Paddle Configuration
PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=<YOUR_SANDBOX_API_KEY>
PADDLE_CLIENT_TOKEN=<YOUR_SANDBOX_CLIENT_TOKEN>
PADDLE_WEBHOOK_SECRET=<YOUR_SANDBOX_WEBHOOK_SECRET>
```

### 前端配置 (frontend/.env)
```env
# Paddle Configuration
REACT_APP_PADDLE_ENVIRONMENT=sandbox
REACT_APP_PADDLE_CLIENT_TOKEN=<YOUR_SANDBOX_CLIENT_TOKEN>
REACT_APP_PADDLE_VENDOR_ID=<YOUR_VENDOR_ID>
```

## 3. 创建产品和定价计划

### 在 Paddle Dashboard 中：
1. 转到 "Catalog" > "Products"
2. 创建产品：
   - Basic Plan (免费)
   - Premium Plan (月付/年付)
   - Enterprise Plan (月付/年付)

3. 为每个产品创建价格：
   - Premium Monthly: €59
   - Premium Annual: €590 (节省 €118)
   - Enterprise Monthly: €99
   - Enterprise Annual: €990 (节省 €198)

4. 记录每个价格的 Price ID，用于前端集成

## 4. 测试配置

### 测试步骤：
1. 重启后端和前端服务器
2. 访问 `/pricing` 页面
3. 检查浏览器控制台是否有 Paddle 相关错误
4. 尝试点击升级按钮，查看是否能正常打开支付页面

### 常见问题：
- **Paddle.Setup() 错误**: 确保 Vendor ID 正确
- **支付页面无法打开**: 检查 Client Token 是否有效
- **Webhook 失败**: 确保 Webhook Secret 正确配置

## 5. 生产环境配置

当您准备上线时：
1. 将 `PADDLE_ENVIRONMENT` 改为 `production`
2. 使用生产环境的 API Key 和 Client Token
3. 更新 Webhook 端点为您的生产域名
4. 确保所有价格和产品在生产环境中正确配置

## 注意事项

- 沙盒环境的支付是模拟的，不会产生真实费用
- 测试时可以使用 Paddle 提供的测试卡号
- 确保在生产环境中使用 HTTPS
- 定期轮换 API 密钥以确保安全