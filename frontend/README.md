# 发票管理SaaS系统前端

这是一个基于React的发票管理SaaS系统的前端项目。

## 功能特点

- 用户认证（登录、注册、登出）
- 仪表板（统计信息、最近发票）
- 发票管理（创建、查看、编辑、删除发票）
- 客户管理（添加、查看、编辑、删除客户）
- PDF发票生成
- 响应式设计
- 多语言支持
- 通知系统

## 技术栈

- React 18
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- React Icons
- React Hot Toast

## 开始使用

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm start
```

应用程序将在 `http://localhost:3000` 上运行。

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/         # 可重用组件
│   ├── Layout/        # 布局组件
│   │   ├── Header.js
│   │   ├── Layout.js
│   │   └── Sidebar.js
│   └── UI/            # UI组件
├── context/           # React Context
│   └── AuthContext.js
├── pages/             # 页面组件
│   ├── Dashboard.js
│   ├── Invoices.js
│   ├── InvoiceDetail.js
│   ├── InvoiceForm.js
│   ├── Clients.js
│   ├── ClientForm.js
│   ├── Login.js
│   ├── Register.js
│   ├── Settings.js
│   └── NotFound.js
├── App.js             # 主应用组件
├── index.css          # 全局样式
└── index.js           # 应用入口
```

## 后端API

前端项目与后端API通信，后端运行在 `http://localhost:5000`。API端点包括：

- `/api/auth/*` - 认证相关
- `/api/clients/*` - 客户管理
- `/api/invoices/*` - 发票管理
- `/api/pdf/*` - PDF生成

## 环境变量

创建 `.env` 文件以配置环境变量：

```
REACT_APP_API_URL=http://localhost:5000
```

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT