# 月份切换功能使用指南

## 功能概述

我已经为您的发票软件实现了灵活的月份切换功能，现在您可以：

1. **自动使用当前月份** - 当月份过去时自动切换到下个月
2. **手动切换月份** - 查看任意月份的数据
3. **固定月份模式** - 用于测试特定月份的数据

## 如何使用

### 1. 切换到自动月份模式

编辑文件：`frontend/src/utils/dateUtils.js`

```javascript
export const DateConfig = {
  // 设置为true使用当前月份，false使用固定月份
  USE_CURRENT_MONTH: true,  // 改为 true
  // 当USE_CURRENT_MONTH为false时使用的固定月份
  FIXED_MONTH: '2025-10'
};
```

### 2. 保持固定月份模式（当前设置）

```javascript
export const DateConfig = {
  USE_CURRENT_MONTH: false,  // 保持 false
  FIXED_MONTH: '2025-10'     // 可以改为任意月份，如 '2025-11'
};
```

### 3. 添加月份选择器（可选）

如果您想在界面上添加月份切换按钮，可以使用我创建的 `MonthSelector` 组件：

```javascript
import MonthSelector from './components/Dashboard/MonthSelector';
import { DateProvider, useDateContext } from './context/DateContext';

// 在您的仪表板组件中使用
const Dashboard = () => {
  const { currentMonth, changeMonth } = useDateContext();
  
  return (
    <div>
      <MonthSelector 
        currentMonth={currentMonth}
        onMonthChange={changeMonth}
      />
      {/* 其他仪表板内容 */}
    </div>
  );
};
```

## 数据库配置

### 当前使用内存数据库
- 优点：无需配置，开箱即用
- 缺点：每次重启服务器数据会丢失

### 切换到PostgreSQL（推荐用于生产环境）

1. 安装PostgreSQL数据库
2. 修改 `backend/.env` 文件：
```
DB_TYPE=postgres  # 改为 postgres
DB_NAME=invoice_saas
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

3. 重启后端服务器

## 测试数据创建

### 为当前月份创建测试数据

```bash
cd backend
node create_october_test_invoices.js
```

### 通过前端界面创建数据
1. 登录系统
2. 进入"发票管理"页面
3. 点击"新建发票"
4. 创建一些发票数据

## 常见问题

### Q: 为什么看不到数据？
A: 如果使用内存数据库，每次重启服务器数据会清空。建议：
1. 切换到PostgreSQL数据库，或
2. 通过前端界面重新创建一些发票数据

### Q: 如何查看不同月份的数据？
A: 
1. 修改 `dateUtils.js` 中的 `FIXED_MONTH` 值
2. 或者集成 `MonthSelector` 组件实现界面切换

### Q: 月份会自动切换吗？
A: 当 `USE_CURRENT_MONTH: true` 时，系统会自动使用当前月份。每当月份变化时，系统会自动显示新月份的数据。

## 技术实现

- **日期工具类**: `frontend/src/utils/dateUtils.js`
- **月份选择器**: `frontend/src/components/Dashboard/MonthSelector.js`
- **日期上下文**: `frontend/src/context/DateContext.js`
- **已更新的组件**: 所有仪表板图表组件都已使用新的日期工具类

现在您的系统具备了完整的月份管理功能！