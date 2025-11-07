# Reports界面改进方案

## 一、核心结论

"头部仪表盘只做四块：KPI 卡片、应收趋势、逾期名单、催款按钮"——把这四块拆成 12 个可复用 React 组件 + 5 条 SQL，实现高效的报表系统。

## 二、竞品功能拆解与对照

| 竞品 | 共性模块 | 具体实现 | 我们抄什么 | 我们弃什么 |
|------|----------|----------|------------|------------|
| Zoho | Total Receivables 卡片 | 分 Current / Overdue 两子项 | ✅ 抄"未收/逾期"双卡片 | 弃"项目工时"区块 |
| FreshBooks | Outstanding 图+表 | 条形图 + 账龄桶 0-30/31-60/61-90/90+ | ✅ 抄账龄桶 | 弃"银行连接" |
| Xero | 现金流折线 | 6 个月收/支双线 | ✅ 抄"收入趋势"单线 | 弃"多银行余额" |
| Stripe | Payment Method 饼图 | Card/PayPal/PIX 占比 | ✅ 抄渠道饼图 | 弃"订阅 MRR" |

## 三、页面分工设计

### 1. Dashboard（极简，≤1 屏）

#### KPI 卡片 4 枚
1. 未收应收（Current AR）
2. 逾期总额（Overdue）
3. 近 30 天已收（Payments 30d）
4. 平均到账天数（Avg Days to Pay）

#### 趋势图 1 张
近 6 个月"收入/应收"双折线（recharts 面积图，hover 显数值）

#### 操作按钮 2 个
- "新建发票"（已存在）
- "查看详细报告"→跳转 Reports

#### 数据接口 1 个
`GET /api/metrics/summary?from=6m&currency=BRL`
（Redis 缓存 5 min，key=`metrics:{orgId}:{currency}:{from}`）

### 2. Reports（详细，单页）

#### 顶部控制栏
日期范围（Today/7d/30d/Custom）+ 币种切换 + 导出 CSV/PDF

#### 子区域 3 块（均支持下载）
1. Invoice Aging 桶（条形图 + 表）
2. Top 5 逾期客户（可勾选→批量催款）
3. 最近 50 笔付款记录（含手续费、渠道图标）

#### 底部明细表
可搜索/分页的 Invoice 全列表，字段：编号、客户、状态、到期日、逾期天数、金额、操作（View / Send reminder / Upload proof）

#### 数据接口 3 个
- `GET /api/reports/aging`
- `GET /api/reports/overdue-customers?limit=5`
- `GET /api/reports/recent-payments?limit=50`

## 四、数据模型 & 关键 SQL

### KPI 4 枚
```sql
SELECT 
  (SELECT SUM(total) FROM invoices WHERE status != 'paid') AS total_receivables, 
  (SELECT SUM(total) FROM invoices WHERE due_at < NOW() AND status != 'paid') AS overdue_amount, 
  (SELECT SUM(amount) FROM payments WHERE captured_at >= NOW() - INTERVAL '30 days') AS payments_30d, 
  (SELECT AVG(EXTRACT(EPOCH FROM (paid_at - issued_at))/86400) FROM invoices WHERE status='paid') AS avg_days_to_pay;
```

### Invoice Aging 桶
```sql
SELECT 
  SUM(CASE WHEN due_at >= NOW() THEN total ELSE 0 END) AS current, 
  SUM(CASE WHEN age(due_at) > INTERVAL '0 days' AND age(due_at) <= INTERVAL '30 days' THEN total ELSE 0 END) AS bucket_0_30, 
  SUM(CASE WHEN age(due_at) > INTERVAL '30 days' AND age(due_at) <= INTERVAL '60 days' THEN total ELSE 0 END) AS bucket_31_60, 
  SUM(CASE WHEN age(due_at) > INTERVAL '60 days' AND age(due_at) <= INTERVAL '90 days' THEN total ELSE 0 END) AS bucket_61_90, 
  SUM(CASE WHEN age(due_at) > INTERVAL '90 days' THEN total ELSE 0 END) AS bucket_90_plus 
FROM invoices 
WHERE status != 'paid';
```

### Top 逾期客户
```sql
SELECT c.id, c.name, SUM(i.total) AS overdue_amount, COUNT(i.id) AS invoice_count 
FROM invoices i 
JOIN clients c ON c.id = i.client_id 
WHERE i.due_at < NOW() AND i.status != 'paid' 
GROUP BY c.id, c.name 
ORDER BY overdue_amount DESC 
LIMIT 5;
```

