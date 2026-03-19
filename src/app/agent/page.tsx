"use client";

import { useEffect, useState } from "react";
import type { RoleType } from "@/src/types/brand";
import type { AgentMode, AgentTaskRecord } from "@/src/types/agent";

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
  "Generate 10 booth renter recruitment post ideas for nail technicians and lash artists in Dodge County.",
  "Create 5 warm but professional Instagram captions for attracting cosmetologists.",
  "Build a 7-day recruiting content plan for Keeping It Cute Salon & Spa.",
  "Suggest 5 reel ideas showing why beauty professionals should join our salon.",
  "Create 3 Meta ad concepts for attracting estheticians and massage therapists.",
];

export default function AgentPage() {
  const [mode, setMode] = useState<AgentMode>("strategy");
  const [role, setRole] = useState<RoleType | "general">("general");
  const [location, setLocation] = useState("Juneau, WI");
  const [message, setMessage] = useState(
    "Build an autonomous recruiting system that attracts new booth renters, increases conversions, and lets managers approve content and scheduling."
  );
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<AgentTaskRecord[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;

  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/agent/tasks", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load agent tasks.");
      }

      const data = await res.json();
      const nextTasks = Array.isArray(data) ? data : data.tasks || [];
      setTasks(nextTasks);
      if (!selectedTaskId && nextTasks[0]?.id) {
        setSelectedTaskId(nextTasks[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load agent tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.task) {
        throw new Error(data.error ?? "The agent request failed.");
      }

      setTasks((prev) => [data.task, ...prev.filter((task) => task.id !== data.task.id)]);
      setSelectedTaskId(data.task.id);
      if (data.queued) {
        setError("Task queued on the Pi worker. Refresh in a moment to see the result.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not run agent request.");
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/agent/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.task) {
        throw new Error(data.error ?? "Could not update agent task.");
      }

      setTasks((prev) => prev.map((task) => (task.id === id ? data.task : task)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update agent task.");
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
            Submit recruiting tasks, review results, approve strong ideas, and let the Pi worker
            process queued autonomy jobs in the background.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Vercel hosts the control room. The Pi runs the worker queue.
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-8">
          <form
            onSubmit={runAgent}
            className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
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
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        mode === option.value ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Agent Task"}
              </button>
              <button
                type="button"
                onClick={() => void loadTasks()}
                disabled={loadingTasks}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Task Queue
                </p>
                <h2 className="mt-1 text-lg font-semibold">Submitted Manager Requests</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {tasks.length} task{tasks.length === 1 ? "" : "s"}
              </span>
            </div>

            {loadingTasks ? (
              <p className="text-sm text-slate-400">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-400">No agent tasks yet.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedTask?.id === task.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{task.message}</div>
                        <div
                          className={`mt-1 text-xs ${
                            selectedTask?.id === task.id ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {task.mode} • {task.location}
                        </div>
                      </div>
                      <StatusPill status={task.status} selected={selectedTask?.id === task.id} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-sm">
          {!selectedTask ? (
            <div className="flex min-h-[720px] items-center justify-center">
              <div className="max-w-md text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Task Result
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Ready for manager instructions</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Submit a task and the result or queue status will show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Selected Task
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{selectedTask.mode}</h2>
                </div>
                <StatusPill status={selectedTask.status} selected />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Manager Request
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-100">{selectedTask.message}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {selectedTask.location} • {selectedTask.role} • Created{" "}
                  {new Date(selectedTask.created_at).toLocaleString()}
                </p>
              </div>

              {selectedTask.status === "completed" && selectedTask.result ? (
                <>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Summary
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-100">
                      {selectedTask.result.summary}
                    </p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <InfoCard title="Priorities" items={selectedTask.result.priorities} />
                    <InfoCard title="Recommendations" items={selectedTask.result.recommendations} />
                  </div>

                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Campaign Ideas
                    </p>
                    <div className="mt-3 space-y-3">
                      {selectedTask.result.campaigns.map((campaign) => (
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
                      {selectedTask.result.content_plan.map((item) => (
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

                  <InfoCard title="Next Actions" items={selectedTask.result.next_actions} />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => void updateTaskStatus(selectedTask.id, "approved")}
                      className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateTaskStatus(selectedTask.id, "rejected")}
                      className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/5"
                    >
                      Reject
                    </button>
                  </div>
                </>
              ) : selectedTask.status === "failed" ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
                  {selectedTask.error_text || "The task failed before a result was returned."}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                  This task is currently <span className="font-semibold">{selectedTask.status}</span>.
                  If the Pi worker is running, refresh shortly to see the result.
                </div>
              )}
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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
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

function StatusPill({ status, selected = false }: { status: string; selected?: boolean }) {
  const styles: Record<string, string> = {
    queued: selected ? "bg-white/10 text-white" : "bg-amber-100 text-amber-800",
    running: selected ? "bg-white/10 text-white" : "bg-blue-100 text-blue-800",
    completed: selected ? "bg-white/10 text-white" : "bg-emerald-100 text-emerald-800",
    approved: selected ? "bg-white/10 text-white" : "bg-emerald-100 text-emerald-800",
    rejected: selected ? "bg-white/10 text-white" : "bg-red-100 text-red-800",
    failed: selected ? "bg-white/10 text-white" : "bg-red-100 text-red-800",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[status] || styles.queued}`}>
      {status}
    </span>
  );
}
