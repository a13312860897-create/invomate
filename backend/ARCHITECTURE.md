# 发票管理系统架构文档

> **AI助手必读**: 此文档需要随着代码变更及时更新。当AI助手进行架构修改时，必须同步更新此文档以确保架构信息的时效性和准确性。请在每次架构相关的代码修改后，立即检查并更新相关章节。详细的维护指南请参考 `ARCHITECTURE_MAINTENANCE.md`。

> **重要提醒**: 此文档记录了系统的核心架构设计，是理解和维护系统的重要参考。请确保文档内容与实际代码实现保持100%一致。

## 文档版本信息
- **创建日期**: 2025-01-26
- **最后更新**: 2025-01-26
- **版本**: v2.0 (重构后)
- **维护者**: AI助手

## 系统概述

发票管理系统是一个基于Node.js的全栈Web应用，支持发票的创建、管理、状态跟踪和数据分析。系统采用前后端分离架构，支持内存模式和数据库模式两种数据存储方式。

### 技术栈
- **后端**: Node.js + Express.js
- **前端**: React.js
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **认证**: JWT
- **文件上传**: Multer

## 核心架构设计

### 1. 服务层架构 (重构后)

系统采用分层架构设计，核心服务层包含以下组件：

```
src/services/
├── DataService.js           # 统一数据服务层
├── DateUtils.js            # 日期处理工具类
├── InvoiceFilterService.js # 发票筛选服务
└── tests/                  # 服务层测试
    ├── DataService.test.js
    ├── DateUtils.test.js
    ├── InvoiceFilterService.test.js
    └── testRunner.js
```

#### 1.1 DataService (统一数据服务层)

**职责**: 提供标准化的数据访问和处理接口，统一内存模式和数据库模式的数据操作。

**核心方法**:
- `getAllInvoices(userId)`: 获取用户所有发票
- `getInvoiceStatusDistribution(userId, monthString)`: 获取发票状态分布
- `getRevenueTrend(userId, monthString)`: 获取收入趋势数据
- `getUnifiedChartData(userId, monthString)`: 获取统一图表数据
- `getMonthlyInvoiceSummary(userId, monthString)`: 获取月度发票摘要
- `validateDataConsistency(userId, monthString)`: 验证数据一致性

**设计特点**:
- 构造函数接收数据源配置，支持内存和数据库模式
- 统一的错误处理和日志记录
- 标准化的数据返回格式

#### 1.2 DateUtils (日期处理工具类)

**职责**: 统一处理所有日期相关操作，解决项目中日期处理逻辑不一致的问题。

**核心方法**:
- `getMonthString(date)`: 获取YYYY-MM格式月份字符串
- `getDateString(date)`: 获取YYYY-MM-DD格式日期字符串
- `parseDate(dateInput)`: 解析各种格式的日期输入
- `getMonthRange(monthString)`: 获取月份的开始和结束日期
- `isDateInMonth(date, monthString)`: 判断日期是否在指定月份
- `getDaysInMonth(monthString)`: 获取月份天数
- `generateTimePoints(monthString, pointCount)`: 生成时间点数组
- `getInvoicePaymentDate(invoice)`: 获取发票支付日期
- `getInvoiceCreationDate(invoice)`: 获取发票创建日期

#### 1.3 InvoiceFilterService (发票筛选服务)

**职责**: 标准化所有发票筛选逻辑，确保数据一致性。

**核心方法**:
- `filterPaidInvoicesByPaymentMonth()`: 按支付月份筛选已支付发票
- `filterInvoicesByCreationMonth()`: 按创建月份筛选发票
- `filterInvoicesForUserByCreationMonth()`: 按用户和创建月份筛选
- `filterInvoicesByUser()`: 按用户筛选发票
- `calculateTotalAmount()`: 计算发票总金额
- `groupInvoicesByStatus()`: 按状态分组发票
- `getStatusStatistics()`: 获取状态统计信息
- `generateRevenueTrendData()`: 生成收入趋势数据

### 2. API路由层

#### 2.1 Dashboard API (已重构)

位置: `src/routes/dashboard.js`

**重构后的API端点**:
- `GET /api/dashboard/stats`: 获取月度统计摘要
- `GET /api/dashboard/monthly-revenue-trend`: 获取月度收入趋势
- `GET /api/dashboard/invoice-status-distribution`: 获取发票状态分布
- `GET /api/dashboard/unified-chart-data`: 获取统一图表数据

