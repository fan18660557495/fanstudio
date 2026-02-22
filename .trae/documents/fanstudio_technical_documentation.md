# FanStudio 项目技术文档

## 1. 项目概述

FanStudio 是一个面向设计师的开源个人网站项目，提供完整的前台展示和后台管理功能。

### 1.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.6 | 核心框架，处理页面渲染和路由 |
| React | 19.2.3 | 构建用户界面 |
| TypeScript | 5.x | 类型安全的JavaScript超集 |
| Tailwind CSS | 4.x | 实用优先的CSS框架 |
| Prisma | 6.19.2 | ORM工具，处理数据库操作 |
| MySQL | - | 关系型数据库 |
| NextAuth.js | 5.0.0-beta.30 | 认证系统 |
| BlockNote | 0.46.2 | 富文本编辑器 |
| Framer Motion | 12.31.0 | 动画库 |
| shadcn/ui | - | UI组件库 |

### 1.2 项目结构

```
fanstudio/
├── src/
│   ├── app/             # Next.js 13+ App Router
│   │   ├── (frontend)/  # 前台页面
│   │   ├── admin/       # 后台管理页面
│   │   ├── api/         # 后端API路由
│   ├── components/      # 通用组件
│   │   ├── admin/       # 后台专用组件
│   │   ├── frontend/    # 前台专用组件
│   │   ├── react-bits/  # 动效组件
│   │   ├── ui/          # 基础UI组件
│   ├── contexts/        # React Context
│   ├── hooks/           # 自定义Hooks
│   ├── lib/             # 工具函数和配置
│   ├── types/           # TypeScript类型定义
├── prisma/              # 数据库相关
│   ├── schema.prisma    # 数据库模型定义
│   ├── seed.ts          # 初始数据
│   ├── migrations/      # 数据库迁移文件
├── public/              # 静态资源
├── .env                 # 环境变量配置
├── package.json         # 项目依赖
├── next.config.ts       # Next.js配置
├── tsconfig.json        # TypeScript配置
```

## 2. 前端模块

### 2.1 前台模块

#### 2.1.1 首页 (`/src/app/(frontend)/page.tsx`)

- **功能**：全屏Hero区域，包含问候语动画、品牌名文字动效、头像和社交链接
- **组件**：
  - 自动展示最新的设计作品、开发作品、文章和视频教程
  - 每个区块包含「查看全部」链接
- **修改指南**：
  - Hero区域文案：在后台「网站设置 → 导航与页面 → 首页」中修改
  - 展示内容：通过后台管理对应内容模块

#### 2.1.2 设计作品集 (`/src/app/(frontend)/works/design/page.tsx`)

- **功能**：瀑布流卡片布局展示设计作品
- **组件**：
  - 支持分类筛选和标签
  - 详情页展示完整描述、多张展示图、Figma在线预览
- **修改指南**：
  - 在后台「设计作品管理」中添加、编辑、删除作品
  - 分类和标签在后台「分类与标签」中管理

#### 2.1.3 开发作品集 (`/src/app/(frontend)/works/development/page.tsx`)

- **功能**：与设计作品集结构相同，独立页面
- **用途**：适合展示GitHub项目、工具插件等技术类作品
- **修改指南**：
  - 在后台「开发作品管理」中添加、编辑、删除作品

#### 2.1.4 文章/笔记 (`/src/app/(frontend)/blog/page.tsx`)

- **功能**：瀑布流卡片展示所有文章
- **组件**：
  - 支持分类筛选
  - 详情页展示富文本正文、封面图、发布日期、作者信息
- **修改指南**：
  - 在后台「文章管理」中添加、编辑、删除文章
  - 使用富文本编辑器编写文章内容

#### 2.1.5 视频教程 (`/src/app/(frontend)/tutorials/page.tsx`)

- **功能**：瀑布流卡片展示视频教程
- **行为**：点击直接跳转到B站/YouTube等外链平台观看
- **修改指南**：
  - 在后台「视频教程管理」中添加、编辑、删除教程
  - 填写视频链接和缩略图

#### 2.1.6 关于页 (`/src/app/(frontend)/about/page.tsx`)

- **功能**：展示个人信息和背景
- **组件**：
  - 左侧个人信息卡片（头像、品牌名、姓名、职位标签）
  - 右侧个人介绍、工作经历、学习经历、技能标签
