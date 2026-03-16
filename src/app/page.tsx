import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Keeping It Cute
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Brand Portal
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            A content, SEO, and campaign workspace connected to your salon data.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard"
            className="rounded-3xl border border-slate-200 p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-lg font-semibold">Dashboard</div>
            <p className="mt-2 text-sm text-slate-600">
              View bookings, top services, and low stock products.
            </p>
          </Link>

          <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="text-lg font-semibold">Content Ideas</div>
            <p className="mt-2 text-sm text-slate-600">Coming next.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="text-lg font-semibold">Drafts</div>
            <p className="mt-2 text-sm text-slate-600">Coming next.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="text-lg font-semibold">Social Queue</div>
            <p className="mt-2 text-sm text-slate-600">Coming next.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
