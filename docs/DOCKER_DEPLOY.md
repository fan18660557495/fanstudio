# Docker 部署指南

本文档介绍如何使用 Docker 部署 FanStudio 个人博客网站。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/fan18660557495/fanstudio.git
cd fanstudio
```

### 2. 创建环境变量文件

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下配置：

```env
# 必须修改
NEXTAUTH_SECRET=your-very-secure-secret-key-here

# 可选修改
PORT=3333
DB_ROOT_PASSWORD=your-root-password
DB_PASSWORD=your-db-password
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问应用

- 前台：http://localhost:3333
- 后台：http://localhost:3333/admin

首次启动会自动：
1. 创建 MySQL 数据库
2. 执行数据库迁移
3. 启动应用服务

---

## 1Panel 面板部署（推荐）

### 方式一：使用 1Panel 应用商店

1. **安装 Docker 环境**
   - 在 1Panel 面板 → 容器 → 安装 Docker

2. **上传项目文件**
   ```bash
   # 在服务器上创建目录
   mkdir -p /opt/fanstudio
   cd /opt/fanstudio
   
   # 上传项目文件（使用 scp 或 sftp）
   # 或直接 git clone
   git clone https://github.com/fan18660557495/fanstudio.git .
   ```

3. **创建环境变量**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   修改关键配置：
   ```env
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-secure-random-string
   PORT=3333
   ```

4. **构建并启动**
   ```bash
   docker-compose up -d --build
   ```

### 方式二：使用 1Panel 编排功能

1. 进入 1Panel 面板 → 容器 → 编排
2. 点击「创建编排」
3. 选择「Compose 模板」，粘贴以下内容：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fanstudio-app
    restart: unless-stopped
    ports:
      - "3333:3000"
    environment:
      - DATABASE_URL=mysql://fanstudio:fanstudio123@db:3306/fanstudio
      - NEXTAUTH_URL=https://your-domain.com
      - NEXTAUTH_SECRET=your-secret-key
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    networks:
      - fanstudio-network
    volumes:
      - uploads-data:/app/public/uploads

  db:
    image: mysql:8.0
    container_name: fanstudio-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=fanstudio
      - MYSQL_USER=fanstudio
      - MYSQL_PASSWORD=fanstudio123
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - fanstudio-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

networks:
  fanstudio-network:
    driver: bridge

volumes:
  mysql-data:
  uploads-data:
```

4. 设置工作目录为 `/opt/fanstudio`
5. 点击「创建」

---

## HTTPS 配置（使用 1Panel）

### 关于 HTTPS 端口

**不需要在 Docker 中新增端口！** HTTPS 由反向代理处理：

```
用户 → HTTPS (443) → 1Panel/Nginx → HTTP (3333) → Docker 容器
```

容器内部始终使用 HTTP 3000 端口，HTTPS 由外部代理处理。

### 配置步骤

1. **在 1Panel 中创建网站**
   - 进入 网站 → 创建网站
   - 选择「反向代理」类型
   - 主域名：`your-domain.com`
   - 代理地址：`http://127.0.0.1:3333`

2. **申请 SSL 证书**
   - 进入网站设置 → HTTPS
   - 点击「申请证书」
   - 选择 Let's Encrypt 免费证书
   - 或上传自有证书

3. **强制 HTTPS**
   - 在 HTTPS 设置中开启「强制 HTTPS」
   - HTTP 请求会自动跳转到 HTTPS

4. **更新环境变量**
   ```bash
   # 修改 .env 文件
   NEXTAUTH_URL=https://your-domain.com
   WXPAY_NOTIFY_URL=https://your-domain.com/api/wechat/notify
   ```

5. **重启容器**
   ```bash
   docker-compose restart app
   ```

### Nginx 配置示例（手动配置）

如果需要手动配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DATABASE_URL` | 数据库连接字符串 | - | 是 |
| `NEXTAUTH_URL` | 应用访问地址 | http://localhost:3333 | 是 |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | - | 是 |
| `PORT` | 应用端口 | 3333 | 否 |
| `DB_ROOT_PASSWORD` | MySQL root 密码 | root123 | 否 |
| `DB_PASSWORD` | 应用数据库密码 | fanstudio123 | 否 |

### 邮件服务（可选）

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=your-email@example.com
```

### 微信支付（可选）

```env
WXPAY_MCHID=your-mchid
WXPAY_SERIAL_NO=your-serial-no
WXPAY_PRIVATE_KEY_PATH=./apiclient_key.pem
WXPAY_PUBLIC_KEY_PATH=./apiclient_cert.pem
WXPAY_NOTIFY_URL=https://your-domain.com/api/wechat/notify
```

---

## 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f db
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启应用
docker-compose restart app
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 进入容器

```bash
# 进入应用容器
docker-compose exec app sh

# 进入数据库容器
docker-compose exec db bash
```

### 数据库操作

```bash
# 执行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 打开 Prisma Studio
docker-compose exec app npx prisma studio

# 运行种子数据
docker-compose exec app npx prisma db seed
```

---

## 数据备份

### 备份数据库

```bash
# 备份数据库
docker-compose exec db mysqldump -u root -p fanstudio > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T db mysql -u root -p fanstudio < backup.sql
```

### 备份上传文件

```bash
# 备份上传目录
docker cp fanstudio-app:/app/public/uploads ./uploads_backup
```

---

## 故障排除

### 应用无法启动

1. 检查日志：`docker-compose logs app`
2. 检查数据库连接：确保 DATABASE_URL 正确
3. 检查环境变量：确保 NEXTAUTH_SECRET 已设置

### 数据库连接失败

1. 等待数据库完全启动（约 30 秒）
2. 检查数据库日志：`docker-compose logs db`
3. 确认数据库容器健康：`docker-compose ps`

### 健康检查失败

```bash
# 手动检查健康状态
curl http://localhost:3333/api/health
```

### HTTPS 无法访问

1. 检查 SSL 证书是否正确安装
2. 检查 Nginx/1Panel 反向代理配置
3. 确保 NEXTAUTH_URL 使用 https://

### 重置部署

```bash
# 停止并删除所有容器和数据卷
docker-compose down -v

# 重新启动
docker-compose up -d
```

---

## 文件结构

```
fanstudio/
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 编排文件
├── .dockerignore           # Docker 构建忽略文件
├── .env.example            # 环境变量示例
├── scripts/
│   └── docker-entrypoint.sh  # 容器启动脚本
└── docs/
    └── DOCKER_DEPLOY.md    # 本文档
```

---

## 端口说明

| 端口 | 用途 | 说明 |
|------|------|------|
| 3333 | HTTP | 应用对外端口（可修改） |
| 3000 | HTTP | 容器内部端口（固定） |
| 443 | HTTPS | 由反向代理处理 |
| 3306 | MySQL | 数据库端口（仅内部） |