- **修改指南**：
  - 在后台「网站设置 → 关于我/头像」中填写所有内容

### 2.2 后台模块

#### 2.2.1 登录页面 (`/src/app/admin/login/page.tsx`)

- **功能**：管理员登录
- **验证**：使用NextAuth.js处理认证
- **修改指南**：
  - 登录逻辑在 `/src/lib/auth.ts` 中定义
  - 默认账号在 `prisma/seed.ts` 中设置

#### 2.2.2 仪表盘 (`/src/app/admin/(dashboard)/page.tsx`)

- **功能**：数据概览和快速访问
- **组件**：
  - 数据概览卡片：文章数、设计作品数、开发作品数、教程数、赞助总数、本月收入
  - 最近5笔赞助记录
  - 近30天收入趋势折线图
- **修改指南**：
  - 数据统计逻辑在 `/src/app/admin/(dashboard)/page.tsx` 中实现

#### 2.2.3 文章管理 (`/src/app/admin/(dashboard)/posts/`)

- **功能**：管理所有文章
- **操作**：
  - 列表页支持搜索、分类筛选、排序
  - 新建或编辑文章时使用富文本编辑器
  - 支持图片上传、标题、列表、代码块等格式
  - 每篇文章可设为草稿或发布状态
- **修改指南**：
  - 文章编辑器使用BlockNote，配置在 `/src/components/admin/BlockNoteEditor.tsx`

#### 2.2.4 设计作品管理 (`/src/app/admin/(dashboard)/works/design/page.tsx`)

- **功能**：管理所有设计作品
- **操作**：
  - 上传封面和多张展示图
  - 设置价格（也可设为免费或开源）
  - 关联Figma链接（前台自动嵌入在线预览）
  - 填写下载交付链接
  - 支持分类和标签
- **修改指南**：
  - 作品编辑页面在 `/src/app/admin/(dashboard)/works/[id]/edit/page.tsx`

#### 2.2.5 开发作品管理 (`/src/app/admin/(dashboard)/works/development/page.tsx`)

- **功能**：与设计作品管理结构相同
- **用途**：独立管理开发类作品

#### 2.2.6 视频教程管理 (`/src/app/admin/(dashboard)/tutorials/`)

- **功能**：管理所有视频教程
- **操作**：
  - 填入视频链接（B站/YouTube等）
  - 上传或填写缩略图
  - 设置排序顺序

#### 2.2.7 分类与标签管理 (`/src/app/admin/(dashboard)/categories/page.tsx`)

- **功能**：统一管理所有内容的分类和标签
- **管理对象**：文章、作品、教程

#### 2.2.8 赞助管理 (`/src/app/admin/(dashboard)/orders/page.tsx`)

- **功能**：查看所有作品赞助记录
- **操作**：
  - 按状态筛选（待支付/已支付/已取消/已返还）
  - 支持批量操作
  - 手动执行返还操作

#### 2.2.9 网站设置 (`/src/app/admin/(dashboard)/settings/page.tsx`)

- **功能**：配置网站的所有可自定义内容
- **Tab面板**：
  - **基本设置**：网站名称、网站描述（SEO）、页脚版权信息、社交链接
  - **导航与页面**：各页导航名称、首页Hero文案、各页页头介绍、模块固定封面比例
  - **关于我/头像**：头像上传、品牌名、姓名、职位、个人介绍、工作经历、学习经历、技能
  - **外观主题**：基底灰度（5选1）、强调色（9选1），实时预览

## 3. 后端模块

### 3.1 API路由

#### 3.1.1 认证API (`/src/app/api/auth/[...nextauth]/route.ts`)

- **功能**：处理用户登录、注销、会话管理
- **实现**：使用NextAuth.js，支持邮箱密码认证
- **修改指南**：
  - 认证逻辑在 `/src/lib/auth.ts` 中定义
  - 可添加其他认证提供商（如GitHub、Google等）

#### 3.1.2 文章API (`/src/app/api/posts/`)

- **端点**：
  - `GET /api/posts` - 获取文章列表
  - `POST /api/posts` - 创建新文章
  - `GET /api/posts/[id]` - 获取单篇文章
  - `PUT /api/posts/[id]` - 更新文章
  - `DELETE /api/posts/[id]` - 删除文章
  - `POST /api/posts/batch` - 批量操作
