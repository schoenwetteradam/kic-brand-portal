import Link from "next/link";
import { getLowStock, getMetrics, getTopServices } from "@/lib/pi-client";
import type { BrandMetrics } from "@/types/brand";

async function getBrandMetrics(): Promise<BrandMetrics> {
  try {
    const { getBrandMetrics: fetchBrandMetrics } = await import(
      "@/lib/pi-client"
    );
    return await fetchBrandMetrics();
  } catch {
    // Return zeroed metrics when Pi backend isn't yet wired up for recruiting
    return {
      new_leads_7d: 0,
      tours_booked: 0,
      signed_renters: 0,
      active_campaigns: 0,
      pending_approvals: 0,
      scheduled_posts: 0,
      pipeline_stage_counts: { new: 0, contacted: 0, tour_scheduled: 0, signed: 0 },
    };
  }
}

const LEAD_PIPELINE_STAGES: Array<{ key: keyof { new: number; contacted: number; tour_scheduled: number; signed: number }; label: string; color: string }> = [
  { key: "new", label: "New Leads", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  { key: "contacted", label: "Contacted", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  { key: "tour_scheduled", label: "Tours Booked", color: "bg-violet-50 text-violet-700 ring-violet-200" },
  { key: "signed", label: "Signed", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
];

export default async function DashboardPage() {
  let salonMetrics: Record<string, number> = {
    bookings_7d: 0,
    revenue_7d: 0,
    new_customers_7d: 0,
  };
  let topServices: Array<{ service_name: string; bookings_30d: number }> = [];
  let lowStock: Array<{ product_name: string; qty_on_hand: number }> = [];
  let brandMetrics: BrandMetrics = {
    new_leads_7d: 0,
    tours_booked: 0,
    signed_renters: 0,
    active_campaigns: 0,
    pending_approvals: 0,
    scheduled_posts: 0,
  };
  let salonError = "";

  try {
    [salonMetrics, topServices, lowStock] = await Promise.all([
      getMetrics(),
      getTopServices(),
      getLowStock(),
    ]);
  } catch (e: unknown) {
    salonError =
      e instanceof Error ? e.message : "Failed to load salon data from Pi";
  }

  brandMetrics = await getBrandMetrics();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
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
          Salon Operations (Pi Backend)
        </h2>

        {salonError && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Salon data not connected</p>
            <p className="mt-1 text-amber-800">{salonError}</p>
            <p className="mt-2 text-xs text-amber-700">
              On the Pi: set <code className="rounded bg-amber-100 px-1">WIX_STAFF_API_BASE_URL</code> and{" "}
              <code className="rounded bg-amber-100 px-1">WIX_STAFF_API_TOKEN</code>, or add{" "}
              <code className="rounded bg-amber-100 px-1">GET /internal/ops/summary</code> to your Wix staff backend.
            </p>
          </div>
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
