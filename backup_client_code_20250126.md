# 客户代码备份 - 2025年1月26日

## 备份说明
在重新实现统一客户数据库系统之前，备份当前的客户相关代码。

## 问题总结
1. 多重数据管理系统冲突（UnifiedDataContext、ClientContext、直接clientService调用）
2. API调用混乱，数据状态不一致
3. 客户界面无法创建新客户
4. 发票界面新建的客户信息无法保存

## 涉及的文件
- frontend/src/contexts/UnifiedDataContext.js - 统一数据管理上下文
- frontend/src/context/ClientContext.js - 客户上下文管理
- frontend/src/services/clientService.js - 客户服务API调用
- frontend/src/pages/Clients.js - 客户管理页面
- frontend/src/pages/NewInvoiceForm.js - 新建发票表单
- backend/src/routes/clients.js - 客户API路由
- backend/src/models/Client.js - 客户数据模型

## 重新实现计划
1. 删除冗余的数据管理系统
2. 统一使用一个简洁的客户数据管理方案
3. 确保前后端API调用一致性
4. 简化客户创建和保存逻辑
5. 减少bug和数据不一致问题

## 备份时间
2025年1月26日