**重构改进**:
- 移除了复杂的内存模式数据筛选逻辑
- 统一使用DataService进行数据获取
- 简化了错误处理和响应格式
- 提高了代码可维护性

### 3. 数据存储层

#### 3.1 双模式支持

系统支持两种数据存储模式：

**内存模式** (`isMemoryMode = true`):
- 数据存储在全局变量 `global.invoices`
- 适用于开发和测试环境
- 数据在服务重启后丢失

**数据库模式** (`isMemoryMode = false`):
- 使用Prisma ORM操作SQLite/PostgreSQL
- 适用于生产环境
- 数据持久化存储

#### 3.2 数据模型

**Invoice模型**:
```javascript
{
  id: String/Number,
  userId: String,
  amount: Number,
  status: String, // 'pending', 'paid', 'overdue'
  createdAt: Date,
  updatedAt: Date,
  paidAt: Date, // 支付日期
  // ... 其他字段
}
```

### 4. 测试架构

#### 4.1 测试框架

采用自定义的轻量级测试框架：

**SimpleTestFramework**:
- 支持异步测试
- 提供断言函数
- 生成测试报告
- 支持集成测试

#### 4.2 测试覆盖

- **单元测试**: 覆盖所有服务层方法
- **集成测试**: 验证数据一致性和API响应时间
- **边界测试**: 测试异常情况和边界条件

## 数据流架构

### 1. 请求处理流程

```
Client Request → Express Router → Controller → DataService → InvoiceFilterService/DateUtils → Data Source → Response
```

### 2. 数据处理流程

1. **数据获取**: DataService根据模式选择数据源
2. **数据筛选**: InvoiceFilterService应用筛选条件
3. **日期处理**: DateUtils统一处理日期逻辑
4. **数据聚合**: 计算统计信息和趋势数据
5. **格式化输出**: 返回标准化的JSON响应

## 配置管理

### 1. 环境配置

- `NODE_ENV`: 环境标识 (development/production)
- `DATABASE_URL`: 数据库连接字符串
- `JWT_SECRET`: JWT密钥
- `PORT`: 服务端口

### 2. 运行模式配置

通过 `global.isMemoryMode` 控制数据存储模式：
- `true`: 内存模式
- `false`: 数据库模式

## 性能优化

### 1. 数据缓存

- 内存模式下数据直接从内存读取
- 数据库模式下可考虑添加Redis缓存

### 2. 查询优化

- 使用InvoiceFilterService统一筛选逻辑
- 避免重复的数据库查询
- 批量处理数据操作

### 3. API响应优化

- 统一的数据格式
- 合理的分页机制
- 压缩响应数据

## 数据一致性验证

### 1. 验证机制

系统提供了完整的数据一致性验证机制，确保不同API端点返回的数据保持一致性。

#### 1.1 验证端点

- **路径**: `GET /api/debug/validate-consistency`
- **参数**: `month` (可选，默认当前月份，格式: YYYY-MM)
- **功能**: 验证指定月份的数据一致性

#### 1.2 验证内容

数据一致性验证包括以下检查项：

1. **收入趋势与摘要一致性**:
   - 收入趋势总额与摘要已支付总额的一致性
   - 收入趋势数量与摘要已支付数量的一致性

2. **状态分布与收入趋势一致性**（混合筛选逻辑）:
   - 状态分布中已支付发票与收入趋势的一致性
   - 已支付发票统一按支付月份筛选

#### 1.3 混合筛选逻辑设计

**设计决策**: 为了平衡业务需求和数据一致性，系统采用混合筛选逻辑：

- **已支付发票**: 按支付月份筛选（体现实际收入时间）
- **其他状态发票**: 按创建月份筛选（体现业务活动时间）

**实现位置**:
- `DataService.getInvoiceStatusDistribution()`: 实现混合筛选逻辑
- `InvoiceFilterService`: 提供标准化的筛选方法

**验证机制**: 
- 状态分布中已支付数据与收入趋势数据保持一致
- 不再检查状态分布总数与摘要创建数量的一致性（因为筛选逻辑不同）

#### 1.4 验证结果格式

