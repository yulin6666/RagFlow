# RagFlow — Railway 部署指南

## 架构概览

Railway 上部署 **3 个服务**：

| 服务 | 类型 | 说明 |
|------|------|------|
| `ragflow-backend` | GitHub 仓库 | NestJS API + 文件上传 |
| `ragflow-frontend` | GitHub 仓库 | Next.js 前端 |
| `Postgres` | Railway 插件 | 托管 PostgreSQL 数据库 |

**n8n** 已部署在 `https://n8n-production-fee8.up.railway.app`，需要导入 workflow 并配置凭证后才能使用。

> OPENROUTER_API_KEY、PINECONE_API_KEY 等凭证均在 **n8n 内部配置**，不需要写入 Backend 环境变量。

---

## 前置条件

- Railway 账号：[railway.app](https://railway.app)
- 代码已推送到 GitHub
- 准备好以下 API Key：
  - [OpenRouter](https://openrouter.ai) API Key（用于 LLM 对话）
  - [OpenAI](https://platform.openai.com) API Key（用于向量 Embedding）
  - [Pinecone](https://app.pinecone.io) API Key + Index（用于向量存储）

---

## 部署步骤

### 第一步：创建 Railway 项目

1. 打开 [railway.app/new](https://railway.app/new)
2. 点击 **"Deploy from GitHub repo"** → 选择 RagFlow 仓库
3. 先跳过自动部署提示

---

### 第二步：添加 PostgreSQL 数据库

1. 在项目 Dashboard 点击 **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 自动生成两个连接串，在 Postgres 服务的 **Variables** 面板可以看到：
   - `DATABASE_URL` — **内网地址**，仅同项目的 Backend 服务使用
   - `DATABASE_PUBLIC_URL` — **公网地址**，n8n（不同项目）使用这个
3. 分别复制两个值备用

---

### 第三步：配置 n8n Workflow

打开 [https://n8n-production-fee8.up.railway.app](https://n8n-production-fee8.up.railway.app)，完成以下操作：

#### 3.1 配置凭证（Credentials）

进入 **Settings → Credentials → Add Credential**，依次添加：

| 凭证名称 | 类型 | 填写内容 |
|----------|------|----------|
| OpenRouter | `OpenAI API` | Base URL: `https://openrouter.ai/api/v1`，API Key: 你的 OpenRouter Key |
| OpenAI Embeddings | `OpenAI API` | API Key: 你的 OpenAI Key（用于 text-embedding-3-small） |
| Pinecone | `Pinecone API` | API Key: 你的 Pinecone Key |
| PostgreSQL | `Postgres` | 填入第二步的数据库连接信息 |

#### 3.2 导入三个 Workflow

依次导入 `docs/n8n-workflows/` 目录下的三个文件：

1. **Workflows → Import from File**
   - `pdf-processing-workflow.json` — PDF 上传后的向量化处理
   - `rag-query-workflow.json` — 用户问答检索
   - `extraction-workflow.json` — 字段结构化提取

#### 3.3 绑定凭证

每个导入的 workflow 里，点击用到外部服务的节点，将凭证下拉框选为上面创建的对应凭证：
- Pinecone 节点 → 选 Pinecone 凭证
- Embeddings OpenAI 节点 → 选 OpenAI Embeddings 凭证
- OpenRouter Chat Model 节点 → 选 OpenRouter 凭证
- Postgres Chat Memory / Update DB Status 节点 → 选 PostgreSQL 凭证

#### 3.4 激活 Workflow

三个 workflow 右上角都切换为 **Active**（绿色），记录每个 workflow 的 Webhook URL，格式为：
```
https://n8n-production-fee8.up.railway.app/webhook/xxx
```

> Webhook 路径会在 Backend 的 `N8N_WEBHOOK_BASE_URL` 变量中使用，路径固定为：
> - `/webhook/process-pdf`
> - `/webhook/rag-query`
> - `/webhook/extract`

---

### 第三步：部署 Backend 服务

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择仓库
2. 进入服务 **Settings → Build**，在 **Custom Build Command** 填写：
   ```
   npm install --workspace=packages/database --workspace=apps/backend --legacy-peer-deps && npm --workspace=packages/database run db:generate && npm --workspace=apps/backend run build
   ```
3. 进入 **Settings → Deploy**，在 **Custom Start Command** 填写：
   ```
   npm --workspace=packages/database run db:migrate:deploy && node apps/backend/dist/main
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
