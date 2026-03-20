import type { RoleType } from "@/types/brand";

export type AgentMode = "strategy" | "research" | "content" | "schedule";

export type AgentTaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "approved"
  | "rejected";

export type CampaignBrief = {
  title: string;
  channel: string;
  goal: string;
  notes: string;
};

export type ScheduleItem = {
  day: string;
  platform: string;
  content_type: string;
  theme: string;
  cta: string;
};

export type AgentCommandRequest = {
  message?: string;
  mode?: AgentMode;
  role?: RoleType | "general";
  location?: string;
};

export type AgentCommandResponse = {
  mode: AgentMode;
  summary: string;
  priorities: string[];
  recommendations: string[];
  campaigns: CampaignBrief[];
  content_plan: ScheduleItem[];
  next_actions: string[];
};

export type AgentTaskRecord = {
  id: string;
  mode: AgentMode;
  role: RoleType | "general";
  location: string;
  message: string;
  status: AgentTaskStatus;
  created_at: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  error_text?: string;
  result?: AgentCommandResponse | null;
};
