# 数据一致性测试指南

## 概述
本指南介绍如何运行数据一致性检验，确保系统在各种配置下都能正常工作。

## 测试环境
- **内存数据库模式**: 使用 `MEMORY_DB=true` 环境变量
- **SQLite数据库模式**: 默认配置，使用Prisma和SQLite

## 快速开始

### 1. 运行一致性检验
```bash
# 运行所有一致性测试
cd g:\发票软件
node tests/run-all-consistency-tests.js

# 查看测试结果
cat tests/consistency/reports/latest-results.json
```

### 2. 手动测试API端点
```bash
# 测试健康检查
curl http://localhost:3002/api/health

# 测试仪表板数据（确保后端已启动）
curl http://localhost:3002/api/dashboard/unified-chart-data?month=2025-10
```

### 3. 数据验证
```bash
# 检查内存数据库中的数据
cd g:\发票软件\backend
node checkData.js

# 添加测试数据
cd g:\发票软件\backend
node addTestData.js
```

## 测试用例

### 仪表板数据一致性
测试以下API端点在不同数据源下的表现：
- `/api/dashboard/unified-chart-data`
- `/api/dashboard/invoice-status-distribution`
- `/api/dashboard/monthly-revenue-trend`

### 验证要点
1. **数据完整性**: 确保发票状态分布和收入趋势数据完整
2. **时间筛选**: 验证月份筛选功能正常工作
3. **错误处理**: 确保API能正确处理异常情况
4. **性能**: 验证大数据量下的响应时间

## 故障排除

### 常见问题

#### 1. 内存数据库数据为空
**症状**: 检查数据显示发票数量为0
**解决**: 运行 `node addTestData.js` 添加测试数据

#### 2. API返回空数据
**症状**: 前端显示无数据
**解决**: 
- 确认后端服务已启动
- 检查数据库连接
- 验证测试数据已正确添加

#### 3. 时间筛选不工作
**症状**: 月份切换无数据变化
**解决**: 检查日期格式和时区设置

## 自动化测试

### 运行框架测试
```bash
# 运行API测试框架
cd g:\发票软件\tests
node framework/TestRunner.js

# 运行数据验证
cd g:\发票软件\tests
node framework/DataValidator.js
```

### 监控和报告
测试结果会自动保存到：
- `tests/consistency/reports/latest-results.json`
- `reports/latest-results.json`

## 最佳实践

1. **定期测试**: 建议每天运行一次一致性检验
2. **版本控制**: 将测试脚本纳入版本控制
3. **文档更新**: 及时更新测试文档和用例
4. **错误跟踪**: 记录和跟踪发现的问题

## 联系支持
如遇到无法解决的问题，请查看：
- 系统日志：`backend/logs/`
- 错误报告：`reports/`
- 调试脚本：`backend/archive/`