- **修改指南**：
  - 文章相关操作逻辑在对应API路由文件中

#### 3.1.3 作品API (`/src/app/api/works/`)

- **端点**：
  - `GET /api/works` - 获取作品列表
  - `POST /api/works` - 创建新作品
  - `GET /api/works/[id]` - 获取单个作品
  - `PUT /api/works/[id]` - 更新作品
  - `DELETE /api/works/[id]` - 删除作品
  - `POST /api/works/batch` - 批量操作
  - `GET /api/works/[id]/versions` - 获取作品版本
- **修改指南**：
  - 作品相关操作逻辑在对应API路由文件中

#### 3.1.4 视频教程API (`/src/app/api/tutorials/`)

- **端点**：
  - `GET /api/tutorials` - 获取教程列表
  - `POST /api/tutorials` - 创建新教程
  - `GET /api/tutorials/[id]` - 获取单个教程
  - `PUT /api/tutorials/[id]` - 更新教程
  - `DELETE /api/tutorials/[id]` - 删除教程
  - `POST /api/tutorials/batch` - 批量操作

#### 3.1.5 分类API (`/src/app/api/categories/`)

- **端点**：
  - `GET /api/categories` - 获取分类列表
  - `POST /api/categories` - 创建新分类
  - `GET /api/categories/[id]` - 获取单个分类
  - `PUT /api/categories/[id]` - 更新分类
  - `DELETE /api/categories/[id]` - 删除分类
  - `POST /api/categories/batch` - 批量操作

#### 3.1.6 标签API (`/src/app/api/tags/`)

- **端点**：
  - `GET /api/tags` - 获取标签列表
  - `POST /api/tags` - 创建新标签
  - `GET /api/tags/[id]` - 获取单个标签
  - `PUT /api/tags/[id]` - 更新标签
  - `DELETE /api/tags/[id]` - 删除标签
  - `POST /api/tags/batch` - 批量操作

#### 3.1.7 订单API (`/src/app/api/orders/`)

- **端点**：
  - `GET /api/orders` - 获取订单列表
  - `GET /api/orders/[id]` - 获取单个订单
  - `PUT /api/orders/[id]` - 更新订单状态
  - `POST /api/orders/batch` - 批量操作
  - `POST /api/orders/check` - 检查订单状态
  - `POST /api/orders/simulate-pay` - 模拟支付（测试用）

#### 3.1.8 设置API (`/src/app/api/settings/route.ts`)

- **端点**：
  - `GET /api/settings` - 获取网站设置
  - `PUT /api/settings` - 更新网站设置
- **修改指南**：
  - 设置数据结构在 `/src/lib/settings-db.ts` 中定义

#### 3.1.9 媒体API (`/src/app/api/media/route.ts`)

- **功能**：处理图片上传
- **实现**：使用Uppy组件处理文件上传
- **修改指南**：
  - 上传配置在 `/src/lib/media-storage.ts` 中定义

### 3.2 数据库模型

#### 3.2.1 用户模型 (`User`)

- **字段**：id, email, password, role, name, avatar, bio, createdAt, updatedAt
- **关系**：关联文章和作品
- **修改指南**：
  - 在 `prisma/schema.prisma` 中修改模型定义
  - 运行 `npx prisma migrate dev` 应用更改

#### 3.2.2 文章模型 (`Post`)

- **字段**：id, title, slug, content, excerpt, coverImage, coverRatio, status, categoryId, authorId, sortOrder, createdAt, updatedAt, publishedAt
- **关系**：关联用户、分类、标签
- **修改指南**：
  - 在 `prisma/schema.prisma` 中修改模型定义

#### 3.2.3 作品模型 (`Work`)

- **字段**：id, title, slug, workType, description, content, coverImage, coverRatio, images, currentVersion, price, isFree, figmaUrl, deliveryUrl, fileUrl, fileName, demoUrl, demoQrCode, status, categoryId, authorId, sortOrder, createdAt, updatedAt
- **关系**：关联用户、分类、标签、订单、版本
- **修改指南**：
  - 在 `prisma/schema.prisma` 中修改模型定义

#### 3.2.4 订单模型 (`Order`)

- **字段**：id, orderNo, workId, versionId, upgradeFromId, amount, status, buyerEmail, buyerName, paymentId, paidAt, downloadToken, downloadCount, createdAt, updatedAt
- **关系**：关联作品和版本
- **修改指南**：
  - 在 `prisma/schema.prisma` 中修改模型定义

