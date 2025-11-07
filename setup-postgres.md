# PostgreSQL 安装和配置指南

## 1. 安装 PostgreSQL

### Windows 安装步骤：
1. 访问 https://www.postgresql.org/download/windows/
2. 下载 PostgreSQL 安装程序
3. 运行安装程序，设置密码（建议使用 .env 文件中的密码）
4. 记住端口号（默认5432）和数据目录

### 快速安装（使用 Chocolatey）：
```powershell
# 如果没有 Chocolatey，先安装：
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 PostgreSQL
choco install postgresql
```

## 2. 创建数据库和用户

连接到 PostgreSQL 并执行：
```sql
-- 创建数据库
CREATE DATABASE invoice_app;

-- 创建用户（如果需要）
CREATE USER postgres WITH PASSWORD 'password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE invoice_app TO postgres;
```

## 3. 验证连接

在项目根目录运行：
```bash
cd backend
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'invoice_app',
  user: 'postgres',
  password: 'password'
});
client.connect().then(() => {
  console.log('✅ 连接成功！');
  client.end();
}).catch(err => console.log('❌ 连接失败:', err.message));
"
```

## 4. 切换到 PostgreSQL

修改 `.env` 文件：
```
DB_TYPE=postgres
```

然后重启后端服务。