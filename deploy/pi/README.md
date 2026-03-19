# Pi Deployment

Use the salon Pi as the always-on automation layer for KIC Brand Portal.

## What Should Live On The Pi

- `server/brand/server.js`
- `server/brand/db.js`
- `server/brand/middleware_api_key.js`
- `server/brand/openai_brand.js`
- `server/brand/routes_brand.js`
- `server/brand/worker_brand_daily.js`
- `server/brand/worker_brand_autonomy.js`
- `brand_schema.sql`
- `package.json`
- `package-lock.json`

## Recommended Pi Folder

Use a folder such as:

`/opt/kic-brand-portal`

## Required Setup

1. Install Node.js 20+
2. Install PostgreSQL or point `DATABASE_URL` at an existing Postgres instance
3. Copy the repo or the files above to the Pi
4. Run `npm install`
5. Apply `brand_schema.sql` to the Pi database
6. Create a `.env` file from `.env.pi.example`
7. Install the systemd services in this folder

## Useful Commands

Copy repo contents to the Pi:

```bash
scp -r ./server ./brand_schema.sql ./package.json ./package-lock.json pi@YOUR_PI_IP:/opt/kic-brand-portal/
```

Apply database schema:

```bash
psql "$DATABASE_URL" -f /opt/kic-brand-portal/brand_schema.sql
```

Install dependencies:

```bash
cd /opt/kic-brand-portal
npm install
```

Install services:

```bash
sudo cp deploy/pi/kic-brand-api.service /etc/systemd/system/
sudo cp deploy/pi/kic-brand-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kic-brand-api
sudo systemctl enable --now kic-brand-worker
```

## What The Pi Handles

- long-running automation
- lead follow-up jobs
- content batch generation
- queue processing from `automation_jobs`
- agent task processing from `agent_tasks`
- internal API endpoints for the Vercel portal