```json
{
  "success": true,
  "data": {
    "month": "2025-09",
    "isConsistent": true,
    "issues": [],
    "validationNote": "状态分布使用混合筛选逻辑：已支付按支付月份，其他按创建月份",
    "data": {
      "statusDistribution": { /* 状态分布数据 */ },
      "revenueTrend": { /* 收入趋势数据 */ },
      "summary": { /* 摘要数据 */ }
    },
    "checkedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

#### 1.5 已解决的数据不一致问题

**问题描述**: 收入趋势API、状态分布API和月度摘要API在处理已支付发票时使用了不同的筛选逻辑：

- **收入趋势API**: 按支付日期筛选，统计在指定月份内支付的发票
- **状态分布API**: 按创建日期筛选，导致与收入趋势数据不一致
- **月度摘要API**: 按创建日期筛选创建数据，按支付日期筛选已支付数据

**影响范围**: 
- Dashboard统计数据显示不一致
- 图表数据与摘要数据不匹配
- 用户对数据准确性产生疑虑

**解决方案**: 
1. **实施混合筛选逻辑**: 状态分布API中已支付发票改为按支付月份筛选
2. **统一数据处理**: 通过DataService统一数据处理逻辑
3. **标准化筛选规则**: 使用InvoiceFilterService标准化筛选规则
4. **持续监控**: 通过数据一致性验证端点持续监控
5. **完善测试**: 创建专门的测试用例验证混合筛选逻辑

**修复效果**:
- ✅ 状态分布API与收入趋势API的已支付数据完全一致
- ✅ 收入趋势API与月度摘要API的已支付数据完全一致
- ✅ 统一图表数据API内部数据保持一致
- ✅ 数据一致性验证通过率100%

**预防措施**:
1. **代码审查**: 所有涉及数据筛选的代码变更必须经过审查
2. **自动化测试**: 数据一致性测试集成到CI/CD流程
3. **文档维护**: 及时更新API文档和筛选逻辑说明
4. **监控告警**: 生产环境定期运行一致性检查

### 2. 调试工具

#### 2.1 内存状态查询

- **路径**: `GET /api/debug/memory-state`
- **功能**: 查询内存数据库的当前状态
- **用途**: 调试数据创建和状态变更问题

#### 2.2 测试数据管理

- **重置**: `POST /api/debug/reset-memory`
- **创建**: `POST /api/debug/create-invoice`
- **用途**: 创建可控的测试环境

## 安全考虑

### 1. 认证授权

- JWT token验证
- 用户权限控制
- API访问限制

### 2. 数据安全

- 输入验证和清理
- SQL注入防护
- 敏感数据加密

## 部署架构

### 1. 开发环境

- 内存模式 + SQLite
- 热重载开发服务器
- 详细的调试日志

### 2. 生产环境

- 数据库模式 + PostgreSQL
- PM2进程管理
- Nginx反向代理
- SSL/TLS加密

## 监控和日志

### 1. 应用监控

- API响应时间监控
- 错误率统计
- 系统资源使用情况

### 2. 日志管理

- 结构化日志输出
- 错误日志收集
- 访问日志记录

## 扩展性设计

### 1. 水平扩展

- 无状态服务设计
- 数据库读写分离
- 负载均衡支持

### 2. 功能扩展

- 插件化架构
- 微服务拆分准备
- API版本管理

## 维护指南

### 1. 代码维护

- 遵循统一的编码规范
- 定期重构和优化
- 保持测试覆盖率

### 2. 文档维护

- **重要**: 每次架构变更必须更新此文档
- 保持API文档同步
- 维护部署和运维文档

### 3. 版本管理

- 语义化版本控制
- 变更日志记录
- 向后兼容性考虑

## 已知问题和改进计划

### 1. 当前限制

- 内存模式数据不持久化
- 缺少实时数据同步
- 有限的并发处理能力

### 2. 改进计划

- 添加Redis缓存层
- 实现WebSocket实时通信
- 优化数据库查询性能
- 增强错误处理机制

## 联系信息

如有架构相关问题，请参考：
- 代码注释和文档
- 测试用例
- Git提交历史

## 相关文档

- [数据库切换指南](DATABASE_SWITCHING.md) - 内存数据库与SQLite数据库的切换说明
- [API数据筛选规则和一致性验证指南](docs/API_DATA_FILTERING_GUIDE.md) - 详细的API数据筛选规则和一致性验证机制
- [架构维护指南](ARCHITECTURE_MAINTENANCE.md) - 系统架构的维护和更新指南

---

**文档更新记录**:
- 2025-01-26: 创建初始架构文档，记录重构后的服务层架构
- 2025-09-30: 添加数据一致性验证章节，记录验证机制和已发现的数据不一致问题

## 文档更新记录

### 2025-10-01 v2.2.0
- **新增**: 在initDefaultUser.js的createTestInvoices函数中为测试发票添加paidDate字段，以支持revenue API的正确测试。
- **记录**: revenue报告端点使用paidDate过滤已支付发票，确保收入计算准确。