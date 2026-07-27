# n8n Workflows for RagFlow

This directory contains n8n workflow definitions that power the RAG pipeline.

## Workflows

### 1. PDF Processing Workflow
**File**: `pdf-processing-workflow.json`

**Purpose**: Processes uploaded PDF documents and stores them in Pinecone vector database.

**Trigger**: Webhook POST `/webhook/process-pdf`

**Flow**:
```
Webhook → Download PDF → Extract Text → Split Chunks → Generate Embeddings → Store in Pinecone → Update DB
```

**Input**:
```json
{
  "documentId": "uuid",
  "fileUrl": "http://localhost:3001/uploads/file.pdf",
  "filename": "document.pdf"
}
```

**Output**:
```json
{
  "success": true,
  "documentId": "uuid",
  "chunksProcessed": 42
}
```

### 2. RAG Query Workflow
**File**: `rag-query-workflow.json`

**Purpose**: Answers user questions by retrieving relevant context from Pinecone and generating answers with LLM.

**Trigger**: Webhook POST `/webhook/rag-query`

**Flow**:
```
Webhook → Embed Question → Search Pinecone → Assemble Context → Generate Answer → Return Response
```

**Input**:
```json
{
  "question": "What is the main topic?",
  "documentId": "uuid"
}
```

**Output**:
```json
{
  "answer": "The document discusses...",
  "sources": [
    {
      "filename": "document.pdf",
      "page": 3,
      "score": 0.89,
      "content": "excerpt..."
    }
  ]
}
```

## Setup Instructions

### 1. Import Workflows

1. Access n8n at http://localhost:5678
2. Login with `admin` / `ragflow123`
3. Go to **Workflows** → **Import from File**
4. Select `pdf-processing-workflow.json`
5. Click **Import**
6. Repeat for `rag-query-workflow.json`

### 2. Configure Credentials

Each workflow needs these credentials:

#### OpenRouter API
- **Credential Type**: HTTP Header Auth
- **Name**: `OpenRouter API`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_OPENROUTER_API_KEY`

#### Pinecone API
- **Credential Type**: HTTP Header Auth
- **Name**: `Pinecone API`
- **Header Name**: `Api-Key`
- **Header Value**: `YOUR_PINECONE_API_KEY`

#### PostgreSQL
- **Credential Type**: Postgres
- **Name**: `RagFlow Database`
- **Host**: `host.docker.internal`
- **Database**: `ragflow_db`
- **User**: `postgres`
- **Password**: `ragflow123`
- **Port**: `5432`

### 3. Activate Workflows

1. Open each workflow
2. Toggle the **Active** switch in the top right
3. Verify webhook URLs are correct:
   - PDF Processing: `http://localhost:5678/webhook/process-pdf`
   - RAG Query: `http://localhost:5678/webhook/rag-query`

## Workflow Details

### PDF Processing Workflow Nodes

1. **Webhook** - Receives document upload trigger
2. **HTTP Request** - Downloads PDF file
3. **Code** - Extracts text from PDF (pdf-parse)
4. **Code** - Splits text into chunks (RecursiveCharacterTextSplitter logic)
5. **Loop** - Iterates through chunks
6. **HTTP Request** - Calls OpenRouter embeddings API
7. **HTTP Request** - Upserts vectors to Pinecone
8. **Postgres** - Updates document status to 'ready'
9. **Respond to Webhook** - Returns success response

### RAG Query Workflow Nodes

1. **Webhook** - Receives query request
2. **Postgres** - Fetches document info
3. **Code** - Pre-processes question
4. **HTTP Request** - Generates question embedding
5. **Code** - Prepares Pinecone query
6. **HTTP Request** - Searches Pinecone for similar chunks
7. **Code** - Assembles context from results
8. **HTTP Request** - Calls OpenRouter chat completion
9. **Code** - Parses answer and extracts sources
10. **Postgres** - Saves to chat_history
11. **Respond to Webhook** - Returns answer + sources

## Configuration

### OpenRouter Models

Recommended models:
- **Embeddings**: `openai/text-embedding-3-small` (cheap, fast)
- **Chat**: `qwen/qwen-2.5-72b-instruct` (good quality, low cost)
- **Alternative**: `openai/gpt-4o-mini` (better quality, higher cost)

Update in n8n HTTP Request nodes.

### Pinecone Settings

- **Index Name**: Match your `.env` (`ragflow-docs`)
- **Namespace**: Optional, leave empty for default
- **Top K**: 5 (number of chunks to retrieve)
- **Score Threshold**: 0.7 (minimum similarity)

### Chunking Parameters

In PDF Processing workflow:
- **Chunk Size**: 800 characters
- **Chunk Overlap**: 200 characters
- **Separator**: `\n\n` (paragraph breaks)

## Testing Workflows

### Test PDF Processing

```bash
curl -X POST http://localhost:5678/webhook/process-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-123",
    "fileUrl": "http://localhost:3001/uploads/sample.pdf",
    "filename": "sample.pdf"
  }'
```

### Test RAG Query

```bash
curl -X POST http://localhost:5678/webhook/rag-query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "documentId": "test-123"
  }'
```

## Monitoring

View workflow executions:
1. Go to **Executions** in n8n
2. Click on any execution to see detailed logs
3. Check each node's input/output
4. Look for errors in red nodes

## Troubleshooting

### Workflow Not Triggering

- Check webhook URLs match backend configuration
- Verify workflows are **Active**
- Check n8n logs: `docker logs ragflow-n8n`

### OpenRouter API Errors

- Verify API key is correct
- Check rate limits
- Ensure model name is valid
- View request/response in execution logs

### Pinecone Errors

- Verify index exists and dimensions match (1536)
- Check API key permissions
- Ensure environment/region is correct

### Database Connection Failed

- Use `host.docker.internal` instead of `localhost` from n8n
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check credentials match docker-compose.yml

## Advanced Customization

### Change Embedding Model

1. Update PDF Processing workflow → OpenRouter Embeddings node
2. Update RAG Query workflow → OpenRouter Embeddings node
3. **Important**: If dimensions change, recreate Pinecone index

### Adjust Chunk Size

Edit Code node in PDF Processing workflow:
```javascript
const chunkSize = 1000; // Increase for larger chunks
const chunkOverlap = 250; // Increase overlap proportionally
```

### Modify LLM Prompt

Edit RAG Query workflow → OpenRouter Chat node:
```javascript
const systemPrompt = "You are a helpful assistant that answers questions based on provided context...";
```

## Export Workflows

To backup or share workflows:
1. Open workflow in n8n
2. Click **...** (menu) → **Download**
3. Save JSON file
4. Commit to git (remove sensitive data!)

---

**Note**: Workflow JSON files will be created after you configure them in n8n. Export and save them here for version control.
