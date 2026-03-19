# KIC Brand Portal

KIC Brand Portal is the recruiting and marketing workspace for Keeping It cUte Salon & Spa.

The long-term goal is not just a dashboard. It is an autonomous AI growth system that can:
- attract new booth-rental leads,
- help convert those leads into tours and signed renters,
- generate and schedule recruiting content,
- give salon managers and admins a direct way to guide or approve the agent.

## Current Product Shape

This repo currently contains:
- a Next.js portal intended for Vercel,
- recruiting content, campaign, and lead workflows,
- Pi-facing adapters for salon and recruiting data,
- a new in-app Agent Console for manager/admin interaction,
- API-backed settings persistence scaffolding for Vercel via Supabase,
- Pi deployment artifacts for always-on automation workers.

This repo does **not** yet contain a fully autonomous lead-sourcing engine. That still requires Pi-side services and real platform integrations.

## Recommended Architecture

### Vercel

Use Vercel for:
- the Next.js admin portal,
- agent interaction UI,
- lightweight API routes,
- content generation and orchestration entrypoints,
- cron triggers for simple schedules,
- settings persistence through a hosted data store such as Supabase.

### Salon Pi

Use the salon Pi for:
- always-on background workers,
- lead follow-up automation,
- social publishing connectors,
- local integrations with salon systems,
- queue processing and long-running agent tasks,
- secure storage of internal service credentials where needed.

## Agent Capabilities We Should Build Toward

1. Lead sourcing and research
2. Competitor and market monitoring
3. Content generation and approval workflows
4. Scheduled publishing
5. Automated lead response and follow-up
6. Manager/admin command center with approvals
7. Revenue reporting tied to renter conversions

## Running Locally

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Configure the Vercel-side environment values
4. Run `npm run dev`

If you want the Pi-backed features to work, you also need the Pi API, database, and keys configured.

## Environment Variables

See [`.env.example`](C:\Users\schoe\OneDrive\Documents\New project\kic-brand-portal\.env.example) for the current environment placeholders.

If you want Vercel-side settings persistence, apply [`vercel_supabase_schema.sql`](C:\Users\schoe\OneDrive\Documents\New project\kic-brand-portal\vercel_supabase_schema.sql) to Supabase and configure:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Next Build Notes

This clone did not include installed dependencies, so `next` and `eslint` were unavailable until `npm install` is run.

## Suggested Next Build Phases

1. Finish Vercel-ready admin experience
2. Add real settings persistence
3. Add agent memory and command execution
4. Add Pi worker queue and publishing integrations
5. Add autonomous lead-research and outreach pipelines
