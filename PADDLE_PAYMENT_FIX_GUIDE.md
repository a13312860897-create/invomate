# Paddle支付"Something went wrong"错误修复指南

## 问题描述

用户在使用Paddle支付系统时，支付页面显示"Something went wrong"错误，导致无法完成支付流程。

## 问题分析

经过详细分析，我们发现了以下主要问题：

### 1. 客户端令牌格式不正确
- **问题**：沙盒环境的客户端令牌使用了`test_`前缀，而不是正确的`pdl_test_`前缀
- **影响**：导致Paddle SDK初始化失败，无法正确连接到Paddle服务器

### 2. API版本不一致
- **问题**：代码中混合使用了New API和Classic API的参数和方法
- **影响**：导致Paddle SDK无法正确处理支付请求

### 3. 价格ID不匹配
- **问题**：代码中使用的价格ID与Paddle账户中的实际价格ID不匹配
- **影响**：导致无法找到对应的产品价格，支付失败

### 4. 事件处理不完善
- **问题**：缺少对Paddle事件的监听和处理
- **影响**：无法捕获和处理支付过程中的错误和状态变化

## 解决方案

### 1. 修复客户端令牌格式

#### 后端配置 (.env)
```env
# 示例占位符（避免展示真实或类真实格式）
PADDLE_CLIENT_TOKEN=<YOUR_PADDLE_SANDBOX_CLIENT_TOKEN>
```

#### 前端测试页面
```javascript
// 修复前
let config = {
    clientToken: 'test_7435d425f721a5bf267a3382145'
};

// 修复后（使用占位符）
let config = {
    clientToken: '<YOUR_PADDLE_SANDBOX_CLIENT_TOKEN>'
};
```

### 2. 改进PaddleCheckout组件

#### 添加API版本检查
```javascript
// 检测API版本
const isNewAPI = typeof window.Paddle.Environment !== 'undefined';

// 根据API版本使用相应的结账方法
if (isNewAPI) {
    // 使用New API
    paddle.Checkout.open({
        items: [{
            priceId: priceId,
            quantity: 1
        }],
        customer: {
            email: userEmail
        }
    });
} else {
    // 使用Classic API
    paddle.Checkout.open({
        product: priceId,
        email: userEmail,
        passthrough: JSON.stringify({
            planName: planName
        })
    });
}
```

#### 添加事件监听器
```javascript
// 添加事件监听器
paddle.Checkout.on('checkout.completed', (data) => {
    console.log('Checkout completed:', data);
    if (onSuccess) {
        onSuccess(data);
    }
});

paddle.Checkout.on('checkout.closed', (data) => {
    console.log('Checkout closed:', data);
});

paddle.Checkout.on('checkout.error', (data) => {
    console.error('Checkout error:', data);
    setError(`Checkout error: ${data.message || 'Unknown error'}`);
});
```

### 3. 更新价格ID

#### PaddlePricing.js
```javascript
// 修复前
const plans = [
    {
        name: '入门版',
        price: '¥99/月',
        paddlePriceId: 'pri_01h8x2x3...' // 示例ID
    },
    // ...
];

// 修复后
const plans = [
    {
        name: '入门版',
        price: '¥99/月',
        paddlePriceId: 'pri_01j3x2k5...' // 实际ID
    },
    // ...
];
```

### 4. 创建测试工具

#### Paddle API连接测试脚本
创建了`testPaddleConnection.js`脚本，用于验证Paddle API连接和配置：
- 测试产品列表获取
- 测试价格列表获取
- 测试业务信息获取
- 验证客户端令牌格式
- 验证API密钥格式
- 测试支付链接创建

#### 前端测试页面
创建了多个测试页面：
- `paddle-test-new.html`：基础的Paddle测试页面
- `paddle-test-page.html`：功能完整的Paddle测试页面
- `paddle-fix-verification.html`：修复验证页面

## 测试验证

### 1. 后端API测试
```bash
cd backend
node src/scripts/testPaddleConnection.js
```

