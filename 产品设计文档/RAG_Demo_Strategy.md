# RAG Demo 产品设计文档

## 一、需求分析总结

### Upwork需求共性分析

**需求1 - 个人助理系统**
- 核心：持久化记忆 + 邮件管理
- 业务场景：药店、房产管理、养老院多业务管理
- 技术要求：GPT-4/4o + LangChain + 向量数据库 + Gmail API
- 预算：$5,000-$15,000

**需求2 - 汽车营销代理系统**
- 核心：自动化潜客生成 + 销售流程自动化
- 业务场景：数字营销代理公司，CRM集成（Zoho）
- 技术要求：Agent框架（LangChain/CrewAI） + CRM集成
- 强调：不是简单的无代码工具拼接，需要真正的Agent系统

**需求3 - 工程咨询公司运营自动化**
- 核心：10个AI Agent生态系统（邮件、提案、QuickBooks、排程等）
- 业务场景：工程检查公司，高度自动化的业务流程
- 技术要求：LangGraph/CrewAI + QuickBooks API + PDF自动化
- 规模：招聘5人，长期项目

### 三个需求的核心交集

1. **持久化记忆系统** - 所有需求都需要长期上下文管理
2. **文档理解与智能检索** - 提案、报告、表单自动化
3. **业务流程自动化** - CRM/会计系统集成
4. **AI辅助决策** - 基于知识库的智能推荐
5. **可扩展架构** - 易于集成到现有业务系统

---

## 二、推荐Demo方向：**智能文档知识库 RAG 系统**

### 为什么选这个方向？

1. **技术复杂度适中**：展示核心RAG能力，无需复杂的邮件/CRM集成
2. **可演示性强**：PDF上传 → 智能问答，效果直观易懂
3. **通用性强**：适用于所有需要文档处理的场景（合同、手册、知识库）
4. **可扩展性好**：后续可扩展为邮件处理、提案生成等复杂场景
5. **参考成熟架构**：基于CargoFlow项目的技术栈，快速实现

---

## 三、Demo核心功能设计（基于CargoFlow架构简化版）

### 3.1 系统架构

```
用户界面（Next.js Frontend）
    ↓
    ├── PDF文档上传
    └── 智能问答界面
    ↓
NestJS Backend API
    ├── POST /documents/upload    # 上传PDF并处理
    ├── POST /chat/query          # RAG智能问答
    ├── GET /documents            # 文档列表
    └── DELETE /documents/:id     # 删除文档
    ↓
n8n 自动化工作流
    ↓
    ├── Workflow 1: PDF处理流程（10节点）
    │   → 接收PDF → 提取文本 → 分块 → 生成Embedding → 存入向量库
    │
    └── Workflow 2: RAG问答流程（12节点）
        → 接收问题 → 生成Embedding → 向量检索 → 重排序 → LLM生成答案
    ↓
数据存储层
    ├── PostgreSQL（文档元数据、聊天记录）
    └── Pinecone（向量数据库，文档chunks）
```

### 3.2 核心功能模块

#### A. PDF文档处理管道
```
上传PDF文件
  → n8n Webhook触发
  → PDF解析（使用pdf-parse或Unstructured.io）
  → 文本分块（500-1000字符/chunk，带重叠）
  → Embedding生成（OpenAI text-embedding-3-small）
  → 存入Pinecone（附带metadata: 文件名、页码、上传时间）
  → 更新PostgreSQL（文档状态：processing → ready）
  → 返回处理结果
```

#### B. RAG智能问答
```
用户提问
  → n8n Webhook触发
  → 问题Embedding生成
  → Pinecone向量检索（top-k=5，相似度阈值0.7）
  → 上下文组装（检索结果 + 问题）
  → LLM生成答案（OpenAI GPT-4o-mini，成本优化）
  → 引用来源标注（文件名 + 页码）
  → 保存对话历史到PostgreSQL
  → 返回答案 + 来源引用
```

#### C. 文档管理
- 上传PDF并查看处理状态
- 文档列表展示（文件名、大小、上传时间、chunk数量）
- 删除文档（同步删除向量数据）
- 聊天历史记录

### 3.3 Demo场景演示流程

#### 场景1：上传企业手册并问答
```
步骤：
1. 用户上传"员工手册.pdf"（20页）
2. 系统自动处理：
   - 提取文本内容
   - 分割为40个chunks
   - 生成embeddings并存入Pinecone
   - 显示"处理完成，已索引40个文本块"

3. 用户提问："请假流程是什么？"
4. 系统返回：
   "根据员工手册第12页，请假流程如下：
   1. 提前3天提交请假申请表
   2. 经理审批
   3. HR备案

   来源：员工手册.pdf - 第12页"
```

