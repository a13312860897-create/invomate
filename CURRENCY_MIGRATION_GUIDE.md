# 货币统一化迁移指南 (USD → EUR)

## 概述
本文档记录了发票软件系统从美元(USD)到欧元(EUR)的完整迁移过程，包括所有修改的文件、配置变更和测试验证步骤。

## 迁移日期
- 开始时间: 2024年12月
- 完成时间: 2024年12月

## 技术方案
采用以Paddle支付平台为中心的欧元统一化方案，确保前后端货币显示一致性。

## 修改文件清单

### 后端文件修改

#### 1. 服务层文件
- **G:\发票软件\backend\src\services\pdfService.js**
  - 修改PDF生成服务中的默认货币从USD改为EUR
  - 影响: PDF发票生成时的货币显示

- **G:\发票软件\backend\src\services\dashboardService.js**
  - 修改createPaddlePaymentLink函数的默认货币
  - 影响: Paddle支付链接生成

#### 2. 测试脚本文件
- **G:\发票软件\backend\src\scripts\testPaddleWebhooks.js**
  - 修改所有Webhook测试事件中的货币设置
  - 包括: subscription.created, subscription.activated, subscription.updated, subscription.cancelled, subscription.past_due, payment.succeeded, payment.failed
  
- **G:\发票软件\backend\src\scripts\createPaddleProducts.js**
  - 修改所有产品价格的货币设置
  - 包括: 入门版、专业版、企业版的月付和年付价格

### 前端文件修改

#### 1. 组件文件
- **G:\发票软件\frontend\src\components\InvoiceHeader.jsx**
  - 修改InvoiceHeader组件的默认货币

- **G:\发票软件\frontend\src\components\InvoicePreview.js**
  - 统一货币设置为EUR，移除基于语言的条件判断

- **G:\发票软件\frontend\src\components\KpiCards.js**
  - 修改formatCurrency函数的默认货币

- **G:\发票软件\frontend\src\components\OverdueCustomersTable.js**
  - 修改formatCurrency函数的默认货币

#### 2. 页面文件
- **G:\发票软件\frontend\src\pages\Invoices.js**
  - 修改发票页面的默认货币设置

- **G:\发票软件\frontend\src\pages\InvoiceDetail.js**
  - 修改发票详情页面的默认货币设置

- **G:\发票软件\frontend\src\pages\Payment.js**
  - 修改支付页面的默认货币设置

- **G:\发票软件\frontend\src\pages\NewInvoiceForm.js**
  - 修改新建发票表单的所有货币设置
  - 统一为EUR，移除基于语言的条件判断

- **G:\发票软件\frontend\src\pages\InvoiceForm.js**
  - 修改发票表单的默认货币设置

#### 3. 上下文和服务文件
- **G:\发票软件\frontend\src\context\AuthContext.js**
  - 修改用户默认货币设置
  - 修改测试数据中的货币设置
  - 包括: overdueInvoices和recentInvoices数组中的所有货币字段

- **G:\发票软件\frontend\src\services\dashboardService.js**
  - 修改createPaddlePaymentLink函数的默认货币

## 配置说明

### Paddle配置
系统使用Paddle作为支付处理平台，相关配置位于:
- **后端**: `G:\发票软件\backend\.env`
- **环境**: 沙盒环境 (PADDLE_ENVIRONMENT=sandbox)
- **API密钥**: 需要配置有效的Paddle API密钥

### 环境变量
```env
PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=<YOUR_SANDBOX_API_KEY>
PADDLE_CLIENT_TOKEN=<YOUR_SANDBOX_CLIENT_TOKEN>
PADDLE_WEBHOOK_SECRET=<YOUR_SANDBOX_WEBHOOK_SECRET>
```

## 测试验证

### 1. 前端验证
- ✅ 所有页面货币显示统一为EUR
- ✅ 发票生成和预览功能正常
- ✅ 支付页面货币设置正确

### 2. 后端验证
- ✅ PDF生成服务货币设置正确
- ✅ 测试脚本货币统一化完成
- ⚠️ Paddle API连接需要有效密钥配置

### 3. 集成测试
- 需要配置有效的Paddle API密钥进行完整测试
- Webhook测试脚本已更新为EUR货币

## 注意事项

1. **Paddle API配置**: 
   - 当前测试显示API密钥配置存在问题
   - 需要确保.env文件中的PADDLE_API_KEY有效
   - 请从平台生成沙盒密钥，不在仓库中示例具体格式

2. **数据迁移**:
   - 现有数据库中的货币字段可能需要手动迁移
   - 建议在生产环境部署前进行数据备份

3. **用户通知**:
   - 建议在系统更新前通知用户货币变更
   - 可能需要更新用户协议和定价页面

## 回滚方案
如需回滚到USD货币，可以:
1. 恢复所有修改文件中的货币设置
2. 将EUR替换回USD
3. 重新配置Paddle产品价格

## 相关文档
- Paddle API文档: https://developer.paddle.com/
- 系统架构文档: 待补充
- 部署指南: 待补充