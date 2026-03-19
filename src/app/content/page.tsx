"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type {
  ContentType,
  GenerateContentRequest,
  GenerateContentResponse,
  Platform,
  RoleType,
} from "@/src/types/brand";

// ── Label maps ────────────────────────────────────────────────────────────────

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

// ── Default form state ────────────────────────────────────────────────────────

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

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "generate" | "drafts" | "approved" | "scheduled";

function ContentStudioInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) ?? "generate";

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
        body: JSON.stringify({ ...result, approval_status: "pending" }),
      });
      if (!res.ok) throw new Error("Save failed");
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

  const TABS: { key: Tab; label: string }[] = [
    { key: "generate", label: "Generate" },
    { key: "drafts", label: "Drafts" },
    { key: "approved", label: "Approved" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Content Studio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Generate Recruiting Content
        </h1>
        <p className="mt-1 text-slate-500">
          Create posts, scripts, ad copy, and more for booth-renter recruiting.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
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

      {/* Generate tab */}
      {activeTab === "generate" && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Content Type
                </label>
                <select
                  value={form.content_type}
                  onChange={(e) =>
                    setField("content_type", e.target.value as ContentType)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {CONTENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Platform
                </label>
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setField("platform", e.target.value as Platform)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {PLATFORMS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={form.audience}
                  onChange={(e) =>
                    setField("audience", e.target.value as RoleType)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {AUDIENCES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
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
                  {DEFAULT_LOCATIONS.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Campaign Theme
                </label>
                <select
                  value={form.theme}
                  onChange={(e) => setField("theme", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {THEMES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Tone
                </label>
                <select
                  value={form.tone}
                  onChange={(e) => setField("tone", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Call to Action
              </label>
              <input
                type="text"
                value={form.cta}
                onChange={(e) => setField("cta", e.target.value)}
                placeholder="e.g. DM us 'BOOTH' or apply through the link in bio"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Special Offer{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.offer}
                onChange={(e) => setField("offer", e.target.value)}
                placeholder="e.g. First month 10% off for new renters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

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

          {/* Result */}
          <div>
            {result ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {result.content_type.replace(/_/g, " ")} ·{" "}
                      {result.platform}
                    </p>
                    <h3 className="mt-1 font-semibold">{result.title}</h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleCopy}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Save Draft
                    </button>
                  </div>
                </div>

                {savedMsg && (
                  <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {savedMsg}
                  </p>
                )}

                {result.script ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Script
                    </p>
                    <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                      {result.script}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Caption
                    </p>
                    <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                      {result.caption}
                    </pre>
                  </div>
                )}

                {result.hashtags.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Hashtags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    CTA
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{result.cta}</p>
                </div>
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

      {/* Drafts / Approved / Scheduled tabs */}
      {(activeTab === "drafts" ||
        activeTab === "approved" ||
        activeTab === "scheduled") && (
        <ContentList status={activeTab} />
      )}
    </div>
  );
}

function ContentList({ status }: { status: string }) {
  const [items, setItems] = useState<GenerateContentResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setLoaded(true);
    }
  }

  if (!loaded && !loading) {
    load();
  }

  const statusLabel: Record<string, string> = {
    drafts: "Pending Approval",
    approved: "Approved",
    scheduled: "Scheduled",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {statusLabel[status] ?? status} content
        </p>
        <button
          onClick={load}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-sm text-slate-400">Loading...</p>
      )}

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!loading && loaded && items.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">No {status} content yet.</p>
            <button
              onClick={() => {
                const tab = document.querySelector(
                  '[data-tab="generate"]'
                ) as HTMLButtonElement;
                tab?.click();
              }}
              className="mt-3 text-xs font-medium text-slate-600 underline underline-offset-2"
            >
              Generate some content
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const id = (item as unknown as Record<string, unknown>).id as string | undefined;
          const Wrapper = id ? 'a' : 'div';
          return (
            <Wrapper
              key={id ?? i}
              {...(id ? { href: `/content/${id}` } : {})}
              className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {item.content_type?.replace(/_/g, " ")} · {item.platform}
              </p>
              <h3 className="mt-1 font-semibold text-sm">{item.title}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                {item.caption || item.script}
              </p>
            </Wrapper>
          );
        })}
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
