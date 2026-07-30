# RagFlow — Railway 部署指南

## 架构概览

Railway 上部署 **3 个服务**：

| 服务 | 类型 | 说明 |
|------|------|------|
| `ragflow-backend` | GitHub 仓库（`apps/backend`） | NestJS API + 文件上传 |
| `ragflow-frontend` | GitHub 仓库（`apps/frontend`） | Next.js 前端 |
| `Postgres` | Railway 插件 | 托管 PostgreSQL 数据库 |

> n8n 和 Pinecone 保持外部服务不变（n8n 可单独部署在 Railway，Pinecone 使用云端）。

---

## 前置准备

- Railway 账号：[railway.app](https://railway.app)
- 已安装 Railway CLI（可选）：`npm install -g @railway/cli`
- 代码已推送到 GitHub 仓库
- 准备好以下 API Key：
  - OpenRouter API Key
  - Pinecone API Key
  - n8n Webhook URL（已部署的 n8n 实例地址）

---

## 部署步骤

### 第一步：创建 Railway 项目

1. 打开 [railway.app/new](https://railway.app/new)
2. 点击 **"Deploy from GitHub repo"**，选择你的 RagFlow 仓库
3. Railway 会自动识别项目，暂时先跳过自动部署配置

---

### 第二步：添加 PostgreSQL 数据库

1. 在项目 Dashboard 点击 **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 自动生成 `DATABASE_URL`，它会被自动注入到同项目的服务中
3. 记录下 `DATABASE_URL` 备用（在 Postgres 服务的 Variables 面板可以看到）

---

### 第三步：部署 Backend 服务

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择仓库
2. 在服务设置中找到 **"Source"** → **"Root Directory"**，填写：
   ```
   /
   ```
   （保持根目录，`apps/backend/nixpacks.toml` 会自动被 Railway 识别）

   > Railway 会从根目录读取 `apps/backend/nixpacks.toml`，因为 nixpacks.toml 指定了从根目录安装 workspace 依赖。

3. 在 **"Variables"** 面板添加以下环境变量：

   | 变量名 | 值 | 说明 |
   |--------|----|------|
   | `DATABASE_URL` | *(从 Postgres 插件复制)* | Railway 通常自动注入，若未注入则手动添加 |
   | `OPENROUTER_API_KEY` | `sk-or-...` | OpenRouter 密钥 |
   | `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | |
   | `PINECONE_API_KEY` | `pcsk_...` | Pinecone 密钥 |
   | `PINECONE_ENVIRONMENT` | `us-east-1` | 你的 Pinecone 区域 |
   | `PINECONE_INDEX_NAME` | `ragflow-docs` | |
   | `N8N_WEBHOOK_BASE_URL` | `https://your-n8n.railway.app/webhook` | n8n 实例地址 |
   | `FRONTEND_URL` | *(第四步部署后填写 Frontend URL)* | 允许 CORS 的前端域名 |
   | `NODE_ENV` | `production` | |

4. 在 **"Settings"** → **"Nixpacks Config"** 中确认 Config File Path 指向：
   ```
   apps/backend/nixpacks.toml
   ```

5. 点击 **"Deploy"**，等待构建完成
6. 部署成功后，在 **"Settings"** → **"Networking"** 生成公开域名，记录下来（形如 `ragflow-backend-xxx.railway.app`）

---

### 第四步：部署 Frontend 服务

1. 同样点击 **"+ New"** → **"GitHub Repo"** → 选择同一仓库
2. **Settings → Nixpacks Config File Path** 填写：
   ```
   apps/frontend/nixpacks.toml
   ```
3. 在 **"Variables"** 面板添加：

   | 变量名 | 值 | 说明 |
   |--------|----|------|
   | `NEXT_PUBLIC_API_URL` | `https://ragflow-backend-xxx.railway.app` | 第三步记录的 Backend URL |
   | `NODE_ENV` | `production` | |

   > `NEXT_PUBLIC_API_URL` 在构建时被打包进前端代码，**必须在构建前设置好**，修改后需要重新部署。

4. 点击 **"Deploy"**，等待构建完成
5. 生成前端域名，记录下来（形如 `ragflow-frontend-xxx.railway.app`）

---

### 第五步：回填 CORS 配置

1. 回到 **Backend 服务** 的 Variables 面板
2. 更新 `FRONTEND_URL` 为第四步的前端域名：
   ```
   FRONTEND_URL=https://ragflow-frontend-xxx.railway.app
   ```
3. Backend 会自动重新部署（因为 Variables 变更）

---

### 第六步：验证部署

访问以下地址确认服务正常：

```
# 检查 API 健康
https://ragflow-backend-xxx.railway.app/api/documents

# 打开前端
https://ragflow-frontend-xxx.railway.app
```

---

## 本地开发（不受影响）

本地环境使用 `.env` 文件，Railway 配置完全独立，互不影响。

```bash
# 启动本地 PostgreSQL + n8n
docker-compose up -d

# 启动开发服务器
npm run dev
```

本地 `.env` 示例参考 `.env.example`。

---

## 关键文件说明

```
apps/backend/
  nixpacks.toml   # Railway 构建配置（install → build → start）
  start.sh        # 启动脚本（先跑 prisma migrate deploy，再启动 node）

apps/frontend/
  nixpacks.toml   # Railway 构建配置

railway.json      # 项目级 Railway 配置（重启策略等）
.env.example      # 环境变量模板
```

---

## 常见问题

**Q: 构建时找不到 workspace packages**

确保 `apps/backend/nixpacks.toml` 的 install 命令从仓库根目录执行：
```toml
[phases.install]
cmds = [
  "npm install --workspace=packages/database --workspace=apps/backend --legacy-peer-deps"
]
```

**Q: Prisma migrate 失败**

检查 `DATABASE_URL` 是否正确注入。Railway 的 Postgres 插件会自动注入，但服务需要和 Postgres 在同一个项目中。

**Q: 前端请求 API 跨域失败**

确认 Backend 的 `FRONTEND_URL` 变量与前端实际域名完全一致（包含 `https://`，不带末尾斜杠）。

**Q: 上传的文件在重启后丢失**

Railway 文件系统是临时的，重启后 `uploads/` 目录会清空。生产环境建议将文件上传改为存储到 S3 / Cloudflare R2 / Supabase Storage。
