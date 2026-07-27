# RagFlow Setup Guide

Complete guide for running RagFlow locally.

## Prerequisites

- **Node.js** >= 18.0.0
- **Docker** (with self-hosted-ai-starter-kit already configured)

## Docker Services

RagFlow reuses the existing Docker services from `self-hosted-ai-starter-kit`:

| Service    | Container                              | Port |
|------------|----------------------------------------|------|
| PostgreSQL | `self-hosted-ai-starter-kit-postgres-1`| 5433 |
| n8n        | `n8n`                                  | 5678 |

To start them manually:
```bash
cd /Users/lindediannao/Documents/project/n8n/self-hosted-ai-starter-kit
docker compose up -d postgres n8n
```

## Quick Start

```bash
cd /path/to/RagFlow
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Verify Docker services are running (start them if not)
2. Create `.env` from `.env.example`
3. Install all npm dependencies (workspace)
4. Create `ragflow_db` database in the existing PostgreSQL
5. Apply Prisma schema migrations
6. Create `apps/backend/uploads/` directory

## Configure Environment Variables

Edit `.env` and add your API keys:

```env
OPENROUTER_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=us-east-1-aws   # check your Pinecone console
PINECONE_INDEX_NAME=ragflow-docs
```

Get keys:
- OpenRouter: https://openrouter.ai/keys
- Pinecone: https://app.pinecone.io (free starter tier)

## Setup Pinecone Index

Create an index in the Pinecone console:
- **Name**: `ragflow-docs`
- **Dimensions**: `1536`
- **Metric**: `cosine`
- **Pod type**: `starter` (free)

## Configure n8n Workflows

Access n8n at **http://localhost:5678** and build two workflows.
See [`docs/n8n-workflows/README.md`](./docs/n8n-workflows/README.md) for full node-by-node instructions.

**Required credentials in n8n:**

| Name | Type | Value |
|------|------|-------|
| OpenRouter API | HTTP Header Auth | `Authorization: Bearer <key>` |
| Pinecone API | HTTP Header Auth | `Api-Key: <key>` |
| RagFlow DB | Postgres | host: `postgres`, port: `5432`, db: `ragflow_db`, user: `root`, pass: `password` |

> Note: Inside n8n's Docker network the PostgreSQL hostname is `postgres` (not `localhost`).

## Start the Application

```bash
npm run dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:3001/api |
| n8n      | http://localhost:5678 |

## Database Commands

```bash
# Open Prisma Studio
cd packages/database && npx prisma studio

# Connect via psql
docker exec -it self-hosted-ai-starter-kit-postgres-1 psql -U root -d ragflow_db

# View tables
docker exec -it self-hosted-ai-starter-kit-postgres-1 \
  psql -U root -d ragflow_db -c "\dt"
```

## API Endpoints

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get document + chat history |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/:id/status` | Get processing status |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/query` | Ask a question |
| GET | `/api/chat/history/:documentId` | Get chat history |

## Project Structure

```
RagFlow/
├── apps/
│   ├── backend/              # NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── documents/    # Upload + document management
│   │   │   ├── chat/         # RAG query + history
│   │   │   └── common/       # PrismaService
│   │   └── uploads/          # Stored PDF files
│   └── frontend/             # Next.js 14 (port 3000)
│       └── app/
│           ├── components/
│           │   ├── DocumentUpload.js
│           │   ├── DocumentList.js
│           │   └── ChatInterface.js
│           └── page.js
├── packages/
│   └── database/             # Prisma schema + migrations
│       └── prisma/schema.prisma
├── docs/
│   └── n8n-workflows/        # Workflow instructions + exports
├── .env.example
├── setup.sh
└── SETUP.md
```

## Troubleshooting

### PostgreSQL not reachable

```bash
# Check containers
docker ps | grep postgres

# Test connection
docker exec -it self-hosted-ai-starter-kit-postgres-1 \
  psql -U root -d ragflow_db -c "SELECT 1"
```

### Prisma cannot connect

Make sure `.env` has the correct DATABASE_URL:
```env
DATABASE_URL="postgresql://root:password@localhost:5433/ragflow_db"
```

Regenerate client after schema changes:
```bash
cd packages/database
npx prisma generate
npx prisma db push
```

### n8n webhook not firing

- Check workflow is **Active** (toggle in top-right)
- Verify webhook path matches `N8N_WEBHOOK_BASE_URL` in `.env`
- Check execution logs in n8n → **Executions**

### File upload fails

```bash
ls -la apps/backend/uploads   # should exist
mkdir -p apps/backend/uploads  # create if missing
```
