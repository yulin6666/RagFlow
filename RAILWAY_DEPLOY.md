# RagFlow — Railway 部署指南

## 架构概览

Railway 上部署 **3 个服务**：

| 服务 | 类型 | 说明 |
|------|------|------|
| `ragflow-backend` | GitHub 仓库 | NestJS API + 文件上传 |
| `ragflow-frontend` | GitHub 仓库 | Next.js 前端 |
| `Postgres` | Railway 插件 | 托管 PostgreSQL 数据库 |

**n8n** 已部署在 `https://n8n-production-fee8.up.railway.app`，无需重新创建。

> OPENROUTER_API_KEY、PINECONE_API_KEY 等 AI/向量数据库凭证均在 **n8n workflow 内部配置**，与本项目无关。Backend 只需要一个 n8n 相关变量：`N8N_WEBHOOK_BASE_URL`。

---

## 前置条件

- Railway 账号：[railway.app](https://railway.app)
- 代码已推送到 GitHub
- n8n workflow 已导入并激活（参考 `docs/n8n-workflows/`）

---

## 部署步骤

### 第一步：创建 Railway 项目

1. 打开 [railway.app/new](https://railway.app/new)
2. 点击 **"Deploy from GitHub repo"** → 选择 RagFlow 仓库
3. 先跳过自动部署提示

---

### 第二步：添加 PostgreSQL 数据库

1. 在项目 Dashboard 点击 **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 自动生成 `DATABASE_URL`，并注入到同项目的所有服务
3. 在 Postgres 服务的 Variables 面板复制 `DATABASE_URL` 备用

---

### 第三步：部署 Backend 服务

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择仓库
2. 进入服务 **Settings → Build**，在 **Custom Build Command** 填写：
   ```
   npm install --workspace=packages/database --workspace=apps/backend --legacy-peer-deps && cd packages/database && npx prisma generate && cd ../apps/backend && npm run build
   ```
3. 进入 **Settings → Deploy**，在 **Custom Start Command** 填写：
   ```
   cd packages/database && npx prisma migrate deploy && cd ../apps/backend && node dist/main
   ```
4. 在 **Variables** 面板添加以下环境变量：

   | 变量名 | 值 | 说明 |
   |--------|----|------|
   | `DATABASE_URL` | *(从 Postgres 插件复制)* | 通常自动注入，若没有则手动添加 |
   | `N8N_WEBHOOK_BASE_URL` | `https://n8n-production-fee8.up.railway.app/webhook` | 已有的 n8n 实例 |
   | `FRONTEND_URL` | *(第四步完成后填写)* | 前端域名，用于 CORS |
   | `NODE_ENV` | `production` | |

5. 点击 **"Deploy"**，等待构建完成
6. 进入 **Settings → Networking** 生成公开域名，记录下来，例如 `ragflow-backend-xxx.railway.app`

---

### 第四步：部署 Frontend 服务

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择同一个仓库
2. 进入服务 **Settings → Build**，在 **Custom Build Command** 填写：
   ```
   npm install --workspace=apps/frontend --legacy-peer-deps && cd apps/frontend && npm run build
   ```
3. 进入 **Settings → Deploy**，在 **Custom Start Command** 填写：
   ```
   cd apps/frontend && npm run start
   ```
4. 在 **Variables** 面板添加：

   | 变量名 | 值 | 说明 |
   |--------|----|------|
   | `NEXT_PUBLIC_API_URL` | `https://ragflow-backend-xxx.railway.app` | 第三步的 Backend 域名 |
   | `NODE_ENV` | `production` | |

   > `NEXT_PUBLIC_API_URL` 在构建时被打包进前端代码，**必须在首次构建前设置好**，修改后需重新部署。

5. 点击 **"Deploy"**，等待构建完成
6. 生成前端公开域名，记录下来，例如 `ragflow-frontend-xxx.railway.app`

---

### 第五步：回填 Backend 的 CORS 配置

1. 回到 **Backend 服务**的 Variables 面板
2. 将 `FRONTEND_URL` 更新为第四步的前端域名：
   ```
   FRONTEND_URL=https://ragflow-frontend-xxx.railway.app
   ```
3. Backend 会因变量变更自动重新部署

---

### 第六步：验证部署

```
# 检查 API 是否正常
https://ragflow-backend-xxx.railway.app/api/documents

# 打开前端
https://ragflow-frontend-xxx.railway.app
```

---

## 本地开发

本地使用 `.env` 文件，与 Railway 配置完全独立，互不影响。

```bash
# 启动本地 PostgreSQL + n8n
docker-compose up -d

# 启动开发服务器
npm run dev
```

环境变量参考 `.env.example`。

---

## 关键文件说明

构建命令直接在 Railway UI 的 **Custom Build Command / Custom Start Command** 里填写，无需配置文件。

```
railway.json      # 项目级 Railway 配置（重启策略等）
.env.example      # 环境变量模板
```

---

## 常见问题

**构建失败：找不到 workspace packages**

检查 `apps/backend/railway.json`，buildCommand 必须从仓库根目录执行安装：
```json
"buildCommand": "npm install --workspace=packages/database --workspace=apps/backend --legacy-peer-deps && ..."
```

**Prisma migrate 失败**

检查 `DATABASE_URL` 是否已注入。Postgres 插件只会自动注入到同一个 Railway 项目内的服务。

**前端请求 API 跨域报错**

确认 Backend 的 `FRONTEND_URL` 与前端实际域名完全一致（包含 `https://`，末尾不加斜杠）。

**上传的文件重启后消失**

Railway 文件系统是临时的，重启后 `uploads/` 会被清空。生产环境建议迁移至 S3 / Cloudflare R2 / Supabase Storage。
