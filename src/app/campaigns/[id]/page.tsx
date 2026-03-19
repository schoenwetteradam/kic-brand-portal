"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Campaign, CampaignStatus, ContentAsset, RoleType } from "@/src/types/brand";

const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "cosmetologist", label: "Cosmetologists" },
  { value: "esthetician", label: "Estheticians" },
  { value: "massage_therapist", label: "Massage Therapists" },
  { value: "lash_artist", label: "Lash Artists" },
  { value: "nail_tech", label: "Nail Technicians" },
  { value: "general", label: "All Beauty Pros" },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [content, setContent] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [editForm, setEditForm] = useState<Partial<Campaign>>({});
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    fetchCampaign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchCampaign() {
    setLoading(true);
    try {
      const [campRes, contentRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/content?campaign_id=${id}`),
      ]);
      if (!campRes.ok) { setNotFound(true); return; }
      const camp: Campaign = await campRes.json();
      setCampaign(camp);
      setEditForm(camp);
      if (contentRes.ok) setContent(await contentRes.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    if (!campaign) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const updated: Campaign = await res.json();
      setCampaign({ ...campaign, ...updated });
      setEditing(false);
      flash("Saved");
    } catch {
      flash("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: CampaignStatus) {
    if (!campaign) return;
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setCampaign({ ...campaign, ...updated, status });
    flash(`Campaign ${status}`);
  }

  function toggleRole(role: RoleType) {
    const current = (editForm.target_roles ?? []) as RoleType[];
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    setEditForm(p => ({ ...p, target_roles: next }));
  }

  function addLocation() {
    const loc = locationInput.trim();
    if (!loc) return;
    const current = editForm.target_locations ?? [];
    if (!current.includes(loc)) {
      setEditForm(p => ({ ...p, target_locations: [...current, loc] }));
    }
    setLocationInput("");
  }

  function removeLocation(loc: string) {
    setEditForm(p => ({
      ...p,
      target_locations: (p.target_locations ?? []).filter(l => l !== loc),
    }));
  }

  function flash(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-400">Loading campaign…</p>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-500">Campaign not found.</p>
        <Link href="/campaigns" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => router.back()} className="hover:text-slate-700">← Campaigns</button>
        <span>/</span>
        <span className="text-slate-700">{campaign.name}</span>
      </div>

      {statusMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {statusMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="mt-1 text-slate-500 text-sm">{campaign.objective}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
              {campaign.status}
            </span>
            {campaign.target_roles.map(r => (
              <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {ROLE_OPTIONS.find(o => o.value === r)?.label ?? r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {campaign.status === "draft" && (
            <button
              onClick={() => setStatus("active")}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Activate
            </button>
          )}
          {campaign.status === "active" && (
            <button
              onClick={() => setStatus("paused")}
              className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => setStatus("active")}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Resume
            </button>
          )}
          <button
            onClick={() => setEditing(v => !v)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold">Edit Campaign</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Name</label>
            <input
              type="text"
              value={editForm.name ?? ""}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Objective</label>
            <input
              type="text"
              value={editForm.objective ?? ""}
              onChange={e => setEditForm(p => ({ ...p, objective: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Budget ($)</label>
              <input
                type="number"
                value={editForm.budget ?? ""}
                onChange={e => setEditForm(p => ({ ...p, budget: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Posts/Week</label>
              <input
                type="number"
                value={editForm.posts_per_week ?? ""}
                onChange={e => setEditForm(p => ({ ...p, posts_per_week: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Type</label>
              <input
                type="text"
                value={editForm.type ?? ""}
                onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                placeholder="e.g. recruiting"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Start Date</label>
              <input
                type="date"
                value={editForm.start_date ?? ""}
                onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">End Date</label>
              <input
                type="date"
                value={editForm.end_date ?? ""}
                onChange={e => setEditForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Target Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(({ value, label }) => {
                const selected = (editForm.target_roles ?? []).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRole(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                      selected
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Target Locations</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLocation())}
                placeholder="e.g. Beaver Dam, WI"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={addLocation}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(editForm.target_locations ?? []).map(loc => (
                <span key={loc} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {loc}
                  <button onClick={() => removeLocation(loc)} className="ml-1 text-slate-400 hover:text-slate-700">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditForm(campaign); }}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Campaign details */
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {campaign.budget !== undefined && (
              <div><span className="text-slate-400">Budget: </span><span>${campaign.budget}</span></div>
            )}
            {campaign.posts_per_week && (
              <div><span className="text-slate-400">Posts/week: </span><span>{campaign.posts_per_week}</span></div>
            )}
            {campaign.start_date && (
              <div><span className="text-slate-400">Start: </span><span>{new Date(campaign.start_date).toLocaleDateString()}</span></div>
            )}
            {campaign.end_date && (
              <div><span className="text-slate-400">End: </span><span>{new Date(campaign.end_date).toLocaleDateString()}</span></div>
            )}
            {campaign.type && (
              <div><span className="text-slate-400">Type: </span><span>{campaign.type}</span></div>
            )}
            <div>
              <span className="text-slate-400">Created: </span>
              <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {campaign.target_locations.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Target Locations</p>
              <div className="flex flex-wrap gap-2">
                {campaign.target_locations.map(loc => (
                  <span key={loc} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/content?tab=generate`}
          className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Generate Content for Campaign
        </Link>
        <Link
          href="/leads"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Leads
        </Link>
      </div>

      {/* Associated content */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Campaign Content ({content.length})
        </h2>
        {content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">No content yet for this campaign.</p>
            <Link
              href="/content?tab=generate"
              className="mt-3 inline-block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Generate content →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {content.map(item => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{item.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.platform} · {item.content_type.replace(/_/g, " ")} · {item.audience}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.approval_status === "approved"
                    ? "bg-emerald-50 text-emerald-700"
                    : item.approval_status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {item.approval_status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
