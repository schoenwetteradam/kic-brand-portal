import Link from "next/link";
import {
  getBrandMetrics,
  getCampaigns,
  getLeads,
  getLowStock,
  getMetrics,
  getTopServices,
  type SalonOpsMetrics,
} from "@/lib/pi-client";
import { normalizeCampaign, normalizeLead } from "@/lib/brand-normalizers";
import type { BrandMetrics, Campaign, RecruitmentLead } from "@/types/brand";

export const dynamic = "force-dynamic";

const EMPTY_BRAND: BrandMetrics = {
  new_leads_7d: 0,
  tours_booked: 0,
  signed_renters: 0,
  active_campaigns: 0,
  pending_approvals: 0,
  scheduled_posts: 0,
  pipeline_stage_counts: { new: 0, contacted: 0, tour_scheduled: 0, signed: 0 },
};

const LEAD_PIPELINE_STAGES: Array<{
  key: keyof NonNullable<BrandMetrics["pipeline_stage_counts"]>;
  label: string;
  color: string;
}> = [
  { key: "new", label: "New Leads", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  { key: "contacted", label: "Contacted", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  { key: "tour_scheduled", label: "Tours Booked", color: "bg-violet-50 text-violet-700 ring-violet-200" },
  { key: "signed", label: "Signed", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
];

function isPiEnvConfigured(): boolean {
  const base = process.env.PI_BASE_URL || process.env.PI_API_BASE_URL;
  return Boolean(base && process.env.PI_API_KEY);
}

function recruitingLooksEmpty(m: BrandMetrics): boolean {
  return (
    (m.new_leads_7d ?? 0) === 0 &&
    (m.tours_booked ?? 0) === 0 &&
    (m.signed_renters ?? 0) === 0 &&
    (m.active_campaigns ?? 0) === 0 &&
    (m.pending_approvals ?? 0) === 0 &&
    (m.scheduled_posts ?? 0) === 0
  );
}

function salonLooksEmpty(
  salon: Record<string, number>,
  top: Array<{ service_name: string }>,
  low: Array<{ product_name: string }>
): boolean {
  return (
    (salon.bookings_7d ?? 0) === 0 &&
    (salon.revenue_7d ?? 0) === 0 &&
    (salon.new_customers_7d ?? 0) === 0 &&
    top.length === 0 &&
    low.length === 0
  );
}

export default async function DashboardPage() {
  const piConfigured = isPiEnvConfigured();

  let salonMetrics: Record<string, number> = {
    bookings_7d: 0,
    revenue_7d: 0,
    new_customers_7d: 0,
  };
  let topServices: Array<{ service_name: string; bookings_30d: number }> = [];
  let lowStock: Array<{ product_name: string; qty_on_hand: number }> = [];
  let brandMetrics: BrandMetrics = { ...EMPTY_BRAND };
  let salonError = "";
  /** When false, Pi fell back to zeros because Wix staff `/internal/ops/summary` was not usable. */
  let salonOpsAvailable: boolean | undefined;
  let recruitingError = "";
  let recentLeads: RecruitmentLead[] = [];
  let recentCampaigns: Campaign[] = [];

  if (!piConfigured) {
    salonError =
      "Missing PI_BASE_URL (or PI_API_BASE_URL) or PI_API_KEY in Vercel. Add them under Project → Settings → Environment Variables, then Redeploy.";
  } else {
    try {
      const [m, top, low] = await Promise.all([
        getMetrics(),
        getTopServices(),
        getLowStock(),
      ]);
      const metrics = m as SalonOpsMetrics;
      salonOpsAvailable = metrics.salon_ops_available;
      salonMetrics = {
        bookings_7d: Number(metrics.bookings_7d) || 0,
        revenue_7d: Number(metrics.revenue_7d) || 0,
        new_customers_7d: Number(metrics.new_customers_7d) || 0,
      };
      topServices = Array.isArray(top) ? top : [];
      lowStock = Array.isArray(low) ? low : [];
    } catch (e: unknown) {
      salonError =
        e instanceof Error ? e.message : "Failed to load salon data from Pi";
    }

    try {
      brandMetrics = await getBrandMetrics();
    } catch (e: unknown) {
      recruitingError =
        e instanceof Error ? e.message : "Failed to load recruiting metrics from Pi";
      brandMetrics = { ...EMPTY_BRAND };
    }

    try {
      const raw = await getLeads();
      const list = Array.isArray(raw) ? raw : [];
      recentLeads = list.slice(0, 5).map((row) =>
        normalizeLead(row as unknown as Record<string, unknown>)
      );
    } catch {
      recentLeads = [];
    }

    try {
      const raw = await getCampaigns();
      const list = Array.isArray(raw) ? raw : [];
      recentCampaigns = list
        .slice(0, 4)
        .map((row) => normalizeCampaign(row as unknown as Record<string, unknown>));
    } catch {
      recentCampaigns = [];
    }
  }

  const recruitingEmpty = !recruitingError && recruitingLooksEmpty(brandMetrics);
  const salonEmptyConnected = !salonError && salonLooksEmpty(salonMetrics, topServices, lowStock);
  const piReachable = piConfigured && !salonError.startsWith("Missing PI_");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Connection & setup */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              !piConfigured
                ? "bg-amber-200 text-amber-950"
                : recruitingError || salonError
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {!piConfigured
              ? "Pi API not configured"
              : recruitingError || salonError
                ? "Pi reachable with issues"
                : "Pi API connected"}
          </span>
          <p className="text-sm text-slate-600">
            {!piConfigured
              ? "Set Vercel env vars so this page can load live recruiting and salon data."
              : "Numbers below come from your Pi Brand API (Postgres + optional Wix staff summary)."}
          </p>
        </div>
        {!piConfigured && (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>
              Vercel → <strong>kic-brand-portal</strong> → Settings → Environment Variables
            </li>
            <li>
              Add <code className="rounded bg-white px-1">PI_BASE_URL=https://brand.keepingitcutesalonandspa.com</code>{" "}
              and <code className="rounded bg-white px-1">PI_API_KEY</code> (same as Pi{" "}
              <code className="rounded bg-white px-1">INTERNAL_API_KEY</code>)
            </li>
            <li>
              Redeploy Production (Deployments → … → Redeploy)
            </li>
          </ol>
        )}
        {recruitingError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <strong>Recruiting metrics:</strong> {recruitingError}
            <span className="mt-1 block text-xs text-red-700">
              Check Pi: Postgres has <code className="rounded bg-red-100 px-1">brand_schema.sql</code> tables (
              <code className="rounded bg-red-100 px-1">recruitment_leads</code>, etc.) and{" "}
              <code className="rounded bg-red-100 px-1">DATABASE_URL</code> on the Pi.
            </span>
          </p>
        )}
        {recruitingEmpty && piReachable && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-3 text-sm text-blue-950">
            <p className="font-medium">Ready to show real recruiting numbers</p>
            <p className="mt-1 text-blue-900/90">
              Add leads, turn on a campaign, and generate content — KPIs and pipeline counts update from your Pi
              database automatically.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/leads"
                className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
              >
                Add your first lead
              </Link>
              <Link
                href="/campaigns"
                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-50"
              >
                Create a campaign
              </Link>
              <Link
                href="/content?tab=generate"
                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-50"
              >
                Generate content
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Keeping It Cute
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Recruiting pipeline and salon operations at a glance.
        </p>
      </div>

      {/* Recruiting KPIs */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Booth Renter Recruiting
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">New Leads (7 days)</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.new_leads_7d}
            </div>
            <Link
              href="/leads"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              View pipeline →
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Tours Booked</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.tours_booked}
            </div>
            <Link
              href="/leads?status=tour_scheduled"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              View tours →
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Signed Renters</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.signed_renters}
            </div>
            <Link
              href="/leads?status=signed"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              View signed →
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Active Campaigns</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.active_campaigns}
            </div>
            <Link
              href="/campaigns"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              Manage campaigns →
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Pending Approvals</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.pending_approvals}
            </div>
            <Link
              href="/content?tab=drafts"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              Review drafts →
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Scheduled Posts</div>
            <div className="mt-2 text-3xl font-semibold">
              {brandMetrics.scheduled_posts}
            </div>
            <Link
              href="/content?tab=scheduled"
              className="mt-3 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              View schedule →
            </Link>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      {(recentLeads.length > 0 || recentCampaigns.length > 0) && (
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          {recentLeads.length > 0 && (
            <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Recent leads
                </h2>
                <Link href="/leads" className="text-xs text-slate-500 hover:text-slate-800">
                  All leads →
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{lead.full_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {lead.role_type.replace(/_/g, " ")} · {lead.status.replace(/_/g, " ")}
                        {lead.city ? ` · ${lead.city}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recentCampaigns.length > 0 && (
            <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Recent campaigns
                </h2>
                <Link href="/campaigns" className="text-xs text-slate-500 hover:text-slate-800">
                  All campaigns →
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {recentCampaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">{c.objective || "No objective set"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600">
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Lead pipeline stages */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Pipeline Stages
          </h2>
          <Link
            href="/leads"
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Full pipeline →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {LEAD_PIPELINE_STAGES.map(({ key, label, color }) => (
            <div
              key={key}
              className={`rounded-2xl p-4 ring-1 ${color}`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {label}
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {brandMetrics.pipeline_stage_counts?.[key] ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/content?tab=generate"
            className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Generate Content
          </Link>
          <Link
            href="/leads"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Add Lead
          </Link>
          <Link
            href="/campaigns"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            New Campaign
          </Link>
        </div>
      </section>

      {/* Salon operations */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Salon Operations (Pi → Wix staff backend)
        </h2>

        {salonError && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">
              {salonError.includes("Missing PI_") ? "Portal cannot reach the Pi yet" : "Salon summary unavailable"}
            </p>
            <p className="mt-1 text-amber-800">{salonError}</p>
            {!salonError.includes("Missing PI_") && (
              <p className="mt-2 text-xs text-amber-700">
                When the Pi <em>can</em> call your staff app, set{" "}
                <code className="rounded bg-amber-100 px-1">WIX_STAFF_API_BASE_URL</code> (correct port, often{" "}
                <code className="rounded bg-amber-100 px-1">4000</code>) and{" "}
                <code className="rounded bg-amber-100 px-1">WIX_STAFF_API_TOKEN</code>, and implement{" "}
                <code className="rounded bg-amber-100 px-1">GET /internal/ops/summary</code>. See{" "}
                <code className="rounded bg-amber-100 px-1">docs/data-sources-and-ai.md</code> in the repo.
              </p>
            )}
          </div>
        )}

        {salonEmptyConnected && piReachable && !recruitingError && (
          <p className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            {salonOpsAvailable === false ? (
              <>
                The Pi could not load data from your Wix staff backend (missing token, wrong URL/port, or{" "}
                <code className="rounded bg-slate-100 px-1">GET /internal/ops/summary</code> failing). On the{" "}
                <strong>Pi</strong>, set <code className="rounded bg-slate-100 px-1">WIX_STAFF_API_BASE_URL</code> and{" "}
                <code className="rounded bg-slate-100 px-1">WIX_STAFF_API_TOKEN</code>, then verify the summary
                endpoint with curl (see <code className="rounded bg-slate-100 px-1">docs/pi-deploy.md</code>). Salon
                numbers below are placeholders until that works.
              </>
            ) : salonOpsAvailable === true ? (
              <>
                Salon summary is connected: the last 7 days have no bookings or revenue in the payload, or top
                services / low stock lists are empty. If you expected activity, confirm your summary JSON field names
                match <code className="rounded bg-slate-100 px-1">docs/data-sources-and-ai.md</code>.
              </>
            ) : (
              <>
                Connected to the Pi, but salon metrics are zero or empty. Either{" "}
                <code className="rounded bg-slate-100 px-1">/internal/ops/summary</code> isn’t returning data yet, or the
                staff backend URL/port on the Pi is wrong. (Redeploy the Pi Brand API to get an explicit
                connected-vs-fallback signal on <code className="rounded bg-slate-100 px-1">/brand/metrics</code>.)
              </>
            )}
          </p>
        )}

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Bookings (7 days)</div>
            <div className="mt-1 text-2xl font-semibold">
              {salonMetrics.bookings_7d ?? 0}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Revenue (7 days)</div>
            <div className="mt-1 text-2xl font-semibold">
              ${salonMetrics.revenue_7d ?? 0}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">New Customers (7 days)</div>
            <div className="mt-1 text-2xl font-semibold">
              {salonMetrics.new_customers_7d ?? 0}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h3 className="font-semibold">Top Services (30 days)</h3>
            <div className="mt-4 space-y-2">
              {topServices.length ? (
                topServices.map((item) => (
                  <div
                    key={item.service_name}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2.5"
                  >
                    <span className="text-sm">{item.service_name}</span>
                    <span className="text-sm font-medium">
                      {item.bookings_30d}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No service data yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h3 className="font-semibold">Low Stock Products</h3>
            <div className="mt-4 space-y-2">
              {lowStock.length ? (
                lowStock.map((item) => (
                  <div
                    key={item.product_name}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2.5"
                  >
                    <span className="text-sm">{item.product_name}</span>
                    <span className="text-sm font-medium text-amber-600">
                      {item.qty_on_hand} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No low stock items.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