预期输出：
```
=== Paddle API 连接测试 ===
环境: sandbox
API密钥存在: 是
客户端令牌存在: 是
API基础URL: https://sandbox-api.paddle.com

测试1: 获取产品列表...
✓ 产品列表获取成功
  产品数量: X

测试2: 获取价格列表...
✓ 价格列表获取成功
  价格数量: X

测试3: 获取业务信息...
✓ 业务信息获取成功
  业务名称: XXX

测试4: 验证客户端令牌格式...
✓ 沙盒环境客户端令牌格式正确

测试5: 验证API密钥格式...
✓ 沙盒环境API密钥格式正确

测试6: 创建支付链接...
✓ 支付链接创建成功
  支付链接URL: https://sandbox.paddle.com/checkout/...
  支付链接ID: pl_...

=== 所有测试完成 ===
Paddle API连接和配置正常
```

### 2. 前端支付测试
1. 打开`paddle-fix-verification.html`页面
2. 点击"初始化Paddle"按钮
3. 初始化成功后，点击"打开结账"按钮
4. 观察支付页面是否正常打开

## 常见问题排查

### 1. 客户端令牌格式问题
- **症状**：初始化Paddle失败，控制台显示认证错误
- **解决**：确保沙盒与生产环境分别使用正确的官方格式，但文档中仅以占位符展示，例如 `<YOUR_PADDLE_SANDBOX_CLIENT_TOKEN>` 与 `<YOUR_PADDLE_PRODUCTION_CLIENT_TOKEN>`

### 2. API密钥格式问题
- **症状**：后端API调用失败，返回401或403错误
- **解决**：按照官方要求区分沙盒与生产环境的API Key，但文档中只以占位符说明，例如 `<YOUR_PADDLE_SANDBOX_API_KEY>` 和 `<YOUR_PADDLE_LIVE_API_KEY>`

### 3. 价格ID不匹配
- **症状**：支付页面显示"产品不可用"或类似错误
- **解决**：确保使用Paddle账户中实际存在的价格ID

### 4. 浏览器缓存问题
- **症状**：修复后问题仍然存在
- **解决**：清除浏览器缓存和Cookie，或使用隐私模式/无痕模式

### 5. 网络连接问题
- **症状**：Paddle脚本加载失败
- **解决**：检查网络连接，确保可以访问Paddle CDN

## 部署注意事项

### 1. 环境变量配置
确保在生产环境中使用正确的Paddle凭据（使用占位符示例）：
```env
PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=<YOUR_PADDLE_LIVE_API_KEY>
PADDLE_CLIENT_TOKEN=<YOUR_PADDLE_PRODUCTION_CLIENT_TOKEN>
```

### 2. Webhook配置
确保在Paddle后台正确配置Webhook URL，并设置正确的Webhook密钥。

### 3. 错误处理
在生产环境中，确保有完善的错误处理和日志记录机制，以便及时发现和解决问题。

## 总结

通过修复客户端令牌格式、改进API版本处理、更新价格ID和添加事件监听器，我们成功解决了Paddle支付页面"Something went wrong"错误。创建的测试工具可以帮助验证修复效果，并在未来出现类似问题时快速定位和解决。

## 相关文件

### 后端文件
- `backend/.env`：环境变量配置
- `backend/src/config/paddle.js`：Paddle配置文件
- `backend/src/services/paddleService.js`：Paddle服务类
- `backend/src/routes/paddle.js`：Paddle路由
- `backend/src/scripts/testPaddleConnection.js`：Paddle API连接测试脚本

### 前端文件
- `frontend/src/components/PaddleCheckout.tsx`：Paddle结账组件
- `frontend/src/pages/PaddlePricing.js`：定价页面
- `frontend/src/pages/PaddleTestPage.js`：测试页面
- `frontend/public/paddle-test-new.html`：基础测试页面
- `frontend/public/paddle-test-page.html`：完整测试页面
- `frontend/public/paddle-fix-verification.html`：修复验证页面