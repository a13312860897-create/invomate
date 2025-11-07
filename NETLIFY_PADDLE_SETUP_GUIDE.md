# Netlify + Paddle 配置指南（2024年最新版）

## 概述
你已经在Netlify上有了SSL证书，这很好！现在我们需要配置Paddle Webhook来处理支付事件。

## 当前状态
✅ **SSL证书已配置**
- 域名: `invomate.app`, `www.invomate.app`
- 证书提供商: Let's Encrypt
- 自动续期: 是（12月6日到期前自动续期）

## 配置步骤

### 1. 部署Netlify Functions

我已经为你创建了Paddle Webhook处理函数：
- 文件位置: `frontend/netlify/functions/paddle-webhook.js`
- 配置文件: `frontend/netlify.toml`

### 2. 设置环境变量（2024年最新界面）

在Netlify Dashboard中设置以下环境变量：

1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 选择你的项目 `invomate.app`
3. 在左侧菜单中找到 **Project configuration** → **Environment variables**
4. 点击 **Add a variable** → **Add a single variable**
5. 添加以下变量：

```
PADDLE_WEBHOOK_SECRET = ntfset_01k8fvwxgq48qv7smd2e5k3rhz
BACKEND_URL = https://your-backend-url.com
BACKEND_API_KEY = your-backend-api-key
```

**注意**: 如果你找不到"Project configuration"，也可以尝试：
- 点击项目名称进入项目详情
- 查找 **Settings** 或 **Configuration** 选项卡
- 寻找 **Environment variables** 部分

### 3. 配置Paddle Webhook URL（2024年最新界面）

在Paddle Dashboard中设置Webhook URL：

1. 登录 [Paddle Dashboard](https://vendors.paddle.com) 或 [Paddle Sandbox](https://sandbox-vendors.paddle.com)
2. 在左侧菜单中找到 **Developer Tools** → **Notifications**
3. 点击 **New destination** 按钮
4. 填写以下信息：
   - **Description**: 给Webhook起个名字，比如 "Invomate Production Webhook"
   - **Notification type**: 选择 **Webhook**
   - **URL**: 输入 `https://invomate.app/.netlify/functions/paddle-webhook`
5. 选择你需要的事件类型：
   - `transaction.completed` - 交易完成
   - `subscription.created` - 订阅创建
   - `subscription.updated` - 订阅更新
   - `subscription.canceled` - 订阅取消
6. 点击 **Save destination**

**重要**: 保存后，Paddle会显示一个 **Secret key**，这就是你的Webhook密钥，应该与你之前提供的 `ntfset_01k8fvwxgq48qv7smd2e5k3rhz` 匹配。

### 4. 后端部署选项

你有几个选择来部署后端：

#### 选项A: Netlify Functions（推荐）
- 优点: 与前端在同一平台，简单易管理
- 缺点: 冷启动延迟，适合中小型应用

#### 选项B: Railway
- 优点: 专门的Node.js托管，性能好
- 缺点: 需要额外平台管理

#### 选项C: Vercel
- 优点: 与Netlify类似，支持Node.js
- 缺点: 需要额外平台管理

#### 选项D: 传统VPS
- 优点: 完全控制，性能最好
- 缺点: 需要服务器管理经验

## 推荐方案：Netlify Functions

### 步骤1: 创建后端Functions

```bash
# 在frontend目录下创建
mkdir -p netlify/functions/api
```

### 步骤2: 迁移关键API端点

将以下后端路由转换为Netlify Functions：
- `/api/paddle/activate-trial`
- `/api/paddle/subscription-status`
- `/api/paddle/update-subscription`

### 步骤3: 数据库配置

使用无服务器数据库：
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)
- **FaunaDB** (NoSQL)

## 测试流程

### 1. 本地测试
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 在frontend目录下运行
netlify dev
```

### 2. 部署测试
```bash
# 部署到Netlify
netlify deploy --prod
```

### 3. Webhook测试
使用Paddle的Webhook测试工具验证：
```
https://invomate.app/.netlify/functions/paddle-webhook
```

## 证书续期问题解决

你提到证书与域名设置不同步，解决方法：

1. 在Netlify Dashboard中：
   - 进入 **Domain settings**
   - 点击 **Renew certificate**
   - 等待新证书生成

2. 检查DNS设置：
   - 确保 `invomate.app` 和 `www.invomate.app` 都指向Netlify
   - 使用 `dig invomate.app` 检查DNS解析

## 完整配置清单

- [ ] Netlify Functions已部署
- [ ] 环境变量已设置
- [ ] Paddle Webhook URL已配置
- [ ] SSL证书已续期
- [ ] 后端API已迁移或部署
- [ ] 数据库连接已配置
- [ ] 支付流程已测试

## 下一步

1. **选择后端部署方案**
2. **设置环境变量**
3. **测试Webhook端点**
4. **完整支付流程测试**

## 需要帮助？

如果你选择了后端部署方案，我可以帮你：
- 创建具体的迁移脚本
- 配置数据库连接
- 设置环境变量
- 测试完整流程

你想选择哪种后端部署方案？