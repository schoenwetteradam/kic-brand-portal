"use client";

import { useEffect, useState } from "react";
import type { LeadStatus, RecruitmentLead, RoleType } from "@/src/types/brand";

const ROLE_LABELS: Record<RoleType, string> = {
  cosmetologist: "Cosmetologist",
  esthetician: "Esthetician",
  massage_therapist: "Massage Therapist",
  lash_artist: "Lash Artist",
  nail_tech: "Nail Tech",
  general: "Beauty Pro",
};

const PIPELINE_STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  { key: "contacted", label: "Contacted", color: "bg-slate-100 text-slate-700 ring-slate-200" },
  { key: "interested", label: "Interested", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  { key: "tour_scheduled", label: "Tour Scheduled", color: "bg-violet-50 text-violet-700 ring-violet-200" },
  { key: "interviewed", label: "Interviewed", color: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    { key: "signed", label: "Signed", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { key: "lost", label: "Lost", color: "bg-red-50 text-red-700 ring-red-200" },
];

const STATUS_NEXT: Partial<Record<LeadStatus, LeadStatus>> = {
  new: "contacted",
  contacted: "interested",
  interested: "tour_scheduled",
  tour_scheduled: "interviewed",
  interviewed: "signed",
};

const BLANK_FORM = {
  full_name: "",
  email: "",
  phone: "",
  role_type: "cosmetologist" as RoleType,
  specialty: "",
  source: "manual",
  city: "",
  notes: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<RecruitmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedLead, setSelectedLead] = useState<RecruitmentLead | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [filterRole, setFilterRole] = useState<RoleType | "all">("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error();
      setLeads(await res.json());
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Name and email are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, status: "new" }),
      });
      if (!res.ok) throw new Error();
      const created: RecruitmentLead = await res.json();
      setLeads((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(BLANK_FORM);
    } catch {
      setFormError("Could not save lead — check Pi connection");
    } finally {
      setSaving(false);
    }
  }

  async function advanceLead(lead: RecruitmentLead) {
    const next = STATUS_NEXT[lead.status];
    if (!next) return;
    await updateLeadStatus(lead.id, next);
  }

  async function updateLeadStatus(id: string, status: LeadStatus) {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated: RecruitmentLead = res.ok
        ? await res.json()
        : { ...leads.find((l) => l.id === id)!, status };
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (selectedLead?.id === id) setSelectedLead(updated);
    } catch {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
  }

  const filtered = leads.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterRole !== "all" && l.role_type !== filterRole) return false;
    return true;
  });

  const pipelineStage = (status: LeadStatus) =>
    PIPELINE_STAGES.find((s) => s.key === status);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Leads
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Booth Renter Pipeline
          </h1>
          <p className="mt-1 text-slate-500">
            Track every inquiry from first contact to signed lease.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {showForm ? "Cancel" : "Add Lead"}
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="mb-6 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {PIPELINE_STAGES.map(({ key, label, color }) => {
          const count = leads.filter((l) => l.status === key).length;
          return (
            <button
              key={key}
              onClick={() =>
                setFilterStatus((prev) => (prev === key ? "all" : key))
              }
              className={`rounded-2xl p-3 ring-1 text-left transition hover:opacity-90 ${color} ${
                filterStatus === key ? "ring-2" : ""
              }`}
            >
              <div className="text-lg font-semibold">{count}</div>
              <div className="mt-0.5 text-xs font-medium opacity-70">
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add lead form */}
      {showForm && (
        <form
          onSubmit={handleAddLead}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-5 font-semibold">Add New Lead</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Role Type
              </label>
              <select
                value={form.role_type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    role_type: e.target.value as RoleType,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                placeholder="e.g. Beaver Dam"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Lead Source
              </label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((p) => ({ ...p, source: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="manual">Manual / Referral</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="facebook_ad">Facebook Ad</option>
                <option value="google">Google</option>
                <option value="wix_form">Wix Form</option>
                <option value="walk_in">Walk-In</option>
                <option value="dm">Direct Message</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>
          {formError && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(BLANK_FORM);
                setFormError("");
              }}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as RoleType | "all")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {(filterStatus !== "all" || filterRole !== "all") && (
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterRole("all");
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lead list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading leads...</p>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              {leads.length === 0
                ? "No leads yet. Add one to get started."
                : "No leads match your filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const stage = pipelineStage(lead.status);
            const nextStage = STATUS_NEXT[lead.status];
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lead.full_name}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${stage?.color ?? ""}`}
                      >
                        {stage?.label ?? lead.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        {ROLE_LABELS[lead.role_type] ?? lead.role_type}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>{lead.email}</span>
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.city && <span>{lead.city}</span>}
                      {lead.source && (
                        <span className="text-xs text-slate-400">
                          via {lead.source}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    {nextStage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void advanceLead(lead);
                        }}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 whitespace-nowrap"
                      >
                        → {PIPELINE_STAGES.find((s) => s.key === nextStage)?.label}
                      </button>
                    )}
                    {lead.status !== "lost" && lead.status !== "signed" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void updateLeadStatus(lead.id, "lost");
                        }}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Mark lost
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail overlay */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-lg">{selectedLead.full_name}</h2>
                <p className="text-sm text-slate-500">
                  {ROLE_LABELS[selectedLead.role_type]} · {selectedLead.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-slate-400 w-20 shrink-0">Email</span>
                <span>{selectedLead.email}</span>
              </div>
              {selectedLead.phone && (
                <div className="flex gap-3">
                  <span className="text-slate-400 w-20 shrink-0">Phone</span>
                  <span>{selectedLead.phone}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-slate-400 w-20 shrink-0">Source</span>
                <span>{selectedLead.source}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-slate-400 w-20 shrink-0">Status</span>
                <span>{selectedLead.status}</span>
              </div>
              {selectedLead.notes && (
                <div className="flex gap-3">
                  <span className="text-slate-400 w-20 shrink-0">Notes</span>
                  <span>{selectedLead.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Move to Stage
              </p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => updateLeadStatus(selectedLead.id, key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                      selectedLead.status === key
                        ? color + " ring-2"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
