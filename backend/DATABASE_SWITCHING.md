# 数据库切换指南

本项目支持在PostgreSQL和内存数据库之间切换，以便在不同环境下使用最适合的数据库类型。

## 如何切换数据库类型

1. 打开 `.env` 文件
2. 修改 `DB_TYPE` 环境变量的值：
   - `DB_TYPE=postgres` - 使用PostgreSQL数据库（默认）
   - `DB_TYPE=memory` - 使用内存数据库

## 数据库类型说明

### PostgreSQL数据库
- 适用于生产环境
- 数据持久化存储
- 需要配置PostgreSQL服务器

### 内存数据库
- 适用于开发环境
- 数据不持久化，重启服务器后数据会丢失
- 不需要配置外部数据库服务器
- 适合快速开发和测试

## 示例配置

### 使用PostgreSQL（生产环境）
```
DB_TYPE=postgres
DB_NAME=invoice_saas
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
```

### 使用内存数据库（开发环境）
```
DB_TYPE=memory
# 其他数据库配置将被忽略
```

## 注意事项

- 切换数据库类型后，需要重启服务器才能生效
- 内存数据库中的数据在服务器重启后会丢失
- 在生产环境中建议使用PostgreSQL数据库