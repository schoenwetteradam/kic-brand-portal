import { getLowStock, getMetrics, getTopServices } from "@/lib/pi-client";

export default async function DashboardPage() {
  let metrics: any = { bookings_7d: 0, revenue_7d: 0, new_customers_7d: 0 };
  let topServices: any[] = [];
  let lowStock: any[] = [];
  let error = "";

  try {
    [metrics, topServices, lowStock] = await Promise.all([
      getMetrics(),
      getTopServices(),
      getLowStock(),
    ]);
  } catch (e: any) {
    error = e?.message || "Failed to load dashboard data";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Keeping It Cute
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Brand Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Marketing signals pulled from your Pi-hosted salon backend.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Bookings (7 days)</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.bookings_7d ?? 0}</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Revenue (7 days)</div>
            <div className="mt-2 text-3xl font-semibold">${metrics.revenue_7d ?? 0}</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">New Customers (7 days)</div>
            <div className="mt-2 text-3xl font-semibold">{metrics.new_customers_7d ?? 0}</div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Top Services</h2>
            <div className="mt-4 space-y-3">
              {topServices.length ? (
                topServices.map((item: any) => (
                  <div
                    key={item.service_name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span>{item.service_name}</span>
                    <span className="font-medium">{item.bookings_30d}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No service data yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Low Stock Products</h2>
            <div className="mt-4 space-y-3">
              {lowStock.length ? (
                lowStock.map((item: any) => (
                  <div
                    key={item.product_name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span>{item.product_name}</span>
                    <span className="font-medium">{item.qty_on_hand}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No low stock items.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
