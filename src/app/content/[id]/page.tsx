"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ApprovalStatus, ContentAsset } from "@/src/types/brand";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google Business",
  email: "Email",
  sms: "SMS",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "Social Post",
  reel_script: "Reel / Short Script",
  ad_copy: "Ad Copy",
  email_template: "Email Template",
  dm_template: "DM Template",
  landing_page_copy: "Landing Page Copy",
};

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<ContentAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${id}`);
      if (!res.ok) { setNotFound(true); return; }
      setItem(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    const res = await fetch(`/api/content/${id}/approve`, { method: "POST" });
    const updated = await res.json();
    setItem(prev => prev ? { ...prev, ...updated, approval_status: "approved" } : prev);
    flash("Content approved", true);
  }

  async function reject() {
    const res = await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approval_status: "rejected" }),
    });
    const updated = await res.json();
    setItem(prev => prev ? { ...prev, ...updated, approval_status: "rejected" } : prev);
    flash("Content rejected", false);
  }

  async function schedule() {
    if (!scheduleDate) { flash("Choose a date/time first", false); return; }
    const res = await fetch(`/api/content/${id}/schedule`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scheduled_for: new Date(scheduleDate).toISOString() }),
    });
    const updated = await res.json();
    setItem(prev => prev ? { ...prev, ...updated, approval_status: "approved", scheduled_for: updated.scheduled_for ?? scheduleDate } : prev);
    setScheduling(false);
    flash("Scheduled!", true);
  }

  async function publishNow() {
    if (!item) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/content/${id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? "Publish failed", false);
      } else {
        setItem(prev => prev ? {
          ...prev,
          approval_status: "approved",
          published_at: data.published_at,
          external_post_id: data.external_post_id,
        } : prev);
        flash(`Published to ${data.platform}!`, true);
      }
    } finally {
      setPublishing(false);
    }
  }

  function copyContent() {
    if (!item) return;
    const text = [
      item.title,
      "",
      item.caption || item.script || "",
      "",
      item.cta ? `CTA: ${item.cta}` : "",
      item.hashtags?.length ? item.hashtags.map(h => `#${h}`).join(" ") : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function flash(text: string, ok: boolean) {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 4000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-slate-400">Loading content…</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-slate-500">Content not found.</p>
        <Link href="/content" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          ← Back to content
        </Link>
      </div>
    );
  }

  const canPublish =
    (item.platform === "instagram" || item.platform === "facebook") &&
    item.approval_status === "approved";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => router.back()} className="hover:text-slate-700">← Content</button>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-xs">{item.title}</span>
      </div>

      {statusMsg && (
        <div className={`mb-4 rounded-2xl border px-4 py-2.5 text-sm font-medium ${
          statusMsg.ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[item.approval_status]}`}>
              {item.approval_status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {PLATFORM_LABELS[item.platform] ?? item.platform}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
            </span>
            {item.audience && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {item.audience.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={copyContent}
          className="shrink-0 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Content body */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
        {item.caption && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Caption</p>
            <p className="text-sm leading-7 whitespace-pre-wrap text-slate-800">{item.caption}</p>
          </div>
        )}

        {item.script && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Script</p>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 whitespace-pre-wrap text-slate-800 font-mono">
              {item.script}
            </div>
          </div>
        )}

        {item.cta && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">CTA</p>
            <p className="text-sm font-medium text-slate-800">{item.cta}</p>
          </div>
        )}

        {item.hashtags && item.hashtags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Hashtags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map(tag => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2 border-t border-slate-100 pt-4">
          <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
          {item.scheduled_for && (
            <span>Scheduled: {new Date(item.scheduled_for).toLocaleString()}</span>
          )}
          {item.published_at && (
            <span className="text-emerald-600">
              Published: {new Date(item.published_at).toLocaleString()}
            </span>
          )}
          {item.external_post_id && (
            <span>Post ID: {item.external_post_id}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!item.published_at && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            {item.approval_status === "pending" && (
              <>
                <button
                  onClick={approve}
                  className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={reject}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Reject
                </button>
              </>
            )}

            {item.approval_status === "approved" && !item.scheduled_for && (
              <button
                onClick={() => setScheduling(v => !v)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Schedule Post
              </button>
            )}

            {canPublish && (
              <button
                onClick={publishNow}
                disabled={publishing}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {publishing ? "Publishing…" : `Publish to ${PLATFORM_LABELS[item.platform]}`}
              </button>
            )}

            {item.approval_status === "rejected" && (
              <button
                onClick={approve}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Re-approve
              </button>
            )}
          </div>

          {scheduling && (
            <div className="mt-4 flex items-center gap-3">
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
              <button
                onClick={schedule}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Confirm Schedule
              </button>
              <button
                onClick={() => setScheduling(false)}
                className="text-sm text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          )}

          {!canPublish && item.approval_status === "approved" && (
            <p className="mt-4 text-xs text-slate-400">
              Direct publishing is available for Instagram and Facebook when{" "}
              <Link href="/settings" className="underline">Meta credentials</Link> are configured.
            </p>
          )}
        </div>
      )}

      {item.published_at && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-medium text-emerald-700">
            ✓ Published on {new Date(item.published_at).toLocaleString()}
            {item.external_post_id && ` · Post ID: ${item.external_post_id}`}
          </p>
        </div>
      )}
    </div>
  );
}