#### 场景2：多文档跨文件检索
```
步骤：
1. 用户上传多个文档：
   - "产品规格说明.pdf"
   - "技术实现方案.pdf"
   - "项目时间表.pdf"

2. 用户提问："项目的主要技术栈是什么？预计什么时候完成？"
3. 系统返回：
   "根据技术实现方案，主要技术栈包括：
   - 前端：React + Next.js
   - 后端：NestJS + PostgreSQL
   - 自动化：n8n

   根据项目时间表，预计2026年9月15日完成MVP版本。

   来源：
   - 技术实现方案.pdf - 第3页
   - 项目时间表.pdf - 第1页"
```

#### 场景3：展示RAG检索过程（技术亮点）
```
在管理界面展示：
1. 向量检索结果（相似度分数）
2. 检索到的文本块内容
3. LLM生成过程（可选streaming输出）
4. 引用来源追溯

技术透明度展示：
- "检索到5个相关文本块，平均相似度0.82"
- "使用上下文长度：1,200 tokens"
- "LLM响应时间：2.3秒"
```

---

## 四、技术栈选型（参考CargoFlow架构）

### 4.1 前端层
- **框架**: Next.js 14（App Router）
- **UI组件**: TailwindCSS + Shadcn/ui
- **状态管理**: React Hooks
- **功能**:
  - PDF拖拽上传组件
  - 聊天界面（类ChatGPT）
  - 文档列表管理
  - 处理进度实时显示

### 4.2 后端层
- **框架**: NestJS（TypeScript）
- **API端点**:
  - `POST /api/documents/upload` - 上传PDF
  - `GET /api/documents` - 获取文档列表
  - `DELETE /api/documents/:id` - 删除文档
  - `POST /api/chat/query` - RAG问答
  - `GET /api/chat/history/:documentId` - 聊天历史
- **职责**: API网关，请求转发给n8n处理，返回结果

### 4.3 自动化层（核心）
- **平台**: n8n（开源自动化平台）
- **工作流**:

#### Workflow 1: PDF处理流程（约10个节点）
```
Webhook Trigger (接收Backend请求)
  → HTTP Request (下载PDF文件)
  → Code Node (PDF解析，使用pdf-parse库)
  → Code Node (文本分块，RecursiveCharacterTextSplitter逻辑)
  → Loop Node (遍历每个chunk)
      → HTTP Request (OpenAI Embeddings API)
      → HTTP Request (Pinecone Upsert)
  → PostgreSQL (更新文档状态为ready)
  → Respond to Webhook (返回成功)
```

#### Workflow 2: RAG问答流程（约12个节点）
```
Webhook Trigger (接收用户问题)
  → PostgreSQL (查询文档信息)
  → Code Node (问题预处理)
  → HTTP Request (OpenAI Embeddings API - 问题向量化)
  → HTTP Request (Pinecone Query - 检索top-k相关chunks)
  → Code Node (组装上下文，构建prompt)
  → HTTP Request (OpenAI Chat API - 生成答案)
  → Code Node (解析答案，提取引用)
  → PostgreSQL (保存聊天记录)
  → Respond to Webhook (返回答案 + 来源)
```

### 4.4 数据存储层
- **关系数据库**: PostgreSQL
  - 表结构:
    ```sql
    documents (
      id, filename, file_size, file_url, status,
      chunk_count, upload_time, processed_time
    )

    chat_history (
      id, document_id, user_question, ai_answer,
      sources, created_at
    )

    document_chunks (
      id, document_id, chunk_index, content,
      page_number, embedding_id
    )
    ```

- **向量数据库**: Pinecone（免费tier 1GB，约100万条）
  - Index配置: dimension=1536（OpenAI embedding维度）
  - Metadata: `{document_id, chunk_index, page_number, filename}`

### 4.5 LLM与Embedding
- **Embedding模型**: `text-embedding-3-small`（$0.02/1M tokens，成本优化）
- **LLM模型**: `gpt-4o-mini`（$0.15/1M tokens，性价比高）
- **备选**: OpenRouter（接入Qwen/Llama等开源模型，进一步降成本）

### 4.6 部署方案
- **开发环境**:
  - Frontend: localhost:3000
  - Backend: localhost:3001
  - n8n: localhost:5678
  - PostgreSQL: Docker容器

