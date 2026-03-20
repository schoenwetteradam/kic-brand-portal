# Data Sources & AI Content Generation

How the Brand Portal gets its data and how to use AI content generation.

---

## Dashboard Data Sources

### 1. Booth Renter Recruiting (KPIs + Pipeline)

**Source:** Pi Brand API → `DATABASE_URL` (PostgreSQL, `keepingitcute` DB)

**Tables:**
- `recruitment_leads` — new leads, tours booked, signed renters, pipeline stage counts
- `brand_campaigns` — active campaigns
- `content_assets` — drafts (pending approvals), scheduled posts

**To see real data:**
1. Add leads in **Leads** (or via your BOOTH form → webhook into `recruitment_leads`)
2. Create campaigns in **Campaigns**
3. Generate content and save as drafts in **Content**

No extra integrations needed if your Pi has `DATABASE_URL` pointing at the brand DB with `brand_schema.sql` applied.

---

### 2. Salon Operations (Bookings, Revenue, Top Services, Low Stock)

**Source:** Pi Brand API → Wix Staff Backend (`GET /internal/ops/summary`)

**Required on Pi `.env`:**
```env
WIX_STAFF_API_BASE_URL=http://127.0.0.1:3000
WIX_STAFF_API_TOKEN=your_staff_backend_internal_token
```

**Wix Staff Backend must implement:**
```http
GET /internal/ops/summary
Authorization: Bearer <WIX_STAFF_API_TOKEN>
```

**Expected JSON shape (flexible key names):**
```json
{
  "bookings_7d": 42,
  "revenue_7d": 1250.50,
  "new_customers_7d": 8,
  "top_services": [
    { "service_name": "Haircut", "bookings_30d": 120 },
    { "name": "Color", "bookings": 45 }
  ],
  "low_stock": [
    { "product_name": "Shampoo X", "qty_on_hand": 2 },
    { "name": "Conditioner", "quantity": 1 }
  ]
}
```

**Alternatives if you don’t have Wix Staff Backend:**
- **Option A:** Add `GET /internal/ops/summary` to your staff app and return the above shape
- **Option B:** Use a second DB (`DATABASE_URL_STAFF`) with `bookings`, `inventory_products`-style tables and extend `salon_dashboard_routes.js` to query them as a fallback

If the Wix endpoint is missing or fails, the dashboard still loads and shows zeros for salon ops.

---

## AI Content Generation

### How to use it

1. Go to **Content** → **Generate** tab.
2. Fill in:
   - Content type (post, reel script, ad copy, etc.)
   - Platform (Instagram, TikTok, etc.)
   - Target audience (cosmetologists, estheticians, etc.)
   - Location, theme, tone, CTA, optional offer
3. Click **Generate Content**.
4. Copy the output or **Save Draft**.
5. In **Drafts**, approve or schedule content.

### Where generation runs

**Priority 1 – Pi Brand API** (if `PI_BASE_URL` and `PI_API_KEY` are set in Vercel):

- Portal calls Pi → `POST /brand/content/generate`
- Pi uses `OPENAI_API_KEY` from its `.env`
- Best option: Pi has your OpenAI key, keeps it off Vercel

**Priority 2 – Vercel direct OpenAI** (if Pi fails or isn’t configured):

- Portal calls OpenAI from Vercel
- Needs `OPENAI_API_KEY` in Vercel env
- Fallback when Pi isn’t available

**Priority 3 – Template fallback** (no OpenAI key anywhere):

- Returns generic brand templates
- No AI; predictable, reusable copy

### OpenAI key setup

**Option A – Pi only (recommended)**

- Add `OPENAI_API_KEY=sk-...` to `/opt/kic-brand-portal/.env` on the Pi
- No OpenAI key in Vercel
- Portal → Pi → OpenAI

**Option B – Vercel only**

- Add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables
- Portal uses OpenAI when Pi call fails
- Pi does not need an OpenAI key

**Option C – Both**

- Pi and Vercel both have keys
- Pi is tried first; Vercel used as fallback

### Model

- Pi `/brand/content/generate` uses `OPENAI_MODEL` from Pi `.env` (default `gpt-5`; you may use `gpt-4o-mini` or `gpt-4o`)
- Vercel fallback uses `gpt-4o-mini` in code

---

## Wix custom app on your site — can the portal read it?

**No — not automatically.** The Brand Portal does not connect to the Wix site or to a Wix “custom app” in the dashboard by itself.

What actually happens:

1. **Brand Portal (Vercel)** → calls your **Pi Brand API** over HTTPS.
2. **Pi Brand API** → calls **your** `wix-staff-backend` at `GET /internal/ops/summary` (same machine or Docker).
3. **That backend** is where you add code to pull data from Wix (or from your own DB that you sync from Wix).

So anything you see in the dashboard for **salon operations** is only what **you** return from `ops/summary`. Typical ways to feed it:

- **Wix REST / Headless APIs** (bookings, CRM, etc., where your plan and APIs allow).
- **Webhooks** (e.g. form submissions → your DB → aggregate in `ops/summary`).
- **Velo** HTTP functions that your staff backend calls (with secrets).
- **Your own Postgres** on the Pi that you fill from exports, Zapier, or nightly jobs.

The Wix app installed on the public site is for visitors/admins in Wix; it does **not** expose data to the portal unless you build the bridge (staff backend + APIs or DB).

---

## Quick checklist

| What you want                 | What to do                                                |
|------------------------------|-----------------------------------------------------------|
| Recruiting KPIs & pipeline   | Add leads/campaigns/content in the portal; Pi `DATABASE_URL` set |
| Salon bookings & inventory   | Implement `GET /internal/ops/summary` on Wix staff backend |
| AI-generated content         | Set `OPENAI_API_KEY` on Pi or Vercel                      |
| Weekly automated ideas       | Vercel cron + `CRON_SECRET`; Pi has OpenAI key            |
