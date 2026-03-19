"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "@/src/lib/app-settings";

type Section = "integrations" | "automation" | "brand";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("integrations");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("env");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load settings.");
      }

      const data = await res.json();
      setSettings(data.settings ?? DEFAULT_APP_SETTINGS);
      setProvider(data.provider ?? "env");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setSaved("");
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Could not save settings.");
      }

      setSaved("Settings saved");
      setProvider(data.provider ?? "supabase");
      setTimeout(() => setSaved(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  function setIntegrationField<K extends keyof AppSettings["integrations"]>(
    key: K,
    value: AppSettings["integrations"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [key]: value,
      },
    }));
  }

  function setAutomationField<K extends keyof AppSettings["automation"]>(
    key: K,
    value: AppSettings["automation"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      automation: {
        ...prev.automation,
        [key]: value,
      },
    }));
  }

  function setBrandField<K extends keyof AppSettings["brand"]>(
    key: K,
    value: AppSettings["brand"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        [key]: value,
      },
    }));
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Operational Settings</h1>
          <p className="mt-1 text-slate-500">
            Configure the recruiting agent, brand defaults, and the systems that make autonomy possible.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Settings provider: <span className="font-semibold capitalize">{provider}</span>
        </div>
      </div>

      {loading && <p className="mb-6 text-sm text-slate-400">Loading settings...</p>}

      {saved && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {saved}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-1">
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

        <div className="min-w-0 flex-1 space-y-6">
          {activeSection === "integrations" && (
            <>
              <SettingsCard title="Pi Backend">
                <p className="mb-4 text-sm text-slate-500">
                  This is the always-on salon worker environment. Vercel should call into the Pi for long-running automation.
                </p>
                <FormField
                  label="PI Base URL"
                  value={settings.integrations.pi_base_url}
                  onChange={(value) => setIntegrationField("pi_base_url", value)}
                  placeholder="https://your-pi-api-domain"
                />
                <FormField
                  label="PI API Key"
                  value={settings.integrations.pi_api_key}
                  onChange={(value) => setIntegrationField("pi_api_key", value)}
                  placeholder="long internal API key"
                  secret
                />
              </SettingsCard>

              <SettingsCard title="Other Integrations">
                <Toggle
                  label="OpenAI enabled"
                  description="Allow the portal and agent API routes to use OpenAI."
                  checked={settings.integrations.openai_enabled}
                  onChange={(value) => setIntegrationField("openai_enabled", value)}
                />
                <div className="mt-4 grid gap-4">
                  <FormField
                    label="Twilio From Number"
                    value={settings.integrations.twilio_from_number}
                    onChange={(value) => setIntegrationField("twilio_from_number", value)}
                    placeholder="+1..."
                  />
                  <FormField
                    label="Wix Rental Form URL"
                    value={settings.integrations.wix_rental_form_url}
                    onChange={(value) => setIntegrationField("wix_rental_form_url", value)}
                    placeholder="https://your-site/.../rental-form"
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === "automation" && (
            <>
              <SettingsCard title="Autonomous Recruiting Rules">
                <div className="space-y-4">
                  <Toggle
                    label="Auto-generate daily recruiting content"
                    description="Create a batch of recruiting drafts each day."
                    checked={settings.automation.auto_generate_daily}
                    onChange={(value) => setAutomationField("auto_generate_daily", value)}
                  />
                  <Toggle
                    label="Instant response to new leads"
                    description="Send an immediate first-touch response once a lead comes in."
                    checked={settings.automation.instant_lead_response}
                    onChange={(value) => setAutomationField("instant_lead_response", value)}
                  />
                  <Toggle
                    label="Follow up stale leads"
                    description="Automatically follow up when a lead has gone quiet."
                    checked={settings.automation.auto_followup_stale_leads}
                    onChange={(value) => setAutomationField("auto_followup_stale_leads", value)}
                  />
                  <Toggle
                    label="Require manager approval"
                    description="Keep publishing and outbound messaging behind approval gates."
                    checked={settings.automation.require_manager_approval}
                    onChange={(value) => setAutomationField("require_manager_approval", value)}
                  />
                  <Toggle
                    label="Auto-post approved content"
                    description="Allow approved content to move directly into the publishing queue."
                    checked={settings.automation.auto_post_approved}
                    onChange={(value) => setAutomationField("auto_post_approved", value)}
                  />
                  <Toggle
                    label="Weekly campaign summary"
                    description="Generate a weekly manager report on recruiting performance."
                    checked={settings.automation.weekly_campaign_summary}
                    onChange={(value) => setAutomationField("weekly_campaign_summary", value)}
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Automation Thresholds">
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Follow up after days"
                    value={settings.automation.followup_after_days}
                    onChange={(value) => setAutomationField("followup_after_days", value)}
                    min={1}
                    max={30}
                  />
                  <NumberField
                    label="Daily content goal"
                    value={settings.automation.daily_content_goal}
                    onChange={(value) => setAutomationField("daily_content_goal", value)}
                    min={1}
                    max={20}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === "brand" && (
            <>
              <SettingsCard title="Salon Identity">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Salon Name"
                    value={settings.brand.salon_name}
                    onChange={(value) => setBrandField("salon_name", value)}
                  />
                  <FormField
                    label="Default Location"
                    value={settings.brand.default_location}
                    onChange={(value) => setBrandField("default_location", value)}
                  />
                </div>
                <div className="mt-4">
                  <FormField
                    label="Service Areas"
                    value={settings.brand.service_areas}
                    onChange={(value) => setBrandField("service_areas", value)}
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Brand Messaging">
                <div className="grid gap-4">
                  <FormField
                    label="Default Call To Action"
                    value={settings.brand.default_cta}
                    onChange={(value) => setBrandField("default_cta", value)}
                  />
                  <FormField
                    label="Default Tone"
                    value={settings.brand.default_tone}
                    onChange={(value) => setBrandField("default_tone", value)}
                  />
                  <FormField
                    label="Instagram Handle"
                    value={settings.brand.instagram_handle}
                    onChange={(value) => setBrandField("instagram_handle", value)}
                  />
                  <FormField
                    label="Facebook Page"
                    value={settings.brand.facebook_page}
                    onChange={(value) => setBrandField("facebook_page", value)}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={saveSettings}
              disabled={saving || loading}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={() => void loadSettings()}
              disabled={saving || loading}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
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
  onChange: (value: boolean) => void;
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
        className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-200"
        }`}
      >
        <span
          className={`mx-1 block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
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
  placeholder,
  secret = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type={secret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}