- **生产环境**: Railway（参考CargoFlow部署方式）
  - 3个服务：Frontend, Backend, n8n
  - 1个PostgreSQL数据库
  - 环境变量统一管理

---

## 五、实现路线图

### MVP阶段（1-2周，核心演示）

**Week 1: 基础架构搭建**
- [ ] 项目初始化（参考CargoFlow monorepo结构）
  - apps/frontend (Next.js)
  - apps/backend (NestJS)
  - packages/database (Prisma schema)
- [ ] PostgreSQL + Prisma配置
- [ ] Pinecone账号注册与Index创建
- [ ] n8n本地搭建（Docker）
- [ ] 基础API端点（文档上传、列表查询）

**Week 2: 核心RAG功能**
- [ ] n8n Workflow 1: PDF处理流程
  - PDF文本提取
  - 文本分块逻辑
  - OpenAI Embedding调用
  - Pinecone数据写入
- [ ] n8n Workflow 2: RAG问答流程
  - 向量检索
  - 上下文组装
  - LLM生成答案
  - 来源引用标注
- [ ] 前端UI开发
  - 文档上传页面
  - 聊天问答界面
  - 文档列表管理
- [ ] 端到端测试（上传PDF → 问答）

**可演示能力**：
- 上传PDF并自动索引
- 基于文档内容的智能问答
- 答案来源追溯（文件名 + 页码）
- 简洁的Web界面

### 完整版（3-4周，生产就绪）

**Week 3: 高级功能**
- [ ] 多文档跨文件检索
- [ ] 聊天历史管理
- [ ] 向量检索可视化（展示相似度分数）
- [ ] Streaming响应（实时输出答案）
- [ ] 文档处理进度条
- [ ] 错误重试机制

**Week 4: 优化与部署**
- [ ] 性能优化（Embedding批量处理）
- [ ] 成本优化（使用text-embedding-3-small）
- [ ] 部署到Railway（3个服务 + PostgreSQL）
- [ ] 环境变量配置
- [ ] API文档（Swagger）
- [ ] Demo录屏视频（5-10分钟）
- [ ] GitHub README完善

---

## 六、与Upwork需求的对应关系

### 6.1 技术能力展示

| Upwork需求点 | Demo中的体现 |
|-------------|-------------|
| **持久化记忆系统** | Pinecone向量库 + PostgreSQL聊天历史 |
| **文档理解能力** | PDF解析 + 智能分块 + Embedding |
| **RAG检索** | 向量相似度搜索 + 上下文增强生成 |
| **n8n自动化** | 2个生产级工作流，展示复杂编排能力 |
| **LLM集成** | OpenAI API + prompt工程 |
| **全栈开发** | NestJS后端 + Next.js前端 + PostgreSQL |
| **API集成经验** | OpenAI/Pinecone API调用与错误处理 |
| **数据库设计** | Prisma ORM + 关系型 + 向量数据库混合架构 |

### 6.2 应对三个需求的话术

**对需求1（个人助理）**：
> "我的RAG系统展示了持久化记忆的核心能力。目前demo处理PDF文档，同样的架构可以扩展到邮件处理：将邮件内容向量化存储，实现'上个月关于招聘的讨论'这类时序查询。我的n8n工作流可以轻松集成Gmail API，实现您需要的邮件自动分类和智能回复。"

**对需求2（营销代理）**：
> "这个项目展示了我用n8n构建真正Agent系统的能力，而不是简单的workflow自动化。我的RAG pipeline包含10多个节点的复杂编排，涉及API调用、数据处理、错误处理。同样的架构可以应用到潜客生成：将客户资料存入向量库，基于历史成功案例智能推荐销售策略。我熟悉CRM集成，CargoFlow项目中我实现了Airtable和GoHighLevel的双CRM同步。"

**对需求3（工程公司）**：
> "我的demo展示了multi-workflow架构：文档处理workflow + RAG问答workflow，与您需要的10个Agent生态系统理念一致。特别是PDF自动化部分，可以直接应用到TR1/TR8表单处理。我的技术栈（NestJS + PostgreSQL + n8n）完全符合您的要求，并且我有QuickBooks API集成经验的学习能力（参考我在CargoFlow中集成Shippo/Airtable/GoHighLevel的经验）。"

---

## 七、Demo演示脚本

### 7.1 演示准备
- 准备3-5个测试PDF文档：
  - 企业员工手册（10-20页）
  - 产品技术文档
  - 项目计划书
  - 合同模板
- 准备10个测试问题（简单 → 复杂）
- 录屏软件：Loom或OBS

