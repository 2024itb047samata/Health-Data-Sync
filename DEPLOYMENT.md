# PulseOS — Deployment Guide

## Architecture

| Layer    | Platform | Service            |
|----------|----------|--------------------|
| Frontend | Vercel   | Static (React/Vite)|
| Backend  | Render   | Node.js Web Service|
| Database | Render   | PostgreSQL (free)  |

---

## Environment Variables

### Backend (Render)

| Variable       | Required | Description |
|----------------|----------|-------------|
| `DATABASE_URL` | ✅ Yes   | PostgreSQL connection string — set automatically from Render DB |
| `PORT`         | ✅ Yes   | Port to bind — set automatically by Render |
| `NODE_ENV`     | ✅ Yes   | Set to `production` |
| `CORS_ORIGIN`  | ✅ Yes   | Comma-separated list of allowed frontend origins e.g. `https://yourapp.vercel.app` |

### Frontend (Vercel)

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `VITE_API_URL`  | ✅ Yes   | Full URL of the Render API e.g. `https://pulseos-api.onrender.com` |
| `BASE_PATH`     | ✅ Yes   | Always `/` on Vercel — set in `vercel.json` automatically |

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourname/pulseos.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

### Option A — Blueprint (recommended, uses render.yaml)

1. Go to **[render.com](https://render.com)** → New → **Blueprint**
2. Connect your GitHub repository
3. Render reads `render.yaml` and auto-creates:
   - `pulseos-api` — Node.js web service
   - `pulseos-db` — PostgreSQL database (connection auto-wired)
4. Once deployed, set the remaining environment variable:
   - `CORS_ORIGIN` → *(fill in after Vercel gives you a URL — see Step 3)*
5. Note your Render URL: `https://pulseos-api.onrender.com`

### Option B — Manual

- **Type:** Web Service
- **Runtime:** Node
- **Build Command:**
  ```
  npm i -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
  ```
- **Start Command:**
  ```
  node --enable-source-maps artifacts/api-server/dist/index.mjs
  ```
- **Health Check Path:** `/health`
- **Environment Variables:** See table above

### Seed the database

After first deploy, open the Render **Shell** tab and run:

```bash
psql "$DATABASE_URL" < scripts/seed.sql
```

Or use the Render PostgreSQL dashboard to run the SQL directly.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** → New Project → Import GitHub repo
2. Vercel auto-detects `vercel.json`. Add these **Environment Variables** before deploying:

   | Key            | Value                                    |
   |----------------|------------------------------------------|
   | `VITE_API_URL` | `https://pulseos-api.onrender.com`       |

3. Click **Deploy**
4. Note your Vercel URL: `https://pulseos.vercel.app`

---

## Step 4 — Wire CORS

1. Back on Render → `pulseos-api` → **Environment**
2. Set `CORS_ORIGIN` = `https://pulseos.vercel.app`
3. Render redeploys automatically

---

## Build Commands Reference

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build API server
pnpm --filter @workspace/api-server run build

# Build frontend
BASE_PATH=/ pnpm --filter @workspace/hospital-command run build

# Type-check everything
pnpm run typecheck

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push
```

---

## Health Check Endpoints

| Endpoint       | Response                |
|----------------|-------------------------|
| `GET /health`  | `{ "status": "ok" }`   |
| `GET /api/healthz` | `{ "status": "ok" }` |

---

## Troubleshooting

### Build fails on Vercel with "pnpm not found"
The build command starts with `npm i -g pnpm` to install pnpm before use. If it still fails, add `pnpm` to the Vercel project settings under **General → Node.js version** and enable package manager auto-detection.

### API returns 404 on Vercel
Your frontend is on Vercel (static) and the API is on Render. Make sure `VITE_API_URL` is set to your Render URL, not a relative path.

### CORS errors in the browser
Set `CORS_ORIGIN` on Render to exactly match your Vercel URL (no trailing slash). Example: `https://pulseos.vercel.app`.

### SSE (real-time) not working in production
Render free tier may sleep after inactivity. The SSE hook auto-reconnects every 3 seconds, so it will recover. For persistent connections, upgrade to a paid Render plan.

### Database connection refused
Ensure `DATABASE_URL` is the **Internal** connection string on Render (faster, no SSL required within Render's network). External connection strings require `?sslmode=require`.

### Render free tier cold starts
Render free services spin down after 15 minutes of inactivity. First request after sleep takes ~30 seconds. Upgrade to a paid plan to eliminate cold starts.
