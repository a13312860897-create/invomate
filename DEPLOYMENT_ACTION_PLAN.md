# 发票软件部署行动计划

## 问题总结

当前状态：
- ✅ 前端已部署到Netlify: https://invomate.app
- ❌ 后端仍在本地运行 (localhost:3002)
- ❌ 前端尝试连接不存在的API地址导致所有功能失效

## 立即行动方案

### 方案1: 快速验证 - 使用ngrok (30分钟)

**目标**: 快速让Netlify上的前端能够访问本地后端

#### 步骤:
1. **安装ngrok**
   ```bash
   # 下载并安装ngrok
   # 或使用: npm install -g ngrok
   ```

2. **启动本地后端** (确保运行在3002端口)
   ```bash
   cd backend
   npm start
   ```

3. **暴露本地后端**
   ```bash
   ngrok http 3002
   ```
   获得类似: `https://abc123.ngrok.io`

4. **更新前端API配置**
   ```javascript
   // frontend/.env.production
   REACT_APP_API_URL=https://abc123.ngrok.io
   ```

5. **重新部署前端**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

**优点**: 快速验证，无需云服务配置
**缺点**: ngrok链接会变化，仅用于测试

### 方案2: 生产部署 - Railway (推荐)

**目标**: 完整的云端部署解决方案

#### 阶段1: 准备后端部署 (1小时)

1. **创建生产环境配置**
   ```bash
   # backend/.env.production
   NODE_ENV=production
   PORT=8080
   DB_TYPE=postgres
   DATABASE_URL=${DATABASE_URL}  # Railway自动提供
   JWT_SECRET=${JWT_SECRET}
   CORS_ORIGIN=https://invomate.app,https://*.netlify.app
   ```

2. **更新CORS配置**
   ```javascript
   // backend/src/server.js
   app.use(cors({
     origin: [
       'http://localhost:3001', 
       'http://localhost:3003', 
       'http://localhost:3004', 
       'https://invomate.app',
       'https://*.netlify.app'
     ],
     credentials: true
   }));
   ```

3. **添加部署脚本**
   ```json
   // backend/package.json
   {
     "scripts": {
       "build": "echo 'No build step required'",
       "start": "node --max-http-header-size=32768 src/server.js"
     }
   }
   ```

#### 阶段2: Railway部署 (30分钟)

1. **创建Railway项目**
   - 访问 railway.app
   - 连接GitHub仓库或直接部署
   - 选择后端目录

2. **配置环境变量**
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_jwt_secret
   SENDGRID_API_KEY=your_key
   OPENAI_API_KEY=your_key
   ```

3. **添加PostgreSQL数据库**
   - Railway自动提供DATABASE_URL
   - 运行数据库迁移

4. **获取部署URL**
   - 类似: `https://your-app.railway.app`

#### 阶段3: 更新前端配置 (15分钟)

1. **更新API配置**
   ```javascript
   // frontend/.env.production
   REACT_APP_API_URL=https://your-app.railway.app
   ```

2. **重新部署前端**
   ```bash
   npm run build
   netlify deploy --prod --dir=build
   ```

## 替代云服务选项

### Render (免费层)
- **优点**: 有免费层，易于使用
- **缺点**: 冷启动延迟
- **成本**: 免费 + $7/月数据库

### Vercel (适合Node.js)
- **优点**: 与前端同平台
- **缺点**: 无状态函数限制
- **成本**: 免费层 + 外部数据库

### Heroku (付费)
- **优点**: 成熟稳定
- **缺点**: 无免费层
- **成本**: $7/月 + $9/月数据库

## 数据库迁移计划

### 当前状态
- 使用SQLite (dev.db)
- 需要迁移到PostgreSQL

### 迁移步骤
1. **导出现有数据**
   ```bash
   # 如果有重要数据需要保留
   sqlite3 prisma/dev.db .dump > backup.sql
   ```

2. **更新Prisma配置**
   ```javascript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **运行迁移**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## 监控和调试

### 部署后检查清单
- [ ] 后端API健康检查
- [ ] 前端能够加载
- [ ] 登录功能正常
- [ ] 数据库连接正常
- [ ] CORS配置正确
- [ ] 环境变量设置正确

### 常见问题排查
1. **CORS错误**: 检查后端CORS配置
2. **数据库连接失败**: 验证DATABASE_URL
3. **API 404错误**: 检查路由配置
4. **环境变量未生效**: 重新部署应用

## 成本预估

### Railway方案
- 应用托管: $5/月 (免费额度后)
- PostgreSQL: $5/月
- **总计**: $10/月

### Render方案
- 应用托管: 免费
- PostgreSQL: $7/月
- **总计**: $7/月

## 推荐执行顺序

### 今天 (2小时)
1. ✅ 完成问题分析
2. 🔄 执行ngrok快速验证
3. 🔄 验证功能是否正常

### 明天 (3小时)
1. 选择云服务提供商 (推荐Railway)
2. 部署后端到云端
3. 更新前端配置并重新部署
4. 完整功能测试

### 后续优化 (1-2小时)
1. 配置自定义域名
2. 添加监控和日志
3. 性能优化
4. 安全加固

---

**下一步**: 选择执行方案1 (ngrok快速验证) 还是直接进行方案2 (Railway部署)？