#### 3.2.5 网站设置模型 (`Settings`)

- **字段**：id, siteName, avatar, socialLinks, about, nav, pageCopy, theme, footer, updatedAt
- **特点**：单例模型，id固定为"settings"
- **修改指南**：
  - 在 `prisma/schema.prisma` 中修改模型定义

## 4. 核心功能模块

### 4.1 主题系统

- **功能**：支持9种强调色和5种灰度基调
- **实现**：
  - 主题配置在 `/src/lib/theme-presets.ts` 中定义
  - 主题切换在 `/src/components/ThemeColorProvider.tsx` 中实现
- **修改指南**：
  - 在后台「网站设置 → 外观主题」中选择主题
  - 如需添加自定义主题，修改 `theme-presets.ts` 文件

### 4.2 作品赞助系统

- **功能**：设计作品支持设置赞助金额
- **流程**：
  1. 用户浏览作品详情页
  2. 输入邮箱后扫码支付
  3. 赞助成功后自动发送下载/Figma链接到邮箱
- **修改指南**：
  - 在作品编辑页面设置价格和交付链接
  - 邮件模板在 `/src/lib/email.ts` 中定义

### 4.3 富文本编辑器

- **功能**：后台文章和作品描述使用富文本编辑器
- **实现**：使用BlockNote编辑器
- **修改指南**：
  - 编辑器配置在 `/src/components/admin/BlockNoteEditor.tsx` 中定义

### 4.4 响应式设计

- **功能**：自适应手机、平板、电脑
- **实现**：使用Tailwind CSS的响应式类
- **修改指南**：
  - 在组件中使用Tailwind的响应式断点
  - 例如：`md:flex md:items-center`

### 4.5 暗黑模式

- **功能**：自动切换亮色/暗色主题
- **实现**：使用next-themes库
- **修改指南**：
  - 主题切换逻辑在 `/src/components/theme-provider.tsx` 中定义

## 5. 配置和部署

### 5.1 环境变量

- **文件**：`.env`
- **主要配置**：
  - `DATABASE_URL` - 数据库连接字符串
  - `NEXTAUTH_URL` - 认证回调URL
  - `NEXTAUTH_SECRET` - 认证密钥
  - 邮件配置（可选）
  - 微信支付配置（可选）
- **修改指南**：
  - 复制 `.env.example` 为 `.env`
  - 根据实际环境修改配置值

### 5.2 本地开发

- **命令**：
  - `npm run dev` - 启动开发服务器
  - `npm run build` - 构建生产版本
  - `npm run start` - 启动生产服务器
- **开发流程**：
  1. 安装依赖：`npm install`
  2. 配置环境变量：`.env`
  3. 初始化数据库：`npx prisma migrate deploy`
  4. 写入初始数据：`npm run db:seed`
  5. 启动开发服务器：`npm run dev`

### 5.3 数据库迁移

- **命令**：
  - `npx prisma migrate dev` - 创建新迁移并应用
  - `npx prisma migrate deploy` - 部署迁移到生产环境
  - `npx prisma generate` - 生成Prisma Client
- **修改指南**：
  - 修改 `prisma/schema.prisma` 后运行迁移命令

## 6. 自定义修改指南

### 6.1 修改网站内容

#### 6.1.1 修改基本信息

- **网站名称、描述**：后台「网站设置 → 基本设置」
- **头像**：后台「网站设置 → 关于我/头像」
- **社交链接**：后台「网站设置 → 基本设置 → 社交链接」

#### 6.1.2 修改导航和页面文案

- **导航名称**：后台「网站设置 → 导航与页面」
- **页面介绍文案**：后台「网站设置 → 导航与页面」对应页面
- **首页Hero文案**：后台「网站设置 → 导航与页面 → 首页」

#### 6.1.3 修改关于页内容

- **个人信息**：后台「网站设置 → 关于我/头像」
- **工作经历**：后台「网站设置 → 关于我/头像 → 关于我」
- **学习经历**：后台「网站设置 → 关于我/头像 → 关于我」
- **技能**：后台「网站设置 → 关于我/头像 → 关于我」

### 6.2 修改外观

#### 6.2.1 修改主题

