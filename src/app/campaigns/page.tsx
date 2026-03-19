"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Campaign, CampaignStatus, RoleType } from "@/src/types/brand";

const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "cosmetologist", label: "Cosmetologists" },
  { value: "esthetician", label: "Estheticians" },
  { value: "massage_therapist", label: "Massage Therapists" },
  { value: "lash_artist", label: "Lash Artists" },
  { value: "nail_tech", label: "Nail Technicians" },
  { value: "general", label: "All Beauty Pros" },
];

const STATUS_COLORS: Record<CampaignStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paused: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  completed: "bg-blue-50 text-blue-700 ring-blue-200",
};

const DEFAULT_LOCATIONS = [
  "Juneau, WI",
  "Beaver Dam, WI",
  "Watertown, WI",
  "Dodge County, WI",
];

const BLANK_FORM = {
  name: "",
  type: "social",
  objective: "Recruit booth renters",
  target_roles: [] as RoleType[],
  target_locations: [] as string[],
  budget: "",
  posts_per_week: "4",
  start_date: "",
  end_date: "",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to load");
      setCampaigns(await res.json());
    } catch {
      // Show empty state if Pi not yet connected
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleRole(role: RoleType) {
    setForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
  }

  function toggleLocation(loc: string) {
    setForm((prev) => ({
      ...prev,
      target_locations: prev.target_locations.includes(loc)
        ? prev.target_locations.filter((l) => l !== loc)
        : [...prev.target_locations, loc],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Campaign name is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? Number(form.budget) : undefined,
          posts_per_week: Number(form.posts_per_week),
          status: "draft",
        }),
      });

      if (!res.ok) throw new Error("Failed to create campaign");
      const created: Campaign = await res.json();
      setCampaigns((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(BLANK_FORM);
      setSaveMsg("Campaign created");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setError("Could not save campaign — check Pi connection");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: CampaignStatus) {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated: Campaign = await res.json();
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
    } catch {
      // Optimistic update fallback
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Campaigns
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Recruiting Campaigns
          </h1>
          <p className="mt-1 text-slate-500">
            Plan and manage booth-renter recruiting campaigns by role and area.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {showForm ? "Cancel" : "New Campaign"}
        </button>
      </div>

      {saveMsg && (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {saveMsg}
        </p>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-5 font-semibold">New Campaign</h2>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Spring Booth Recruitment 2025"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Objective
                </label>
                <input
                  type="text"
                  value={form.objective}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, objective: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Posts / Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={form.posts_per_week}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, posts_per_week: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Budget ($){" "}
                  <span className="font-normal text-slate-400">optional</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, budget: e.target.value }))
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Target Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRole(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                      form.target_roles.includes(value)
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Target Locations
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                      form.target_locations.includes(loc)
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(BLANK_FORM);
                setError("");
              }}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Campaign list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">No campaigns yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs font-medium text-slate-600 underline underline-offset-2"
            >
              Create your first campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/campaigns/${c.id}`} className="font-semibold truncate hover:underline">{c.name}</Link>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                        STATUS_COLORS[c.status]
                      }`}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{c.objective}</p>
                </div>

                <div className="shrink-0 flex gap-2">
                  {c.status !== "active" && (
                    <button
                      onClick={() => updateStatus(c.id, "active")}
                      className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Activate
                    </button>
                  )}
                  {c.status === "active" && (
                    <button
                      onClick={() => updateStatus(c.id, "paused")}
                      className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Pause
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                {c.target_roles?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">
                      Roles
                    </span>
                    <span>{c.target_roles.join(", ")}</span>
                  </div>
                )}
                {c.target_locations?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">
                      Areas
                    </span>
                    <span>{c.target_locations.join(", ")}</span>
                  </div>
                )}
                {c.posts_per_week && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">
                      Cadence
                    </span>
                    <span>{c.posts_per_week} posts/week</span>
                  </div>
                )}
                {c.budget && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">
                      Budget
                    </span>
                    <span>${c.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
