import Link from "next/link";
const STAFF_APP_URL = process.env.NEXT_PUBLIC_STAFF_APP_URL;

const PORTAL_SECTIONS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description:
      "Recruiting pipeline at a glance — leads, tours, signed renters, and content status.",
    badge: null,
  },
  {
    href: "/agent",
    label: "Agent Console",
    description:
      "Let salon managers and admins direct the recruiting agent, plan content, and shape weekly growth actions.",
    badge: "NEW",
  },
  {
    href: "/content",
    label: "Content Studio",
    description:
      "Generate posts, reel scripts, ad copy, and DM templates for booth-renter recruiting.",
    badge: "AI",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    description:
      "Plan and manage recruiting campaigns by role, location, and schedule.",
    badge: null,
  },
  {
    href: "/leads",
    label: "Leads",
    description:
      "Track every booth-renter inquiry from first contact to signed lease.",
    badge: null,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description:
      "Measure what's working — leads by platform, top content themes, conversion rates.",
    badge: null,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Configure API keys, platform integrations, and automation rules.",
    badge: null,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-12">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Keeping It Cute
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Brand Portal
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-500">
          Your booth-renter recruiting machine. Generate content, manage
          campaigns, track leads, and grow the salon — all in one place.
        </p>
        {STAFF_APP_URL ? (
          <div className="mt-5">
            <a
              href={STAFF_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Open Wix Staff Backend App
            </a>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PORTAL_SECTIONS.map(({ href, label, description, badge }) => (
          <Link
            key={href}
            href={href}
            className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            {badge && (
              <span className="absolute right-5 top-5 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                {badge}
              </span>
            )}
            <div className="text-lg font-semibold group-hover:text-slate-700">
              {label}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-14 rounded-3xl border border-slate-100 bg-slate-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Recruiting focus
        </p>
        <h2 className="mt-2 text-xl font-semibold">
          Built to grow your booth-renter roster
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-500">
          Every feature in this portal is oriented around one goal: attracting
          and signing cosmetologists, estheticians, lash artists, massage
          therapists, and nail techs to Keeping It Cute. Content gets
          generated, leads get tracked, and results get measured.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Cosmetologists",
            "Estheticians",
            "Lash Artists",
            "Massage Therapists",
            "Nail Techs",
          ].map((role) => (
            <span
              key={role}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
