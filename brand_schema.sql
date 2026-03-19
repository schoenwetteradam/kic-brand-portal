create extension if not exists pgcrypto;

create table if not exists brand_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  audience jsonb not null default '[]'::jsonb,
  locations jsonb not null default '[]'::jsonb,
  budget numeric(12,2),
  status text not null default 'draft'
    check (status in ('draft','active','paused','completed')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references brand_campaigns(id) on delete set null,
  title text not null,
  content_type text not null
    check (content_type in ('post','reel','ad','email','sms')),
  platform text not null,
  audience text,
  city text,
  hook text,
  caption text,
  script text,
  cta text,
  hashtags jsonb not null default '[]'::jsonb,
  media_url text,
  status text not null default 'draft'
    check (status in ('idea','draft','approved','scheduled','published','archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  external_post_id text,
  source_prompt jsonb,
  ai_model text,
  generation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_assets_status on content_assets(status);
create index if not exists idx_content_assets_campaign_id on content_assets(campaign_id);
create index if not exists idx_content_assets_scheduled_for on content_assets(scheduled_for);

create table if not exists recruitment_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references brand_campaigns(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role_type text not null,
  specialty text,
  city text,
  source text,
  status text not null default 'new'
    check (status in ('new','contacted','interested','tour_scheduled','interviewed','signed','lost')),
  notes text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recruitment_leads_status on recruitment_leads(status);
create index if not exists idx_recruitment_leads_next_follow_up_at on recruitment_leads(next_follow_up_at);

create table if not exists lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references recruitment_leads(id) on delete cascade,
  interaction_type text not null,
  channel text,
  direction text
    check (direction in ('inbound','outbound','system')),
  subject text,
  message_text text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_interactions_lead_id on lead_interactions(lead_id);
create index if not exists idx_lead_interactions_created_at on lead_interactions(created_at desc);

create table if not exists brand_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  audience text,
  content_type text not null
    check (content_type in ('post','reel','ad','email','sms')),
  platform text,
  prompt_template text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','running','completed','failed')),
  run_at timestamptz not null default now(),
  completed_at timestamptz,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_automation_jobs_status_run_at on automation_jobs(status, run_at);

create table if not exists brand_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  platform text not null,
  campaign_id uuid references brand_campaigns(id) on delete set null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  cost numeric(12,2) not null default 0,
  booked_tours integer not null default 0,
  signed_renters integer not null default 0,
  created_at timestamptz not null default now(),
  unique(metric_date, platform, campaign_id)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brand_campaigns_updated_at on brand_campaigns;
create trigger trg_brand_campaigns_updated_at
before update on brand_campaigns
for each row execute function set_updated_at();

drop trigger if exists trg_content_assets_updated_at on content_assets;
create trigger trg_content_assets_updated_at
before update on content_assets
for each row execute function set_updated_at();

drop trigger if exists trg_recruitment_leads_updated_at on recruitment_leads;
create trigger trg_recruitment_leads_updated_at
before update on recruitment_leads
for each row execute function set_updated_at();

drop trigger if exists trg_brand_templates_updated_at on brand_templates;
create trigger trg_brand_templates_updated_at
before update on brand_templates
for each row execute function set_updated_at();
