# KIC Brand Portal

Brand and recruiting workspace for Keeping It Cute Salon & Spa.

- **Dashboard** — recruiting KPIs, salon ops, pipeline stages
- **Content Studio** — AI-generated posts, scripts, ad copy
- **Campaigns & Leads** — booth-renter recruiting pipeline

## Docs

- [Data sources & AI content](docs/data-sources-and-ai.md) — where metrics come from, how to use AI generation
- [Pi deployment](docs/pi-deploy.md) — Raspberry Pi setup for Brand API

## Quick start

1. Deploy to Vercel, set `PI_BASE_URL`, `PI_API_KEY`
2. Run Brand API on Pi (see docs)
3. Add leads and campaigns to see dashboard data
4. Set `OPENAI_API_KEY` on Pi or Vercel for AI content generation