### 客户支付行为分析（新增）
```sql
SELECT 
  c.id,
  c.name,
  COUNT(i.id) AS total_invoices,
  AVG(EXTRACT(EPOCH FROM (i.paid_at - i.due_at))/86400) AS avg_days_late,
  SUM(CASE WHEN i.paid_at <= i.due_at THEN 1 ELSE 0 END) AS on_time_count
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id AND i.status = 'paid'
GROUP BY c.id, c.name
HAVING COUNT(i.id) > 0
ORDER BY avg_days_late;
```

### 现金流预测（新增）
```sql
SELECT 
  DATE_TRUNC('month', due_at) AS month,
  SUM(total) AS projected_amount
FROM invoices
WHERE status != 'paid' AND due_at BETWEEN NOW() AND NOW() + INTERVAL '3 months'
GROUP BY month
ORDER BY month;
```

## 五、前端组件拆分（React + recharts）

| 组件名 | props | 职责 |
|--------|-------|------|
| `<KpiCards data={kpi} />` | `{totalReceivables, overdue, payments30d, avgDays}` | 4 卡片布局 |
| `<IncomeTrendLine data={timeseries} />` | `[{date, payments, ar}]` | 面积/折线双轴 |
| `<AgingBar data={aging} />` | `bucket` 对象 | 条形图 |
| `<OverdueTable data={customers} />` | `onSendReminder` | 可勾选 + 批量操作 |
| `<PaymentTable data={payments} />` | 无 | 最近付款列表 |
| `<DateRangePicker onChange={} />` | 无 | Today/7d/30d/Custom |
| `<PaymentBehaviorChart />` | 客户支付行为数据 | 客户支付行为分析图表 |
| `<CashFlowForecast />` | 现金流预测数据 | 现金流预测图表 |
| `<MarketComparison />` | 不同市场数据 | 市场对比分析图表 |
| `<ExportMenu />` | 导出选项 | 导出选项菜单 |

## 六、缓存 & 实时策略

- 聚合查询结果 Redis 缓存 5 min，key 含 `orgId+currency+fromDate`
- payment webhook → `DEL metrics:{orgId}:*` 立即失效，前端轮询 30 s 内刷新
- 首屏 SSR 或静态骨架屏，保证 <1.5 s

## 七、实施优先级

### 第一阶段（核心功能）
1. Dashboard页面的KPI卡片和收入趋势图
2. Reports页面的Invoice Aging桶和逾期客户列表
3. 基本的数据接口和SQL查询

### 第二阶段（增强功能）
1. Reports页面的付款记录表格
2. 导出功能
3. 缓存和实时更新策略

### 第三阶段（高级功能）
1. 客户支付行为分析
2. 现金流预测
3. 市场对比分析

## 八、技术实现建议

### 图表库选择
使用 **Recharts**，因为：
- 与React完美集成
- API设计简洁，学习成本低
- 支持需要的所有图表类型
- 社区活跃，文档完善

### 状态管理
使用 **React Context** + **useReducer** 管理状态，避免引入Redux等重型状态管理库。

### 样式方案
继续使用 **Tailwind CSS**，与现有项目保持一致，提高开发效率。

## 九、补充建议

### Dashboard页面优化
- 在KPI卡片中添加**趋势指示器**（如↑↓箭头和百分比），显示与上一周期的对比
- 在"平均到账天数"指标旁添加**行业平均值**作为参考
- "查看详细报告"按钮改为**"查看分析报告"**，更突出分析价值

### Reports页面优化
- 在顶部控制栏增加**市场筛选器**（法国/全部）
- 在"最近50笔付款记录"中增加**成功率指标**（如支付成功/失败比例）
- 底部明细表增加**批量操作**功能，如批量发送提醒、批量导出等

## 十、交付物清单

- [x] 方案文档（本文档）
- [ ] Dashboard单页React代码（KpiCards + IncomeTrendLine，已联调fake-data）
- [ ] Reports页面全套组件 + 表格导出按钮（含CSV下载）
- [ ] 后端 `/api/metrics/*` 路由 + SQL文件（Node/Prisma或Python/SQLAlchemy版）
- [ ] Postman集合 + 环境变量（一键导入即跑）
- [ ] A/B测试方案（空白vs带背景图登录页，注册转化率对比）