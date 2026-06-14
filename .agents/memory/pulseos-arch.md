---
name: PulseOS Hospital Command Center Architecture
description: Core architecture decisions for the PulseOS AIIMS hospital management app
---

## Stack
- Frontend: React + Vite (port 24499, previewPath `/`)
- Backend: Express 5 (port 8080, previewPath `/api`)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- API contract: OpenAPI → Orval codegen → `@workspace/api-zod` (Zod schemas) + `@workspace/api-client-react` (React Query hooks)
- Real-time: SSE via `/api/events` endpoint, `subscribe()` + `broadcast()` in `artifacts/api-server/src/lib/broadcast.ts`

## Domain Context
- Hospital: AIIMS New Delhi, OPD Block B, Sector 12, Ansari Nagar
- ABHA IDs format: XX-XXXX-XXXX-XXXX (Ayushman Bharat Health Account)
- Patient journey steps: registered → records_uploaded → ai_analyzed → doctor_assigned → completed
- Priority levels: normal / urgent / emergency (emergency shows Protocol ALPHA banner)

## Real-time Push (SSE)
- Route: GET /api/events (text/event-stream)
- After any mutation in patients/doctors/queue routes, call `broadcast("queue_updated", data)`
- Frontend `useRealtime` hook in `src/hooks/useRealtime.ts` — auto-reconnects, invalidates React Query cache

**Why:** SSE chosen over WebSocket — works reliably through Replit reverse proxy without upgrade negotiation.

## Key DB Fields (patients table)
`abhaId`, `nameHindi`, `phone`, `bloodGroup`, `village`, `district`, `referredBy`, `journeyStep`, `aiSummary`

## Key DB Fields (doctors table)
`qualification`, `registrationNo`

## Seed Data
6 Indian-named doctors (AIIMS qualifications, DMC registration numbers), 6 patients with ABHA IDs and North Delhi locations, 8 activity events, 5 AI insights. Re-seed via SQL TRUNCATE + INSERT.

## Layout
`useRealtime()` is called in `layout.tsx` so it runs globally across all pages (not just dashboard).
