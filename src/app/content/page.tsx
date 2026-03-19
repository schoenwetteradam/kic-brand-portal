"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type {
  ContentAsset,
  ContentType,
  GenerateContentRequest,
  GenerateContentResponse,
  Platform,
  RoleType,
} from "@/src/types/brand";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "post", label: "Social Post" },
  { value: "reel_script", label: "Reel / Short Script" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email_template", label: "Email Template" },
  { value: "dm_template", label: "DM Template" },
  { value: "landing_page_copy", label: "Landing Page Copy" },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google_business", label: "Google Business" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

const AUDIENCES: { value: RoleType; label: string }[] = [
  { value: "cosmetologist", label: "Cosmetologists" },
  { value: "esthetician", label: "Estheticians" },
  { value: "massage_therapist", label: "Massage Therapists" },
  { value: "lash_artist", label: "Lash Artists" },
  { value: "nail_tech", label: "Nail Technicians" },
  { value: "general", label: "All Beauty Pros" },
];

const THEMES = [
  "private suite",
  "be your own boss",
  "grow your clientele",
  "upscale environment",
  "community and culture",
  "flexible lease",
];

const TONES = [
  "Warm and welcoming",
  "Aspirational and empowering",
  "Direct and professional",
  "Fun and energetic",
  "Conversational and personal",
];

const DEFAULT_LOCATIONS = [
  "Juneau, WI",
  "Beaver Dam, WI",
  "Watertown, WI",
  "Dodge County, WI",
];

const DEFAULT_FORM: GenerateContentRequest = {
  content_type: "post",
  platform: "instagram",
  audience: "cosmetologist",
  location: "Dodge County, WI",
  tone: "Warm and welcoming",
  theme: "private suite",
  cta: "DM us 'BOOTH' or apply through the link in bio",
  offer: "",
};

type Tab = "generate" | "drafts" | "approved" | "scheduled";

function ContentStudioInner() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = (requestedTab === "drafts" || requestedTab === "approved" || requestedTab === "scheduled"
    ? requestedTab
    : "generate") as Tab;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [form, setForm] = useState<GenerateContentRequest>(DEFAULT_FORM);
  const [result, setResult] = useState<GenerateContentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function setField<K extends keyof GenerateContentRequest>(
    key: K,
    value: GenerateContentRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      const data: GenerateContentResponse = await res.json();
      setResult(data);
      setSavedMsg(data.id ? "Draft saved to Pi backend" : "Generated locally");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!result) return;
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...result, approval_status: "draft" }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved: ContentAsset = await res.json();
      setResult((prev) =>
        prev
          ? {
              ...prev,
              id: saved.id,
              approval_status: saved.approval_status,
              created_at: saved.created_at,
            }
          : prev
      );
      setSavedMsg("Saved to drafts");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setSavedMsg("Could not save — check Pi connection");
      setTimeout(() => setSavedMsg(""), 4000);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = result.script
      ? result.script
      : `${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "generate", label: "Generate" },
    { key: "drafts", label: "Drafts" },
    { key: "approved", label: "Approved" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Content Studio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Generate Recruiting Content
        </h1>
        <p className="mt-1 text-slate-500">
          Create posts, scripts, ad copy, then approve or schedule them from the same screen.
        </p>
      </div>

      <div className="mb-8 flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            data-tab={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Content Type"
                value={form.content_type}
                onChange={(value) => setField("content_type", value as ContentType)}
                options={CONTENT_TYPES}
              />
              <SelectField
                label="Platform"
                value={form.platform}
                onChange={(value) => setField("platform", value as Platform)}
                options={PLATFORMS}
              />
              <SelectField
                label="Target Audience"
                value={form.audience}
                onChange={(value) => setField("audience", value as RoleType)}
                options={AUDIENCES}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  list="location-options"
                  placeholder="e.g. Dodge County, WI"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
                <datalist id="location-options">
                  {DEFAULT_LOCATIONS.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </div>

              <SelectField
                label="Campaign Theme"
                value={form.theme}
                onChange={(value) => setField("theme", value)}
                options={THEMES.map((value) => ({
                  value,
                  label: value.charAt(0).toUpperCase() + value.slice(1),
                }))}
              />
              <SelectField
                label="Tone"
                value={form.tone}
                onChange={(value) => setField("tone", value)}
                options={TONES.map((value) => ({ value, label: value }))}
              />
            </div>

            <TextField
              label="Call to Action"
              value={form.cta}
              onChange={(value) => setField("cta", value)}
              placeholder="e.g. DM us 'BOOTH' or apply through the link in bio"
            />

            <TextField
              label="Special Offer"
              value={form.offer || ""}
              onChange={(value) => setField("offer", value)}
              placeholder="e.g. First month 10% off for new renters"
              optional
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Content"}
            </button>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </form>

          <div>
            {result ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {result.content_type.replace(/_/g, " ")} · {result.platform}
                    </p>
                    <h3 className="mt-1 font-semibold">{result.title}</h3>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={handleCopy}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    {!result.id && (
                      <button
                        onClick={handleSaveDraft}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                      >
                        Save Draft
                      </button>
                    )}
                  </div>
                </div>

                {savedMsg && (
                  <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {savedMsg}
                  </p>
                )}

                <ContentPreview result={result} />
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-400">
                  Fill out the form and click Generate to create content.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === "drafts" || activeTab === "approved" || activeTab === "scheduled") && (
        <ContentList status={activeTab} onSwitchTab={setActiveTab} />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
    </div>
  );
}

function ContentPreview({ result }: { result: GenerateContentResponse }) {
  return (
    <>
      {result.script ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Script</p>
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {result.script}
          </pre>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Caption</p>
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {result.caption}
          </pre>
        </div>
      )}

      {result.hashtags.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Hashtags</p>
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">CTA</p>
        <p className="mt-0.5 text-sm text-slate-700">{result.cta}</p>
      </div>
    </>
  );
}

function ContentList({
  status,
  onSwitchTab,
}: {
  status: Exclude<Tab, "generate">;
  onSwitchTab: (tab: Tab) => void;
}) {
  const [items, setItems] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [scheduleById, setScheduleById] = useState<Record<string, string>>({});

  const statusLabel = useMemo(
    () => ({ drafts: "Draft", approved: "Approved", scheduled: "Scheduled" }),
    []
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content?status=${status}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(data);
    } catch {
      setError("Could not load content. Check your Pi connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function approveItem(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/content/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Could not approve content.");
    } finally {
      setSavingId("");
    }
  }

  async function scheduleItem(id: string) {
    const scheduled_for = scheduleById[id];
    if (!scheduled_for) {
      setError("Choose a schedule date and time first.");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/content/${id}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduled_for: new Date(scheduled_for).toISOString() }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Could not schedule content.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{statusLabel[status]} content</p>
        <button onClick={load} className="text-xs text-slate-500 hover:text-slate-800">
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      {error && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">No {status} content yet.</p>
            <button
              onClick={() => onSwitchTab("generate")}
              className="mt-3 text-xs font-medium text-slate-600 underline underline-offset-2"
            >
              Generate some content
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {item.content_type.replace(/_/g, " ")} · {item.platform}
                </p>
                <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
                {item.approval_status}
              </span>
            </div>

            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-500">
              {item.caption || item.script}
            </p>

            {item.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.hashtags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {status === "drafts" && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Schedule for
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleById[item.id] || ""}
                    onChange={(e) =>
                      setScheduleById((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveItem(item.id)}
                    disabled={savingId === item.id}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => scheduleItem(item.id)}
                    disabled={savingId === item.id}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            {status === "approved" && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Schedule approved content
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={scheduleById[item.id] || ""}
                    onChange={(e) =>
                      setScheduleById((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => scheduleItem(item.id)}
                    disabled={savingId === item.id}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            {status === "scheduled" && item.scheduled_for && (
              <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Scheduled for {new Date(item.scheduled_for).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense>
      <ContentStudioInner />
    </Suspense>
  );
}
