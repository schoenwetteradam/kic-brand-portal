export default function AnalyticsPage() {
  const PLATFORMS = [
    { name: "Instagram", leads: "—", cpl: "—", top: "Private suite post" },
    { name: "Facebook", leads: "—", cpl: "—", top: "Booth rental ad" },
    { name: "Google Business", leads: "—", cpl: "—", top: "—" },
    { name: "TikTok", leads: "—", cpl: "—", top: "—" },
  ];

  const ROLE_BREAKDOWN = [
    { role: "Cosmetologist", leads: "—", tours: "—", signed: "—" },
    { role: "Esthetician", leads: "—", tours: "—", signed: "—" },
    { role: "Lash Artist", leads: "—", tours: "—", signed: "—" },
    { role: "Massage Therapist", leads: "—", tours: "—", signed: "—" },
    { role: "Nail Tech", leads: "—", tours: "—", signed: "—" },
  ];

  const CONTENT_THEMES = [
    "Private suite / your own space",
    "Independence + flexibility",
    "Growing your clientele",
    "Upscale environment",
    "Community and culture",
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Recruiting Analytics
        </h1>
        <p className="mt-1 text-slate-500">
          Measure performance across platforms, content themes, and audience
          segments.
        </p>
      </div>

      {/* Funnel overview */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Funnel Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Leads", value: "—" },
            { label: "Contacted", value: "—" },
            { label: "Tours Booked", value: "—" },
            { label: "Interviewed", value: "—" },
            { label: "Signed", value: "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 text-center"
            >
              <div className="text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Connect your Pi backend to populate live funnel data. Totals are
          calculated from the leads pipeline.
        </p>
      </section>

      {/* Platform breakdown */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Leads by Platform
        </h2>
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Platform
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Leads
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cost / Lead
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Top Content
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLATFORMS.map(({ name, leads, cpl, top }) => (
                <tr key={name} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{name}</td>
                  <td className="px-5 py-3 text-slate-600">{leads}</td>
                  <td className="px-5 py-3 text-slate-600">{cpl}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role breakdown */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Leads by Role Type
        </h2>
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Leads
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tours
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Signed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROLE_BREAKDOWN.map(({ role, leads, tours, signed }) => (
                <tr key={role} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{role}</td>
                  <td className="px-5 py-3 text-slate-600">{leads}</td>
                  <td className="px-5 py-3 text-slate-600">{tours}</td>
                  <td className="px-5 py-3 text-slate-600">{signed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Content performance */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Top Content Themes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_THEMES.map((theme, i) => (
            <div
              key={theme}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{theme}</span>
                <span className="text-xs text-slate-400">#{i + 1}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>Impressions: —</span>
                <span>Leads: —</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-slate-300 w-0" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect Pi note */}
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Data connection
        </p>
        <h2 className="mt-1 font-semibold">Connect your Pi backend for live analytics</h2>
        <p className="mt-2 text-sm text-slate-500">
          When your Pi backend exposes{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-mono">
            GET /brand/recruiting-metrics
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-mono">
            GET /brand/analytics
          </code>
          , this page will populate with live data from your campaigns, leads,
          and content.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Set{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-mono">
            PI_BASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-mono">
            PI_API_KEY
          </code>{" "}
          in Settings or your environment to connect.
        </p>
      </div>
    </div>
  );
}