### 7.2 演示流程（10分钟）

**Part 1: 问题陈述（1分钟）**
> "企业有大量PDF文档（合同、手册、技术文档），员工需要反复翻阅查找信息，效率低下。传统搜索只能匹配关键词，无法理解语义。我的RAG系统可以让文档'开口说话'，用自然语言提问，秒级获得准确答案。"

**Part 2: 系统演示（6分钟）**

1. **上传文档**（1分钟）
   - 拖拽上传"员工手册.pdf"
   - 展示处理进度："正在提取文本... 已分割为45个文本块... 生成向量... 索引完成"
   - 文档列表显示：文件名、大小、chunk数量、上传时间

2. **智能问答**（3分钟）
   - 问题1："请假需要提前几天申请？"
     → 答案 + 来源（第12页）
   - 问题2："年终奖的发放标准是什么？"
     → 精准提取相关段落
   - 问题3（跨页）："入职流程包括哪些步骤？"
     → 整合多页内容生成完整答案

3. **技术亮点展示**（2分钟）
   - 展示n8n工作流画布（可视化编排）
   - 展示向量检索结果（相似度分数）
   - 展示PostgreSQL中的聊天历史
   - 展示Pinecone向量数据库

**Part 3: 技术栈说明（2分钟）**
- 架构图快速讲解
- 强调技术点：NestJS + n8n + Pinecone + OpenAI
- 展示代码结构（GitHub截图）
- 说明可扩展方向

**Part 4: Q&A与收尾（1分钟）**
- 演示部署版本（Railway链接）
- GitHub代码仓库
- 强调交付物：源码 + 文档 + 部署脚本

### 7.3 视频脚本关键点

**开场（吸引注意）**:
> "让我演示一个RAG系统，它能让您的PDF文档像有一个AI助手一样回答问题。"

**中间（展示价值）**:
> "注意看，我问的是'请假流程'，系统不是简单的关键词匹配，而是理解了语义，找到了相关段落，并用自然语言生成了答案。"

**结尾（强调能力）**:
> "这个demo展示了我构建生产级RAG系统的能力。使用的技术栈（n8n + NestJS + Pinecone）完全符合您的需求，并且可以快速扩展到邮件处理、CRM集成等复杂场景。"

---

## 八、项目结构（参考CargoFlow）

```
RagFlow/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── documents/    # 文档管理模块
│   │   │   ├── chat/         # RAG问答模块
│   │   │   ├── prisma.service.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── nixpacks.toml     # Railway部署配置
│   │   └── package.json
│   │
│   └── frontend/             # Next.js UI
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # 首页（上传文档）
│       │   │   ├── chat/[id]/page.tsx # 问答页面
│       │   │   └── documents/page.tsx # 文档列表
│       │   └── components/
│       │       ├── DocumentUpload.tsx
│       │       ├── ChatInterface.tsx
│       │       └── DocumentList.tsx
│       ├── nixpacks.toml
│       └── package.json
│
├── packages/
│   └── database/            # Prisma共享
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── docs/
│   ├── n8n-workflows/
│   │   ├── pdf-processing.json      # n8n工作流1
│   │   └── rag-query.json           # n8n工作流2
│   ├── architecture.md               # 架构文档
│   └── api-documentation.md          # API文档
│
├── scripts/
│   └── setup.sh             # 环境初始化脚本
│
├── .env.example             # 环境变量模板
├── package.json             # 根package.json（monorepo）
├── docker-compose.yml       # 本地开发（PostgreSQL + n8n）
└── README.md
```

---

## 九、预算与时间投入

### MVP Demo（1-2周）
- **开发时间**: 40-60小时
- **主要成本**:
  - OpenAI API: $20-50（测试 + demo用途）
  - Pinecone: 免费tier（1GB足够demo）
  - Railway部署: 免费tier或$5/月
- **交付物**:
  - 可在线访问的demo（Railway部署）
  - GitHub公开仓库（完整源码）
  - 10分钟demo视频（Loom）
  - README（快速开始指南）

### 完整版（3-4周）
- **开发时间**: 80-120小时
- **主要成本**:
  - OpenAI API: $100-200
  - Pinecone Starter: $70/月（如需更大容量）
  - Railway: $20-40/月
- **交付物**:
  - 生产级代码（错误处理、日志、监控）
  - 完整API文档（Swagger）
  - 单元测试覆盖
  - 部署自动化脚本
  - 用户使用文档

---

## 十、技术亮点与差异化

