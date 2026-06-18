# ReelCRM deployment

## Backend — Render

- Root directory: `backend`
- Build command: `npm ci && npm run db:init`
- Start command: `npm start`
- Health check: `/health`
- Environment variables:
  - `NODE_ENV=production`
  - `DATABASE_URL=<PostgreSQL connection string>`
  - `JWT_SECRET=<long random secret>`
  - `FRONTEND_URL=<Vercel production URL>`

## Frontend — Vercel

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://<render-service>.onrender.com/api`

## Database

`npm run db:init` applies `backend/db/schema.sql`. It is safe to run again because the schema uses
`CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
