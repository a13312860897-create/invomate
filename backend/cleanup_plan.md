# 脚本清理计划

## 明确无用的脚本（直接删除）
这些脚本是临时调试文件，没有长期价值：

### 临时调试脚本
- temp_api_log.txt - 临时API日志文件
- test.txt - 临时测试文件

### 重复的数据检查脚本
- check_current_data.js - 与其他检查脚本功能重复
- check_current_invoices.js - 与其他检查脚本功能重复
- check_invoices.js - 基础检查，功能已被更完善的脚本覆盖
- check_latest_invoice.js - 单一功能，价值有限

### 重复的调试脚本
- debug_api_simple.js - 简化版本，已有更完善的版本
- debug_actual_data.js - 功能重复
- debug_memory_state.js - 功能被其他脚本覆盖
- debug_server_memory.js - 功能重复

## 可能有用的脚本（移动到archive）
这些脚本可能在未来的调试或分析中有用：

### 数据分析脚本
- analyze_data_consistency.js - 数据一致性分析
- analyze_data_issue.js - 数据问题分析
- analyze_data_issue_detailed.js - 详细数据问题分析
- analyze_data_sources.js - 数据源分析

### 专项调试脚本
- debug_date_utils.js - 日期工具调试
- debug_time_zone.js - 时区调试
- debug_monthly_revenue_trend.js - 月度收入趋势调试
- debug_invoice_filtering.js - 发票过滤调试

### 测试脚本
- test_dashboard_api.js - 仪表板API测试
- test_invoice_api.js - 发票API测试
- test_unified_api.js - 统一API测试

## 保留的重要脚本
这些脚本有明确的功能价值，应该保留：

### 诊断脚本
- diagnose_data_inconsistency.js - 数据不一致诊断（刚修复问题时使用）
- diagnose_server_memory_state.js - 服务器内存状态诊断

### 备份文件
- backup_create_test_invoices.js - 测试发票创建脚本备份
- backup_original_create_test_invoices.js - 原始测试发票脚本备份

### 文档
- codebase_analysis_report.md - 代码库分析报告
- ARCHITECTURE.md - 架构文档
- ARCHITECTURE_MAINTENANCE.md - 架构维护文档
- DATABASE_SWITCHING.md - 数据库切换文档