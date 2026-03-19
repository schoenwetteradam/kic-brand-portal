"use client";

import { useState } from "react";

type Section = "integrations" | "automation" | "brand";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("integrations");
  const [saved, setSaved] = useState("");

  function showSaved(msg = "Settings saved") {
    setSaved(msg);
    setTimeout(() => setSaved(""), 3000);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-500">
          Configure integrations, automation rules, and brand defaults.
        </p>
      </div>

      {saved && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {saved}
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0 space-y-1">
          {(
            [
              { key: "integrations", label: "Integrations" },
              { key: "automation", label: "Automation" },
              { key: "brand", label: "Brand Defaults" },
            ] as { key: Section; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                activeSection === key
                  ? "bg-slate-900 font-medium text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "integrations" && (
            <IntegrationsSection onSave={showSaved} />
          )}
          {activeSection === "automation" && (
            <AutomationSection onSave={showSaved} />
          )}
          {activeSection === "brand" && (
            <BrandDefaultsSection onSave={showSaved} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Integrations ──────────────────────────────────────────────────────────────

function IntegrationsSection({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SettingsCard title="Pi Backend">
        <p className="mb-4 text-sm text-slate-500">
          Connection to your Pi 5 salon backend. Set these as environment
          variables in Vercel or your{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env.local</code>{" "}
          file.
        </p>
        <EnvVarRow name="PI_BASE_URL" placeholder="http://your-pi-ip:3001" />
        <EnvVarRow name="PI_API_KEY" placeholder="your-api-key" secret />
        <button
          onClick={onSave}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </SettingsCard>

      <SettingsCard title="OpenAI">
        <p className="mb-4 text-sm text-slate-500">
          Required for AI content generation. Used by the Pi backend or
          directly by this portal.
        </p>
        <EnvVarRow name="OPENAI_API_KEY" placeholder="sk-..." secret />
        <button
          onClick={onSave}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </SettingsCard>

      <SettingsCard title="Meta / Instagram / Facebook">
        <p className="mb-4 text-sm text-slate-500">
          Publishing to Instagram and Facebook requires a connected Meta Business
          account.
        </p>
        <EnvVarRow name="META_APP_ID" placeholder="App ID from Meta Developer Console" />
        <EnvVarRow name="META_APP_SECRET" placeholder="App Secret" secret />
        <EnvVarRow name="META_PAGE_ID" placeholder="Your Facebook Page ID" />
        <EnvVarRow name="INSTAGRAM_BUSINESS_ID" placeholder="Instagram Business Account ID" />
        <p className="mt-3 text-xs text-slate-400">
          Meta access tokens are long-lived tokens generated via the Pi backend
          OAuth flow. Store them in your Pi environment, not here.
        </p>
        <button
          onClick={onSave}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </SettingsCard>

      <SettingsCard title="Twilio (SMS)">
        <p className="mb-4 text-sm text-slate-500">
          Enable SMS follow-up for booth-renter leads.
        </p>
        <EnvVarRow name="TWILIO_ACCOUNT_SID" placeholder="ACxxxxxxxxxxxxxxxxx" />
        <EnvVarRow name="TWILIO_AUTH_TOKEN" placeholder="Auth token" secret />
        <EnvVarRow name="TWILIO_FROM_NUMBER" placeholder="+1 (xxx) xxx-xxxx" />
        <button
          onClick={onSave}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </SettingsCard>

      <SettingsCard title="Wix">
        <p className="mb-4 text-sm text-slate-500">
          Connect Wix form submissions to automatically create leads in the
          pipeline.
        </p>
        <EnvVarRow name="WIX_RENTAL_FORM_URL" placeholder="https://your-site.wixsite.com/..." />
        <button
          onClick={onSave}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </SettingsCard>
    </div>
  );
}

// ── Automation ────────────────────────────────────────────────────────────────

function AutomationSection({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState({
    auto_generate_daily: true,
    auto_followup_stale_leads: true,
    followup_after_days: "2",
    auto_post_approved: false,
    weekly_campaign_summary: true,
    instant_lead_response: true,
  });

  return (
    <div className="space-y-6">
      <SettingsCard title="Content Automation">
        <div className="space-y-4">
          <Toggle
            label="Auto-generate content ideas daily"
            description="Generate 3–5 content drafts every morning for review"
            checked={settings.auto_generate_daily}
            onChange={(v) =>
              setSettings((p) => ({ ...p, auto_generate_daily: v }))
            }
          />
          <Toggle
            label="Auto-post approved content"
            description="Automatically publish content once approved (requires platform connections)"
            checked={settings.auto_post_approved}
            onChange={(v) =>
              setSettings((p) => ({ ...p, auto_post_approved: v }))
            }
          />
          <Toggle
            label="Weekly campaign summary"
            description="Send a weekly summary of content performance and upcoming schedule"
            checked={settings.weekly_campaign_summary}
            onChange={(v) =>
              setSettings((p) => ({ ...p, weekly_campaign_summary: v }))
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Lead Automation">
        <div className="space-y-4">
          <Toggle
            label="Instant response to new leads"
            description="Send an automatic first-response message to new inquiries"
            checked={settings.instant_lead_response}
            onChange={(v) =>
              setSettings((p) => ({ ...p, instant_lead_response: v }))
            }
          />
          <Toggle
            label="Follow up stale leads"
            description="Automatically follow up with leads who haven't responded"
            checked={settings.auto_followup_stale_leads}
            onChange={(v) =>
              setSettings((p) => ({
                ...p,
                auto_followup_stale_leads: v,
              }))
            }
          />
          {settings.auto_followup_stale_leads && (
            <div className="ml-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Follow up after (days of no response)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={settings.followup_after_days}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    followup_after_days: e.target.value,
                  }))
                }
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      </SettingsCard>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">Approval-only actions</p>
        <p className="mt-1 text-sm text-amber-700">
          The following actions always require manual approval regardless of
          automation settings: public comment responses, paid ad launches, custom
          DMs to new contacts, and negative review replies. This protects your
          brand.
        </p>
      </div>

      <button
        onClick={onSave}
        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Save Automation Settings
      </button>
    </div>
  );
}

// ── Brand Defaults ────────────────────────────────────────────────────────────

function BrandDefaultsSection({ onSave }: { onSave: () => void }) {
  const [brand, setBrand] = useState({
    salon_name: "Keeping It Cute",
    default_location: "Dodge County, WI",
    service_areas: "Juneau, Beaver Dam, Watertown, Dodge County",
    default_cta: "DM us 'BOOTH' or apply through the link in bio",
    default_tone: "Warm and welcoming",
    instagram_handle: "@keepingitcutesalon",
    facebook_page: "Keeping It Cute Salon",
  });

  return (
    <div className="space-y-6">
      <SettingsCard title="Salon Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Salon Name"
            value={brand.salon_name}
            onChange={(v) => setBrand((p) => ({ ...p, salon_name: v }))}
          />
          <FormField
            label="Default Location"
            value={brand.default_location}
            onChange={(v) => setBrand((p) => ({ ...p, default_location: v }))}
          />
          <div className="sm:col-span-2">
            <FormField
              label="Service Areas (comma-separated)"
              value={brand.service_areas}
              onChange={(v) => setBrand((p) => ({ ...p, service_areas: v }))}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Content Defaults">
        <div className="grid gap-4">
          <FormField
            label="Default CTA"
            value={brand.default_cta}
            onChange={(v) => setBrand((p) => ({ ...p, default_cta: v }))}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Default Tone
            </label>
            <select
              value={brand.default_tone}
              onChange={(e) =>
                setBrand((p) => ({ ...p, default_tone: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              {[
                "Warm and welcoming",
                "Aspirational and empowering",
                "Direct and professional",
                "Fun and energetic",
                "Conversational and personal",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Social Handles">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Instagram Handle"
            value={brand.instagram_handle}
            onChange={(v) =>
              setBrand((p) => ({ ...p, instagram_handle: v }))
            }
          />
          <FormField
            label="Facebook Page Name"
            value={brand.facebook_page}
            onChange={(v) => setBrand((p) => ({ ...p, facebook_page: v }))}
          />
        </div>
      </SettingsCard>

      <button
        onClick={onSave}
        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Save Brand Defaults
      </button>
    </div>
  );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function EnvVarRow({
  name,
  placeholder,
  secret,
}: {
  name: string;
  placeholder: string;
  secret?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-mono text-slate-500 mb-1">
        {name}
      </label>
      <input
        type={secret ? "password" : "text"}
        placeholder={placeholder}
        readOnly
        value=""
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
      />
      <p className="mt-1 text-xs text-slate-400">
        Set via Vercel environment variables or{" "}
        <code className="font-mono">.env.local</code>
      </p>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`shrink-0 h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-200"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}
