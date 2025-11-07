# SSL证书设置指南

## 概述
为了接收Paddle的Webhook通知，你的服务器必须使用HTTPS。本指南将帮助你设置SSL证书。

## 选项1：使用Let's Encrypt（推荐，免费）

### 前提条件
- 拥有一个域名（例如：yourdomain.com）
- 域名已指向你的服务器IP
- 服务器运行在Linux上

### 步骤1：安装Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 步骤2：获取SSL证书
```bash
# 为你的域名获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 或者如果你使用Apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### 步骤3：自动续期
```bash
# 测试自动续期
sudo certbot renew --dry-run

# 设置定时任务
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

## 选项2：使用Cloudflare（简单）

### 步骤1：注册Cloudflare账户
1. 访问 https://cloudflare.com
2. 注册账户并添加你的域名

### 步骤2：配置DNS
1. 将域名的DNS服务器改为Cloudflare提供的
2. 在Cloudflare面板中添加A记录指向你的服务器IP

### 步骤3：启用SSL
1. 在Cloudflare面板中，进入SSL/TLS设置
2. 选择"Full"或"Full (strict)"模式
3. 等待几分钟让证书生效

## 选项3：购买商业SSL证书

### 推荐提供商
- DigiCert
- Comodo
- GoDaddy
- Namecheap

### 步骤
1. 购买SSL证书
2. 生成CSR（证书签名请求）
3. 提交CSR给证书颁发机构
4. 下载并安装证书到你的服务器

## 验证SSL设置

### 在线工具
- https://www.ssllabs.com/ssltest/
- https://www.digicert.com/help/

### 命令行测试
```bash
# 测试SSL连接
openssl s_client -connect yourdomain.com:443

# 检查证书信息
curl -I https://yourdomain.com
```

## Nginx配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Paddle Webhook端点
    location /api/paddle/webhook {
        proxy_pass http://localhost:5000/api/paddle/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Apache配置示例

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/yourdomain.com/chain.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Paddle Webhook端点
    ProxyPass /api/paddle/webhook http://localhost:5000/api/paddle/webhook
    ProxyPassReverse /api/paddle/webhook http://localhost:5000/api/paddle/webhook
</VirtualHost>
```

## 配置Paddle Webhook URL

设置完SSL后，在Paddle Dashboard中配置Webhook URL：
```
https://yourdomain.com/api/paddle/webhook
```

## 故障排除

### 常见问题
1. **证书未生效**：等待DNS传播（最多48小时）
2. **混合内容错误**：确保所有资源都使用HTTPS
3. **Webhook失败**：检查服务器日志和防火墙设置

### 检查清单
- [ ] 域名已指向服务器IP
- [ ] SSL证书已安装并有效
- [ ] 服务器防火墙允许443端口
- [ ] Nginx/Apache配置正确
- [ ] Paddle Webhook URL已更新

## 下一步

SSL证书设置完成后：
1. 更新Paddle Dashboard中的Webhook URL
2. 测试支付流程
3. 监控Webhook事件日志

## 需要帮助？

如果遇到问题，请提供：
- 你的域名
- 服务器操作系统
- 错误信息截图
- 服务器日志