# RagFlow — Railway Deployment Guide

## Architecture Overview

This project runs **3 services** on Railway:

| Service | Type | Description |
|---------|------|-------------|
| `ragflow-backend` | GitHub repo | NestJS API + file uploads |
| `ragflow-frontend` | GitHub repo | Next.js frontend |
| `Postgres` | Railway plugin | Managed PostgreSQL |

**n8n** is already deployed at `https://n8n-production-fee8.up.railway.app`.

> OPENROUTER_API_KEY, PINECONE_API_KEY, and all AI/vector credentials are configured **inside n8n workflows**, not in this project. The only n8n-related variable this backend needs is `N8N_WEBHOOK_BASE_URL`.

---

## Prerequisites

- Railway account: [railway.app](https://railway.app)
- Code pushed to GitHub
- n8n workflows already imported and active (see `docs/n8n-workflows/`)

---

## Deployment Steps

### Step 1: Create Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"** → select your RagFlow repository
3. Skip the auto-deploy prompt for now

---

### Step 2: Add PostgreSQL Database

1. In the project Dashboard click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically generates `DATABASE_URL` and injects it into all services in the same project
3. Copy `DATABASE_URL` from the Postgres service's Variables panel — you'll need it for the backend

---

### Step 3: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → select the repository
2. In **Settings → Build → Config-as-code File Path**, enter:
   ```
   apps/backend/railway.json
   ```
   This tells Railway to use the Railpack builder with the correct build/start commands for the monorepo.
3. In the **Variables** panel, add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `DATABASE_URL` | *(copy from Postgres plugin)* | Usually auto-injected; add manually if not |
   | `N8N_WEBHOOK_BASE_URL` | `https://n8n-production-fee8.up.railway.app/webhook` | Your existing n8n instance |
   | `FRONTEND_URL` | *(fill in after Step 4)* | Frontend domain for CORS |
   | `NODE_ENV` | `production` | |

4. Click **"Deploy"** and wait for the build to finish
5. Go to **Settings → Networking** → generate a public domain, e.g. `ragflow-backend-xxx.railway.app`

---

### Step 4: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → select the same repository
2. In **Settings → Build → Config-as-code File Path**, enter:
   ```
   apps/frontend/railway.json
   ```
3. In the **Variables** panel, add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://ragflow-backend-xxx.railway.app` | Backend URL from Step 3 |
   | `NODE_ENV` | `production` | |

   > `NEXT_PUBLIC_API_URL` is baked into the frontend at build time. If you change it, redeploy.

4. Click **"Deploy"** and wait for the build to finish
5. Generate a public domain, e.g. `ragflow-frontend-xxx.railway.app`

---

### Step 5: Update CORS on Backend

1. Go back to the **Backend** service Variables panel
2. Set `FRONTEND_URL` to the frontend domain from Step 4:
   ```
   FRONTEND_URL=https://ragflow-frontend-xxx.railway.app
   ```
3. Backend will redeploy automatically

---

### Step 6: Verify

```
# Check API is up
https://ragflow-backend-xxx.railway.app/api/documents

# Open frontend
https://ragflow-frontend-xxx.railway.app
```

---

## Local Development

Local env uses `.env` file — completely independent from Railway config.

```bash
# Start local PostgreSQL + n8n
docker-compose up -d

# Start dev servers
npm run dev
```

See `.env.example` for all variables.

---

## Key Files

```
apps/backend/
  railway.json    # Railpack build config (install → prisma generate → nest build → migrate → start)

apps/frontend/
  railway.json    # Railpack build config (install → next build → start)

railway.json      # Project-level Railway config (restart policy)
.env.example      # Variable reference template
```

---

## Troubleshooting

**Build fails: cannot find workspace packages**

Check `apps/backend/railway.json` — the buildCommand must install from repo root:
```json
"buildCommand": "npm install --workspace=packages/database --workspace=apps/backend --legacy-peer-deps && ..."
```

**Prisma migrate fails**

Check that `DATABASE_URL` is injected. The Postgres plugin auto-injects it only if the backend service is in the same Railway project.

**Frontend CORS error**

Make sure backend `FRONTEND_URL` exactly matches the frontend domain (include `https://`, no trailing slash).

**Uploaded files lost after restart**

Railway's filesystem is ephemeral — `uploads/` is cleared on restart. For production, migrate file storage to S3 / Cloudflare R2 / Supabase Storage.
