# Netlify 部署指南

## 手动部署步骤

如果通过 Netlify 网站上传时遇到问题，可以尝试以下手动部署方法：

### 方法一：通过 Git 部署

1. 将代码推送到 GitHub 仓库
2. 登录 Netlify 网站
3. 点击 "New site from Git"
4. 选择 GitHub 并授权
5. 选择包含前端代码的仓库
6. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `build`
7. 点击 "Deploy site"

### 方法二：通过 Netlify CLI 部署

1. 安装 Netlify CLI：
   ```
   npm install netlify-cli -g
   ```

2. 登录 Netlify 账户：
   ```
   netlify login
   ```

3. 在项目根目录运行：
   ```
   netlify deploy --prod
   ```

4. 按照提示选择或创建站点，并指定发布目录为 `build`

### 方法三：拖放上传

1. 访问 Netlify 网站
2. 登录您的账户
3. 点击 "Sites" 选项卡
4. 拖放 `build` 文件夹到页面上的拖放区域

## 可能的问题解决方案

### 1. 上传时遇到连接问题

- 尝试使用不同的浏览器（Chrome、Firefox、Edge）
- 禁用所有浏览器扩展和广告拦截器
- 尝试使用浏览器的隐身模式
- 检查网络连接，尝试使用不同的网络
- 清除浏览器缓存和 Cookie

### 2. 上传后页面无法加载

- 检查 `netlify.toml` 配置文件是否正确
- 确认 `build` 文件夹包含所有必要的文件
- 检查控制台是否有错误信息
- 确认 API URL 配置正确（生产环境应为 https://invoice-saas-backend.onrender.com）

### 3. 路由问题

- 确认 `netlify.toml` 中的重定向规则已正确设置
- 所有路由应重定向到 `index.html`

## 联系支持

如果以上方法都无法解决问题，可以联系 Netlify 支持团队：
- 官方文档：https://docs.netlify.com/
- 支持论坛：https://community.netlify.com/