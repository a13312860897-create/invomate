# 发票管理SaaS系统后端

这是一个基于Node.js和Express的发票管理SaaS系统的后端项目。

## 功能特点

- 用户认证（JWT）
- 客户管理（CRUD操作）
- 发票管理（CRUD操作）
- PDF发票生成
- 文件上传
- 错误处理
- 数据验证

## 技术栈

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- Bcrypt
- PDFKit
- Multer
- Joi
- CORS
- Dotenv

## 开始使用

### 安装依赖

```bash
cd backend
npm install
```

### 配置环境变量

创建 `.env` 文件并添加以下环境变量：

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoice-saas
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

### 启动开发服务器

```bash
npm start
```

或者使用nodemon进行开发：

```bash
npm run dev
```

服务器将在 `http://localhost:5000` 上运行。

## 项目结构

```
src/
├── config/            # 配置文件
│   ├── db.js         # 数据库连接
│   └── upload.js     # 文件上传配置
├── controllers/      # 控制器
│   ├── authController.js
│   ├── clientController.js
│   ├── invoiceController.js
│   └── pdfController.js
├── middleware/       # 中间件
│   ├── auth.js       # 认证中间件
│   ├── error.js      # 错误处理中间件
│   └── validation.js # 数据验证中间件
├── models/           # 数据模型
│   ├── User.js
│   ├── Client.js
│   └── Invoice.js
├── routes/           # 路由
│   ├── auth.js
│   ├── clients.js
│   ├── invoices.js
│   └── pdf.js
├── utils/            # 工具函数
│   ├── generateInvoiceNumber.js
│   └── sendEmail.js
└── server.js         # 服务器入口
```

## API端点

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/updatedetails` - 更新用户详情
- `PUT /api/auth/updatepassword` - 更新密码

### 客户管理

- `GET /api/clients` - 获取所有客户
- `GET /api/clients/:id` - 获取单个客户
- `POST /api/clients` - 创建新客户
- `PUT /api/clients/:id` - 更新客户
- `DELETE /api/clients/:id` - 删除客户

### 发票管理

- `GET /api/invoices` - 获取所有发票
- `GET /api/invoices/:id` - 获取单个发票
- `POST /api/invoices` - 创建新发票
- `PUT /api/invoices/:id` - 更新发票
- `DELETE /api/invoices/:id` - 删除发票
- `PUT /api/invoices/:id/status` - 更新发票状态

### PDF生成

- `GET /api/pdf/invoice/:id` - 生成发票PDF

## 数据模型

### 用户

```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  companyName: String,
  phone: String,
  address: String,
  currency: String,
  language: String,
  role: String
}
```

### 客户

```javascript
{
  name: String,
  email: String,
  company: String,
  phone: String,
  address: String,
  user: ObjectId // 关联用户
}
```

### 发票

```javascript
{
  invoiceNumber: String,
  issueDate: Date,
  dueDate: Date,
  status: String,
  items: [
    {
      description: String,
      quantity: Number,
      price: Number,
      total: Number
    }
  ],
  subtotal: Number,
  taxRate: Number,
  taxAmount: Number,
  total: Number,
  notes: String,
  client: ObjectId, // 关联客户
  user: ObjectId    // 关联用户
}
```

## 错误处理

后端使用自定义错误处理中间件来处理错误，包括：

- 验证错误
- 认证错误
- 数据库错误
- 文件上传错误
- 服务器错误

## 安全性

- 密码使用bcrypt进行哈希处理
- 使用JWT进行用户认证
- 输入验证
- CORS配置
- 速率限制（可配置）

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT