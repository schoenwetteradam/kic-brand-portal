"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { LeadStatus, RecruitmentLead, RoleType } from "@/src/types/brand";

const ROLE_LABELS: Record<RoleType, string> = {
  cosmetologist: "Cosmetologist",
  esthetician: "Esthetician",
  massage_therapist: "Massage Therapist",
  lash_artist: "Lash Artist",
  nail_tech: "Nail Tech",
  general: "Beauty Professional",
};

const PIPELINE_STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  { key: "contacted", label: "Contacted", color: "bg-slate-100 text-slate-700 ring-slate-200" },
  { key: "interested", label: "Interested", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  { key: "tour_scheduled", label: "Tour Scheduled", color: "bg-violet-50 text-violet-700 ring-violet-200" },
  { key: "interviewed", label: "Interviewed", color: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  { key: "pending_decision", label: "Pending", color: "bg-orange-50 text-orange-700 ring-orange-200" },
  { key: "signed", label: "Signed", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { key: "lost", label: "Lost", color: "bg-red-50 text-red-700 ring-red-200" },
];

type FollowUp = {
  dm_message: string;
  email_subject: string;
  email_body: string;
  generated_by?: string;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<RecruitmentLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<RecruitmentLead>>({});
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [copied, setCopied] = useState<"dm" | "email" | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetchLead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchLead() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) { setNotFound(true); return; }
      const data: RecruitmentLead = await res.json();
      setLead(data);
      setEditForm(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const updated: RecruitmentLead = await res.json();
      setLead({ ...lead, ...updated });
      setEditing(false);
      flash("Saved");
    } catch {
      flash("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: LeadStatus) {
    if (!lead) return;
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setLead({ ...lead, ...updated, status });
    flash(`Moved to ${PIPELINE_STAGES.find(s => s.key === status)?.label}`);
  }

  async function generateFollowUp() {
    if (!lead) return;
    setFollowUpLoading(true);
    setFollowUp(null);
    try {
      const res = await fetch(`/api/leads/${id}/followup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
      });
      const data: FollowUp = await res.json();
      setFollowUp(data);
    } catch {
      flash("Could not generate follow-up");
    } finally {
      setFollowUpLoading(false);
    }
  }

  function copyText(text: string, type: "dm" | "email") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function flash(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-slate-400">Loading lead…</p>
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-slate-500">Lead not found.</p>
        <Link href="/leads" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          ← Back to leads
        </Link>
      </div>
    );
  }

  const stage = PIPELINE_STAGES.find(s => s.key === lead.status);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => router.back()} className="hover:text-slate-700">← Leads</button>
        <span>/</span>
        <span className="text-slate-700">{lead.full_name}</span>
      </div>

      {statusMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {statusMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.full_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {stage && (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${stage.color}`}>
                {stage.label}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {ROLE_LABELS[lead.role_type] ?? lead.role_type}
            </span>
            {lead.city && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {lead.city}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className="shrink-0 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Edit Lead</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "full_name", label: "Full Name", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "phone", label: "Phone", type: "tel" },
                { key: "city", label: "City", type: "text" },
                { key: "specialty", label: "Specialty", type: "text" },
                { key: "source", label: "Lead Source", type: "text" },
              ] as { key: keyof RecruitmentLead; label: string; type: string }[]
            ).map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={(editForm[key] as string) ?? ""}
                  onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Notes
              </label>
              <textarea
                rows={3}
                value={(editForm.notes as string) ?? ""}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditForm(lead); }}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Info card */
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              { label: "Email", value: lead.email },
              { label: "Phone", value: lead.phone },
              { label: "City", value: lead.city },
              { label: "Specialty", value: lead.specialty },
              { label: "Lead Source", value: lead.source },
              { label: "Added", value: new Date(lead.created_at).toLocaleDateString() },
              { label: "Last Contact", value: lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : undefined },
              { label: "Next Follow-up", value: lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString() : undefined },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <span className="text-slate-400">{label}: </span>
                  <span className="text-slate-800">{value}</span>
                </div>
              ) : null
            )}
          </div>
          {lead.notes && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <span className="font-medium text-slate-400 text-xs uppercase tracking-wide block mb-1">Notes</span>
              {lead.notes}
            </div>
          )}
        </div>
      )}

      {/* Pipeline stage mover */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Move Pipeline Stage
        </h2>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                lead.status === key
                  ? color + " ring-2"
                  : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Follow-up generator */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            AI Follow-up Generator
          </h2>
          <button
            onClick={generateFollowUp}
            disabled={followUpLoading}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {followUpLoading ? "Generating…" : "Generate Follow-up"}
          </button>
        </div>

        {followUp ? (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">DM / Text</span>
                <button
                  onClick={() => copyText(followUp.dm_message, "dm")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  {copied === "dm" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
                {followUp.dm_message}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
                <button
                  onClick={() => copyText(`Subject: ${followUp.email_subject}\n\n${followUp.email_body}`, "email")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  {copied === "email" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-2 font-medium text-slate-500 text-xs">
                  Subject: {followUp.email_subject}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{followUp.email_body}</div>
              </div>
            </div>

            {followUp.generated_by && (
              <p className="text-xs text-slate-400">
                Generated by {followUp.generated_by === "claude" ? "Claude AI" : "template engine"}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Click &ldquo;Generate Follow-up&rdquo; to get a personalized DM and email draft based on this lead&apos;s stage and info.
          </p>
        )}
      </div>
    </div>
  );
}
