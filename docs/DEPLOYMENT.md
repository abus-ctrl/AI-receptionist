# Wonderland Deployment Guide (Free-First Stack)

This guide documents deploying the Wonderland Arcade Management System to a 100% free production tier using **Cloudflare Pages** (frontend) and **Supabase** (PostgreSQL database & Auth).

---

## Architecture Stack

- **Frontend**: Vite + React 19 + TypeScript deployed to Cloudflare Pages.
- **Backend / DB**: Supabase PostgreSQL with Row Level Security (RLS) policies.
- **Cost**: $0.00/month under standard free tier limits.

---

## 1. Supabase Project Setup

1. Create a free Supabase project at [https://supabase.com](https://supabase.com).
2. Choose a region closest to India (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
3. In the Supabase SQL Editor, run the migration scripts provided in:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_and_functions.sql`
4. Copy the following keys from **Project Settings > API**:
   - `Project URL`
   - `anon public key`
5. Set these in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## 2. Cloudflare Pages Deployment

1. Push this repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages > Create application > Pages**.
3. Connect your repository.
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_TIMEZONE` = `Asia/Kolkata`
6. Click **Save and Deploy**.

---

## 3. Database Backup & Disaster Recovery

- **In-App Backup**: The Settings tab provides a 1-click **Export Full System Snapshot (JSON)**. This downloads all customers, visits, active sessions, historical invoices, and logs.
- **Restoration**: The Settings tab includes a **Restore Snapshot** upload tool that verifies schema integrity before applying.
- **PostgreSQL Cloud Backup**: Supabase free tier includes daily point-in-time metadata. Run `pg_dump` locally or scheduled via GitHub Actions for automated off-site backups:
  ```bash
  pg_dump -h db.your-ref.supabase.co -U postgres -d postgres > wonderland_backup.sql
  ```

---

## 4. Free-Tier Limits & Monitoring

| Service | Free Tier Limit | Wonderland Daily Consumption |
|:---|:---|:---|
| Cloudflare Pages | Unlimited requests & bandwidth | < 1,000 requests/day |
| Supabase Database | 500 MB PostgreSQL storage | ~ 5 MB / month (years of data) |
| Supabase Egress | 2 GB / month | ~ 50 MB / month |
| Supabase Auth | 50,000 monthly active users | < 10 staff members |