- **基底灰度**：后台「网站设置 → 外观主题 → 基底灰度」
- **强调色**：后台「网站设置 → 外观主题 → 强调色」

#### 6.2.2 修改封面比例

- **设置位置**：后台「网站设置 → 导航与页面」对应模块
- **支持比例**：3:4、4:3、16:9、1:1、19:6

### 6.3 修改功能

#### 6.3.1 添加新页面

- **步骤**：
  1. 在 `src/app/(frontend)/` 目录下创建新文件夹
  2. 创建 `page.tsx` 文件
  3. 在 `src/app/(frontend)/layout.tsx` 中添加导航链接

#### 6.3.2 添加新组件

- **步骤**：
  1. 在 `src/components/frontend/` 或 `src/components/admin/` 目录下创建新文件
  2. 实现组件逻辑
  3. 在需要的页面中导入使用

#### 6.3.3 修改API

- **步骤**：
  1. 在 `src/app/api/` 目录下找到对应API文件
  2. 修改API逻辑
  3. 确保类型定义同步更新

#### 6.3.4 修改数据库模型

- **步骤**：
  1. 在 `prisma/schema.prisma` 中修改模型定义
  2. 运行 `npx prisma migrate dev --name descriptive-migration-name`
  3. 运行 `npx prisma generate` 更新Prisma Client

## 7. 最佳实践

### 7.1 代码规范

- **TypeScript**：使用强类型，避免 `any` 类型
- **Tailwind CSS**：使用语义化类名，避免内联样式
- **组件设计**：遵循单一职责原则，组件功能要明确
- **命名规范**：使用驼峰命名法，文件名与组件名保持一致

### 7.2 性能优化

- **图片优化**：使用适当大小的图片，考虑使用WebP格式
- **代码分割**：使用Next.js的自动代码分割
- **缓存策略**：合理使用React.memo、useMemo等缓存机制
- **数据库查询**：使用Prisma的批量查询和预加载功能

### 7.3 安全性

- **密码存储**：使用bcryptjs加密存储密码
- **API保护**：使用NextAuth的session验证保护敏感API
- **输入验证**：使用zod进行数据验证
- **文件上传**：限制上传文件类型和大小

### 7.4 部署建议

- **生产环境**：使用Vercel、Netlify等平台部署
- **数据库**：使用MySQL托管服务（如Amazon RDS、PlanetScale）
- **环境变量**：使用平台提供的环境变量管理功能
- **备份**：定期备份数据库

## 8. 故障排除

### 8.1 常见问题

#### 8.1.1 数据库连接失败

- **原因**：MySQL服务未运行或连接字符串错误
- **解决**：
  - 检查MySQL服务是否启动
  - 验证 `.env` 文件中的 `DATABASE_URL` 是否正确

#### 8.1.2 后台登录失败

- **原因**：账号密码错误或数据库初始化失败
- **解决**：
  - 确认默认账号密码：admin@example.com / admin123
  - 重新运行 `npm run db:seed` 初始化数据

#### 8.1.3 图片上传失败

- **原因**：上传路径权限不足或配置错误
- **解决**：
  - 检查 `public` 目录权限
  - 验证 `src/lib/media-storage.ts` 中的配置

#### 8.1.4 网站速度慢

- **原因**：图片过大、代码未优化、数据库查询效率低
- **解决**：
  - 优化图片大小和格式
  - 使用Next.js的图片组件
  - 优化数据库查询，添加适当索引

## 9. 总结

FanStudio 是一个功能完整、架构清晰的设计师个人网站项目。通过本技术文档，您可以了解项目的整体结构、前端和后端模块的实现细节，以及如何自定义修改网站内容。

### 9.1 核心优势

- **完整的前后台功能**：前台展示+后台管理一体化
- **易于自定义**：通过后台即可修改大部分内容
- **技术栈现代化**：使用Next.js 16、React 19等最新技术
- **响应式设计**：自适应各种设备
- **主题定制**：支持多种颜色方案

### 9.2 后续发展建议

- **添加更多社交平台集成**：如Instagram、Dribbble等
- **实现多语言支持**：添加国际化功能
- **增强SEO优化**：添加sitemap、robots.txt等
- **集成更多支付方式**：如支付宝、PayPal等
- **添加评论系统**：允许访客对文章和作品评论

通过本技术文档的指导，您可以轻松地理解和修改FanStudio项目，打造属于自己的个性化设计师网站。