### 10.1 对比简单RAG方案

| 维度 | 简单RAG（LangChain脚本） | 我们的方案 |
|------|------------------------|----------|
| 可视化 | 无 | n8n可视化工作流，非技术人员也能理解 |
| 可扩展性 | 代码耦合，难扩展 | 工作流模块化，易于添加新功能 |
| 生产就绪 | 脚本级别 | 完整全栈应用（前端+后端+数据库） |
| 错误处理 | 基础try-catch | n8n内置重试、错误分支、日志 |
| 部署难度 | 需要配置Python环境 | Docker一键启动，Railway一键部署 |
| 监控调试 | 打印日志 | n8n执行历史、可视化调试 |

### 10.2 核心技术亮点

1. **n8n工作流编排**
   - 展示复杂自动化能力（而非简单脚本）
   - 可视化工作流易于维护和扩展
   - 10-12个节点的生产级编排

2. **混合数据库架构**
   - PostgreSQL（结构化数据）+ Pinecone（向量数据）
   - 展示数据架构设计能力

3. **全栈能力**
   - NestJS模块化后端
   - Next.js现代化前端
   - 完整的API设计

4. **成本意识**
   - 使用text-embedding-3-small（降低50%成本）
   - 使用gpt-4o-mini（降低90%成本）
   - 展示生产环境成本优化思维

5. **来源追溯**
   - 不是黑盒AI，每个答案都有引用来源
   - 展示可解释性和可信度

---

## 十一、结论与建议

### 推荐方案
**构建"智能文档知识库 RAG 系统"**

### 为什么这是最佳选择？

1. **技术复杂度适中**: 1-2周可完成MVP，无需复杂的邮件/CRM集成
2. **技术展示充分**: 覆盖RAG核心技术（向量检索、Embedding、LLM生成）
3. **参考成熟架构**: 基于CargoFlow的NestJS + n8n + PostgreSQL技术栈
4. **可演示性强**: PDF上传 → 智能问答，效果直观
5. **扩展性强**: 同样的RAG架构可应用到邮件、CRM、提案生成等场景
6. **成本可控**: OpenAI API费用约$20-50（demo阶段）

### 核心竞争力

相比简单的RAG脚本，我们的方案展示：
- ✅ **n8n可视化工作流**：10-12个节点的复杂编排
- ✅ **全栈能力**：NestJS + Next.js + PostgreSQL完整应用
- ✅ **生产级架构**：错误处理、日志、监控
- ✅ **混合数据库**：关系型 + 向量数据库设计经验
- ✅ **成本优化意识**：使用小模型降低90%成本

### 与Upwork需求的匹配度

| 需求方面 | Demo中的体现 |
|---------|-------------|
| RAG记忆系统 | ✅ Pinecone向量库 + 持久化存储 |
| 文档处理 | ✅ PDF解析 + 智能分块 + Embedding |
| 自动化工作流 | ✅ n8n生产级工作流（可直接扩展到邮件/CRM） |
| 全栈开发 | ✅ NestJS + Next.js + PostgreSQL |
| API集成 | ✅ OpenAI + Pinecone API |
| 可扩展架构 | ✅ 模块化设计，易于添加新功能 |

### 下一步行动计划

**Week 1**（立即开始）:
1. 创建项目结构（参考CargoFlow monorepo）
2. 搭建开发环境（PostgreSQL + n8n + Pinecone）
3. 实现基础API（文档上传、列表）
4. 开发n8n Workflow 1（PDF处理流程）

**Week 2**:
1. 开发n8n Workflow 2（RAG问答流程）
2. 前端UI开发（上传 + 聊天界面）
3. 端到端测试
4. 部署到Railway

**Week 3**（可选）:
1. 录制demo视频（10分钟）
2. 完善GitHub README
3. 准备Upwork提案文档
4. 投递申请

### 接单策略

**提案关键点**:
1. **附上GitHub链接**（公开仓库，完整源码）
2. **附上在线Demo**（Railway部署链接）
3. **附上视频演示**（Loom 5-10分钟）
4. **具体技术说明**:
   - "我使用n8n构建了2个生产级工作流（10-12节点），展示复杂自动化编排能力"
   - "实现了完整的RAG pipeline：PDF解析 → 文本分块 → Embedding → 向量检索 → LLM生成"
   - "全栈实现：NestJS后端 + Next.js前端 + PostgreSQL + Pinecone"
5. **扩展性说明**:
   - "当前demo处理PDF文档，同样架构可扩展到邮件处理、CRM集成、提案生成"
   - "n8n工作流可轻松添加Gmail API、QuickBooks API等集成"

