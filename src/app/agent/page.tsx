"use client";

import { useState } from "react";
import type { RoleType } from "@/src/types/brand";

type AgentMode = "strategy" | "research" | "content" | "schedule";

type AgentResponse = {
  mode: AgentMode;
  summary: string;
  priorities: string[];
  recommendations: string[];
  campaigns: Array<{
    title: string;
    channel: string;
    goal: string;
    notes: string;
  }>;
  content_plan: Array<{
    day: string;
    platform: string;
    content_type: string;
    theme: string;
    cta: string;
  }>;
  next_actions: string[];
};

const MODE_OPTIONS: Array<{ value: AgentMode; label: string; description: string }> = [
  {
    value: "strategy",
    label: "Growth Strategy",
    description: "Ask the agent what to focus on to increase leads and booth-rental revenue.",
  },
  {
    value: "research",
    label: "Lead Research",
    description: "Plan lead sourcing, market research, and local talent discovery workflows.",
  },
  {
    value: "content",
    label: "Content Planning",
    description: "Generate campaign ideas and recruiting content direction.",
  },
  {
    value: "schedule",
    label: "Schedule Planning",
    description: "Build a weekly recruiting content cadence for salon managers to review.",
  },
];

const QUICK_PROMPTS = [
  "Build a weekly content plan to attract cosmetologists in Beaver Dam, WI.",
  "How should the agent find and convert local nail tech booth renters?",
  "Give me a revenue-focused recruiting strategy for the next 30 days.",
  "Create a plan our salon manager can approve and schedule each week.",
];

export default function AgentPage() {
  const [mode, setMode] = useState<AgentMode>("strategy");
  const [role, setRole] = useState<RoleType | "general">("general");
  const [location, setLocation] = useState("Dodge County, WI");
  const [message, setMessage] = useState(
    "Build an autonomous recruiting system that attracts new booth renters, increases conversions, and lets managers approve content and scheduling."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentResponse | null>(null);

  async function runAgent(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, role, location, message }),
      });

      if (!res.ok) {
        throw new Error("The agent request failed.");
      }

      const data: AgentResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not run agent request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Agent Console
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Manager + Admin AI Workspace
          </h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            This is the control center for the autonomous recruiting agent. Managers can use it
            to guide strategy, request content, review schedules, and shape how the salon grows
            booth-rental revenue.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Vercel should host this admin experience. The Pi should run the always-on automation.
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1.15fr]">
        <form onSubmit={runAgent} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Task Type
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    mode === option.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <p className={`mt-1 text-xs leading-relaxed ${mode === option.value ? "text-slate-200" : "text-slate-500"}`}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType | "general")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="general">All Beauty Pros</option>
                <option value="cosmetologist">Cosmetologists</option>
                <option value="esthetician">Estheticians</option>
                <option value="massage_therapist">Massage Therapists</option>
                <option value="lash_artist">Lash Artists</option>
                <option value="nail_tech">Nail Technicians</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Market Focus
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="e.g. Beaver Dam, WI"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Manager Request
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-slate-400 focus:outline-none"
              placeholder="Tell the agent what you want it to work on."
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick Prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Running agent..." : "Run Agent Task"}
          </button>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-sm">
          {!result ? (
            <div className="flex min-h-[620px] items-center justify-center">
              <div className="max-w-md text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Agent Output
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Ready for manager instructions</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Run a task to get a recruiting strategy, lead research plan, content plan, or
                  weekly schedule the salon team can act on.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Summary
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-100">{result.summary}</p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <InfoCard title="Priorities" items={result.priorities} />
                <InfoCard title="Recommendations" items={result.recommendations} />
              </div>

              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Campaign Ideas
                </p>
                <div className="mt-3 space-y-3">
                  {result.campaigns.map((campaign) => (
                    <div key={campaign.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{campaign.title}</h3>
                        <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {campaign.channel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{campaign.goal}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{campaign.notes}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Weekly Content Plan
                </p>
                <div className="mt-3 overflow-hidden rounded-3xl border border-white/10">
                  <div className="grid grid-cols-[0.9fr_1fr_1fr_1.2fr] border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <div>Day</div>
                    <div>Platform</div>
                    <div>Type</div>
                    <div>Theme</div>
                  </div>
                  {result.content_plan.map((item) => (
                    <div
                      key={`${item.day}-${item.platform}-${item.theme}`}
                      className="grid grid-cols-[0.9fr_1fr_1fr_1.2fr] gap-3 border-b border-white/10 px-4 py-3 text-sm text-slate-100 last:border-b-0"
                    >
                      <div>{item.day}</div>
                      <div>{item.platform}</div>
                      <div>{item.content_type}</div>
                      <div>{item.theme}</div>
                    </div>
                  ))}
                </div>
              </section>

              <InfoCard title="Next Build Actions" items={result.next_actions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-100">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
