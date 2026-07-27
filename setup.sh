#!/bin/bash

# RagFlow Quick Setup Script
# Uses existing Docker services from self-hosted-ai-starter-kit

set -e

echo "🚀 RagFlow Setup Script"
echo "======================"
echo ""

# ── 1. Check prerequisites ─────────────────────────────────────────────────────

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi
echo "✅ Docker: $(docker --version | cut -d',' -f1)"
echo ""

# ── 2. Check existing Docker services ─────────────────────────────────────────

N8N_STARTER_KIT="/Users/lindediannao/Documents/project/n8n/self-hosted-ai-starter-kit"

echo "🔍 Checking existing Docker services..."

# Detect actual container names (compose prefixes them with the project name)
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'postgres' | head -1)
N8N_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^n8n$' | head -1)

# Check if postgres container is running
if [ -n "$POSTGRES_CONTAINER" ]; then
    echo "✅ PostgreSQL already running ($POSTGRES_CONTAINER, port 5433)"
else
    echo "⚠️  PostgreSQL container not found. Starting self-hosted-ai-starter-kit..."
    if [ -d "$N8N_STARTER_KIT" ]; then
        cd "$N8N_STARTER_KIT"
        docker compose up -d postgres n8n
        cd - > /dev/null
        echo "✅ Started PostgreSQL and n8n"
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'postgres' | head -1)
        N8N_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^n8n$' | head -1)
    else
        echo "❌ Cannot find self-hosted-ai-starter-kit at: $N8N_STARTER_KIT"
        echo "   Please start Docker services manually:"
        echo "   cd $N8N_STARTER_KIT && docker compose up -d postgres n8n"
        exit 1
    fi
fi

# Check if n8n container is running
if [ -n "$N8N_CONTAINER" ]; then
    echo "✅ n8n already running (port 5678)"
else
    echo "⚠️  n8n container not found. Starting..."
    if [ -d "$N8N_STARTER_KIT" ]; then
        cd "$N8N_STARTER_KIT"
        docker compose up -d n8n
        cd - > /dev/null
        N8N_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^n8n$' | head -1)
        echo "✅ Started n8n"
    else
        echo "❌ Cannot find self-hosted-ai-starter-kit at: $N8N_STARTER_KIT"
        exit 1
    fi
fi
echo ""

# ── 3. Create .env file ────────────────────────────────────────────────────────

if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "⚠️  Add your API keys to .env before starting:"
    echo "   OPENROUTER_API_KEY=..."
    echo "   PINECONE_API_KEY=..."
    echo ""
else
    echo "✅ .env already exists"
fi

# ── 4. Install dependencies ────────────────────────────────────────────────────

echo "📦 Installing dependencies..."

# Use npm workspaces — one install from root handles everything
npm install
echo "✅ Dependencies installed"
echo ""

# ── 5. Create ragflow_db in existing PostgreSQL ────────────────────────────────

echo "🗄️  Ensuring ragflow_db database exists..."

# Wait for postgres to be accepting connections
for i in {1..10}; do
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U root -d n8n -q 2>/dev/null; then
        break
    fi
    echo "   Waiting for PostgreSQL... ($i/10)"
    sleep 2
done

# Create the database if it doesn't exist
docker exec "$POSTGRES_CONTAINER" psql -U root -d n8n -tc "SELECT 1 FROM pg_database WHERE datname='ragflow_db'" \
    | grep -q 1 || docker exec "$POSTGRES_CONTAINER" psql -U root -d n8n -c "CREATE DATABASE ragflow_db;"
echo "✅ ragflow_db ready"
echo ""

# ── 6. Run Prisma migrations ───────────────────────────────────────────────────

echo "🔄 Running database migrations..."
# Load DATABASE_URL from root .env so Prisma can find it
export $(grep -v '^#' .env | grep 'DATABASE_URL' | xargs)
cd packages/database
npx prisma generate
npx prisma db push
cd ../..
echo "✅ Database schema applied"
echo ""

# ── 7. Create uploads directory ───────────────────────────────────────────────

mkdir -p apps/backend/uploads
echo "✅ Uploads directory ready"
echo ""

# ── 8. Done ───────────────────────────────────────────────────────────────────

echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Edit .env and add your API keys:"
echo "   - OPENROUTER_API_KEY  →  https://openrouter.ai/keys"
echo "   - PINECONE_API_KEY    →  https://app.pinecone.io"
echo ""
echo "2. Create Pinecone index:"
echo "   Name: ragflow-docs  |  Dimensions: 1536  |  Metric: cosine"
echo ""
echo "3. Configure n8n workflows:"
echo "   http://localhost:5678  →  see docs/n8n-workflows/README.md"
echo ""
echo "4. Start the application:"
echo "   npm run dev"
echo ""
echo "   Frontend  →  http://localhost:3000"
echo "   Backend   →  http://localhost:3001/api"
echo "   n8n       →  http://localhost:5678"
echo ""
echo "For full details see SETUP.md"
echo ""
