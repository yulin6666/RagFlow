# RagFlow - Intelligent Document Q&A System

A production-ready RAG (Retrieval-Augmented Generation) system that lets you upload PDF documents and ask questions using AI. Built with NestJS, Next.js, n8n, and Pinecone.

![RagFlow Demo](https://via.placeholder.com/800x400?text=RagFlow+Demo)

## 🌟 Features

- 📄 **PDF Document Processing** - Upload and automatically process PDF files
- 🤖 **Intelligent Q&A** - Ask questions in natural language and get accurate answers
- 🔍 **Source Attribution** - Every answer includes references to source pages
- 💬 **Chat History** - Keep track of all your conversations
- 🎨 **Modern UI** - Clean, responsive interface built with Next.js
- 🔄 **n8n Automation** - Visual workflow orchestration for RAG pipeline
- 🚀 **Production Ready** - Complete with error handling, logging, and monitoring

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│  NestJS API  │─────▶│     n8n     │
│  Frontend   │      │   Backend    │      │  Workflows  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │  PostgreSQL  │      │  Pinecone   │
                     │   Database   │      │  Vector DB  │
                     └──────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │ OpenRouter  │
                                          │     LLM     │
                                          └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- OpenRouter API key (https://openrouter.ai)
- Pinecone API key (https://pinecone.io)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd RagFlow

# Run setup script
chmod +x setup.sh
./setup.sh

# Configure API keys in .env file
nano .env
```

### Start the Application

```bash
# Start all services
npm run dev
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **n8n**: http://localhost:5678 (admin/ragflow123)

📖 **Full setup guide**: See [SETUP.md](./SETUP.md)

## 📚 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Styling (via globals.css)

### Backend
- **NestJS** - TypeScript Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL 15** - Relational database
- **Multer** - File upload handling

### AI & Automation
- **n8n** - Workflow automation platform
- **OpenRouter** - LLM API gateway (GPT-4, Qwen, etc.)
- **Pinecone** - Vector database for embeddings

## 📁 Project Structure

```
RagFlow/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── documents/    # Document management module
│   │   │   ├── chat/         # RAG query module
│   │   │   ├── common/       # Shared services (Prisma)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── uploads/          # PDF storage
│   │
│   └── frontend/             # Next.js UI
│       ├── app/
│       │   ├── components/
│       │   │   ├── ChatInterface.js
│       │   │   ├── DocumentList.js
│       │   │   └── DocumentUpload.js
│       │   ├── layout.js
│       │   ├── page.js
│       │   └── globals.css
│       └── package.json
│
├── packages/
│   └── database/             # Prisma database package
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── docs/
│   └── n8n-workflows/        # n8n workflow exports
│       ├── pdf-processing-workflow.json
│       └── rag-query-workflow.json
│
├── docker-compose.yml        # PostgreSQL + n8n
├── package.json              # Monorepo root
├── .env.example              # Environment template
├── setup.sh                  # Quick setup script
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:ragflow123@localhost:5432/ragflow_db"

# OpenRouter API
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Pinecone
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=ragflow-docs

# n8n
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook

# Backend
BACKEND_PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Pinecone Setup

Create an index with:
- **Dimensions**: 1536 (for OpenAI embeddings)
- **Metric**: cosine
- **Pod Type**: starter (free tier)

## 🎯 How It Works

### 1. PDF Processing Workflow (n8n)

```
Upload PDF → Extract Text → Split into Chunks → Generate Embeddings → Store in Pinecone
```

**Steps:**
1. User uploads PDF via frontend
2. Backend saves file and triggers n8n webhook
3. n8n workflow extracts text from PDF
4. Text is split into ~800 character chunks with overlap
5. Each chunk is embedded using OpenRouter
6. Embeddings stored in Pinecone with metadata
7. Database updated with status: ready

### 2. RAG Query Workflow (n8n)

```
User Question → Generate Query Embedding → Search Pinecone → Retrieve Context → LLM Answer
```

**Steps:**
1. User asks question via chat interface
2. Question is embedded using same model
3. Pinecone returns top-k similar chunks
4. Context assembled with source attribution
5. LLM generates answer based on context
6. Answer + sources returned to user
7. Chat history saved to database

## 📊 API Documentation

### Documents API

**Upload Document**
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

file: <pdf-file>
```

**List Documents**
```bash
GET /api/documents
```

**Get Document**
```bash
GET /api/documents/:id
```

**Delete Document**
```bash
DELETE /api/documents/:id
```

### Chat API

**Query Document**
```bash
POST /api/chat/query
Content-Type: application/json

{
  "question": "What is the main topic?",
  "documentId": "uuid"
}
```

**Get Chat History**
```bash
GET /api/chat/history/:documentId
```

## 🛠️ Development

### Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Build
npm run build            # Build all
npm run build:backend
npm run build:frontend

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations

# Docker
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:restart   # Restart containers
```

### Database Management

```bash
# Open Prisma Studio
cd packages/database
npx prisma studio

# View database in psql
docker exec -it ragflow-postgres psql -U postgres -d ragflow_db
```

## 🧪 Testing

Upload a sample PDF and try these questions:

- "What is this document about?"
- "Summarize the main points"
- "What does it say about [specific topic]?"
- "Find information about [keyword]"

## 📦 Deployment

### Railway Deployment

1. Push code to GitHub
2. Create Railway project
3. Add services: Backend, Frontend, PostgreSQL
4. Configure environment variables
5. Deploy n8n separately (Railway template or self-host)

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- UI powered by [Next.js](https://nextjs.org/)
- Automation by [n8n](https://n8n.io/)
- Vector search by [Pinecone](https://www.pinecone.io/)
- LLM via [OpenRouter](https://openrouter.ai/)

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md#troubleshooting) for common issues and solutions.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`

---

**Built with ❤️ using modern RAG technology**