**报价策略（调整后）**:
- 需求1: $6,000-10,000（展示RAG核心能力，说明可扩展到邮件）
- 需求2: $5,000-8,000（强调n8n工作流 + Agent架构思维）
- 需求3: $10,000-18,000（最复杂，展示可扩展到10个Agent）

---

## 附录A：n8n工作流节点详细设计

### Workflow 1: PDF处理流程

```
1. Webhook Trigger
   - Method: POST
   - Path: /webhook/process-pdf
   - Body: { documentId, fileUrl }

2. HTTP Request (下载PDF)
   - URL: {{ $json.fileUrl }}
   - Method: GET
   - Response Format: File

3. Code Node (PDF解析)
   - npm库: pdf-parse
   - 输出: { text, numPages, metadata }

4. Code Node (文本分块)
   - 逻辑: RecursiveCharacterTextSplitter
   - chunkSize: 800
   - chunkOverlap: 200
   - 输出: chunks数组

5. Loop Node (遍历chunks)

   6. Code Node (准备Embedding请求)
      - 格式化chunk文本

   7. HTTP Request (OpenAI Embeddings)
      - URL: https://api.openai.com/v1/embeddings
      - Model: text-embedding-3-small
      - 输出: vector[1536]

   8. Code Node (准备Pinecone数据)
      - 构建metadata: { documentId, chunkIndex, pageNumber }

   9. HTTP Request (Pinecone Upsert)
      - URL: https://[index]-[project].svc.pinecone.io/vectors/upsert
      - Body: { vectors: [{ id, values, metadata }] }

10. PostgreSQL (更新文档状态)
    - UPDATE documents SET status='ready', chunk_count=X

11. Respond to Webhook
    - 返回: { success: true, chunksProcessed: X }
```

### Workflow 2: RAG问答流程

```
1. Webhook Trigger
   - Method: POST
   - Path: /webhook/rag-query
   - Body: { question, documentId }

2. PostgreSQL (查询文档信息)
   - SELECT * FROM documents WHERE id = {{ $json.documentId }}

3. Code Node (问题预处理)
   - 去除特殊字符，准备Embedding

4. HTTP Request (问题向量化)
   - URL: https://api.openai.com/v1/embeddings
   - Model: text-embedding-3-small
   - 输出: queryVector[1536]

5. Code Node (准备Pinecone查询)
   - filter: { documentId: X }
   - topK: 5

6. HTTP Request (Pinecone Query)
   - URL: https://[index]-[project].svc.pinecone.io/query
   - Body: { vector, topK, filter, includeMetadata: true }
   - 输出: matches数组（含score和metadata）

7. Code Node (组装上下文)
   - 拼接检索到的chunks
   - 构建prompt模板

8. HTTP Request (OpenAI Chat)
   - URL: https://api.openai.com/v1/chat/completions
   - Model: gpt-4o-mini
   - Messages: [
       { role: "system", content: "你是文档助手..." },
       { role: "user", content: "基于以下内容回答: {context}\n\n问题: {question}" }
     ]

9. Code Node (解析答案)
   - 提取answer文本
   - 整理sources数组

10. PostgreSQL (保存聊天记录)
    - INSERT INTO chat_history (question, answer, sources)

11. Respond to Webhook
    - 返回: { answer, sources: [{ filename, page, score }] }
```

---

## 附录B：Prisma Schema设计

```prisma
// packages/database/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Document {
  id            String    @id @default(uuid())
  filename      String
  fileUrl       String
  fileSize      Int
  mimeType      String    @default("application/pdf")

  status        String    @default("pending") // pending, processing, ready, failed
  chunkCount    Int       @default(0)

  uploadedAt    DateTime  @default(now())
  processedAt   DateTime?

  chatHistory   ChatHistory[]

  @@map("documents")
}

model ChatHistory {
  id          String   @id @default(uuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  question    String
  answer      String
  sources     Json     // [{ filename, page, score }]

  createdAt   DateTime @default(now())

  @@map("chat_history")
  @@index([documentId])
}

model AutomationLog {
  id          String   @id @default(uuid())
  workflowId  String
  action      String
  status      String   // success, failed
  details     Json
  createdAt   DateTime @default(now())

  @@map("automation_logs")
}
```

---

**文档版本**: v2.0（简化版）
**创建日期**: 2026-07-26
**修订日期**: 2026-07-26
**作者**: AI Product Designer
**状态**: 待开发实现
