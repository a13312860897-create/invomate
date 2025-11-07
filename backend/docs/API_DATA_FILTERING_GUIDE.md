# API数据筛选规则和一致性验证指南

## 概述

本文档详细说明了发票管理系统中各API的数据筛选规则，以及数据一致性验证机制。

**版本**: 1.0.0  
**更新日期**: 2025-01-01  
**维护者**: 系统架构团队

## 数据筛选规则

### 1. 收入趋势API (`/api/dashboard/revenue-trend`)

**筛选逻辑**: 按支付月份筛选已支付发票

```javascript
// 筛选条件
- 发票状态: 'paid'
- 筛选字段: paidDate (支付日期)
- 月份匹配: YYYY-MM格式

// 实现方法
InvoiceFilterService.filterPaidInvoicesForUserByMonth(invoices, userId, monthString)
```

**返回数据**:
- `totalRevenue`: 该月已支付发票的总金额
- `totalCount`: 该月已支付发票的数量
- `trendPoints`: 时间趋势数据点
- `paidInvoices`: 已支付发票详情列表

### 2. 月度摘要API (`/api/dashboard/monthly-summary`)

**筛选逻辑**: 分别按创建月份和支付月份筛选

```javascript
// 创建数据筛选
- 筛选字段: createdAt (创建日期)
- 月份匹配: YYYY-MM格式
- 包含所有状态的发票

// 已支付数据筛选  
- 发票状态: 'paid'
- 筛选字段: paidDate (支付日期)
- 月份匹配: YYYY-MM格式
```

**返回数据**:
- `created`: 该月创建的所有发票统计
  - `count`: 创建发票数量
  - `totalAmount`: 创建发票总金额
  - `byStatus`: 按状态分组统计
- `paid`: 该月支付的发票统计
  - `count`: 已支付发票数量
  - `totalAmount`: 已支付发票总金额

### 3. 状态分布API (`/api/dashboard/status-distribution`)

**筛选逻辑**: 按创建月份筛选所有发票

```javascript
// 筛选条件
- 筛选字段: createdAt (创建日期)
- 月份匹配: YYYY-MM格式
- 包含所有状态的发票

// 实现方法
InvoiceFilterService.filterInvoicesForUserByCreationMonth(invoices, userId, monthString)
```

**返回数据**:
- `totalInvoices`: 该月创建的发票总数
- `distribution`: 按状态分组的分布数据
- `summary`: 汇总统计信息

### 4. 统一图表数据API (`/api/dashboard/unified-chart-data`)

**筛选逻辑**: 组合调用状态分布和收入趋势API

```javascript
// 并行获取数据
const [statusDistribution, revenueTrend] = await Promise.all([
  this.getInvoiceStatusDistribution(userId, monthString),
  this.getRevenueTrend(userId, monthString)
]);
```

## 数据一致性验证

### 验证端点

**路径**: `/api/debug/validate-consistency`  
**方法**: GET  
**参数**: `month` (YYYY-MM格式)

### 验证规则

#### 1. 收入趋势与月度摘要的已支付数据一致性

```javascript
// 验证条件
revenueTrend.totalRevenue === summary.paid.totalAmount
revenueTrend.totalCount === summary.paid.count

// 原因: 两个API都使用相同的筛选逻辑（按支付月份筛选已支付发票）
```

#### 2. 状态分布与月度摘要的创建数据一致性

```javascript
// 验证条件
statusDistribution.totalInvoices === summary.created.count

// 原因: 两个API都使用相同的筛选逻辑（按创建月份筛选所有发票）
```

### 验证结果格式

```json
{
  "month": "2025-09",
  "isConsistent": true,
  "issues": [],
  "data": {
    "statusDistribution": { /* 状态分布数据 */ },
    "revenueTrend": { /* 收入趋势数据 */ },
    "summary": { /* 月度摘要数据 */ }
  },
  "checkedAt": "2025-01-01T12:00:00.000Z"
}
```

## 缓存机制

### DataService缓存策略

```javascript
// 缓存配置
- 缓存超时: 5分钟 (300,000ms)
- 缓存键格式: `invoices_${userId}`
- 自动清理: 超时后自动删除

// 缓存方法
- clearCache(key): 清除指定缓存或全部缓存
- getFromCache(key): 获取缓存数据
- setCache(key, data): 设置缓存数据
```

## 错误处理

### 输入验证

```javascript
// 用户ID验证
validateUserId(userId) {
  if (!userId || typeof userId !== 'number' || userId <= 0) {
    throw new Error(`无效的用户ID: ${userId}`);
  }
}

// 月份字符串验证
validateMonthString(monthString) {
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(monthString)) {
    throw new Error(`月份格式错误，应为YYYY-MM格式: ${monthString}`);
  }
}
```

### 数据源处理

```javascript
// 支持多种数据源
if (this.dataSource && this.dataSource.type === 'memory') {
  // 内存模式处理
} else if (this.dataSource && this.dataSource.query) {
  // 数据库模式处理
} else {
  throw new Error('数据源未正确配置');
}
```

## 性能优化

### 1. 并行数据获取

```javascript
// 使用Promise.all并行获取数据
const [statusDistribution, revenueTrend, summary] = await Promise.all([
  this.getInvoiceStatusDistribution(userId, monthString),
  this.getRevenueTrend(userId, monthString),
  this.getMonthlyInvoiceSummary(userId, monthString)
]);
```

### 2. 缓存策略

- 发票数据缓存5分钟
- 避免重复数据库查询
- 自动缓存清理机制

### 3. 错误恢复

- 优雅的错误处理
- 返回默认值而非抛出异常
- 详细的错误日志记录

## 测试用例

### 自动化测试

测试文件: `src/tests/dataConsistency.test.js`

**测试覆盖**:
1. 收入趋势API与月度摘要API的已支付数据一致性
2. 状态分布API与月度摘要API的创建数据一致性
3. 数据一致性验证方法的正确性
4. 空数据月份的一致性验证
5. API响应时间性能测试

**运行测试**:
```bash
npx jest src/tests/dataConsistency.test.js --verbose
```

## 故障排除

### 常见问题

#### 1. 数据不一致问题

**症状**: 验证端点返回 `isConsistent: false`

**排查步骤**:
1. 检查筛选逻辑是否正确
2. 验证日期格式和时区设置
3. 确认发票状态更新逻辑
4. 检查数据源配置

#### 2. 性能问题

**症状**: API响应时间过长

**优化方案**:
1. 启用缓存机制
2. 优化数据库查询
3. 使用并行数据获取
4. 减少不必要的数据处理

#### 3. 缓存问题

**症状**: 数据更新后仍显示旧数据

**解决方案**:
```javascript
// 手动清除缓存
dataService.clearCache();

// 或清除特定用户缓存
dataService.clearCache(`invoices_${userId}`);
```

## 维护指南

### 代码更新注意事项

1. **筛选逻辑变更**: 确保所有相关API使用一致的筛选规则
2. **新增API**: 遵循现有的筛选规则和错误处理模式
3. **性能优化**: 保持缓存机制和并行处理策略
4. **测试更新**: 更新相应的自动化测试用例

### 文档更新

- 每次API变更后更新本文档
- 保持版本号和更新日期的准确性
- 添加新的测试用例和故障排除信息

---

**注意**: 本文档应与系统架构文档 (`ARCHITECTURE.md`) 保持同步，确保信息的一致性和准确性。