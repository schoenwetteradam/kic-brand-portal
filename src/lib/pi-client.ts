import type {
  BrandMetrics,
  Campaign,
  ContentAsset,
  GenerateContentRequest,
  GenerateContentResponse,
  RecruitmentLead,
} from "@/src/types/brand";

const PI_BASE_URL = process.env.PI_BASE_URL;
const PI_API_KEY = process.env.PI_API_KEY;

async function piFetch(path: string, options?: RequestInit) {
  if (!PI_BASE_URL) throw new Error("Missing PI_BASE_URL");
  if (!PI_API_KEY) throw new Error("Missing PI_API_KEY");

  const res = await fetch(`${PI_BASE_URL}${path}`, {
    ...options,
    headers: {
      "x-brand-api-key": PI_API_KEY,
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PI request failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ── Salon operations ──────────────────────────────────────────────────────────

export async function getMetrics() {
  return piFetch("/brand/metrics");
}

export async function getTopServices() {
  return piFetch("/brand/top-services");
}

export async function getLowStock() {
  return piFetch("/brand/low-stock-products");
}

// ── Brand / recruiting metrics ─────────────────────────────────────────────────

export async function getBrandMetrics(): Promise<BrandMetrics> {
  return piFetch("/brand/recruiting-metrics");
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  return piFetch("/brand/campaigns");
}

export async function createCampaign(
  data: Omit<Campaign, "id" | "created_at">
): Promise<Campaign> {
  return piFetch("/brand/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(
  id: string,
  data: Partial<Campaign>
): Promise<Campaign> {
  return piFetch(`/brand/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Content ───────────────────────────────────────────────────────────────────

export async function getContent(params?: {
  status?: string;
  campaign_id?: string;
}): Promise<ContentAsset[]> {
  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return piFetch(`/brand/content${qs}`);
}

export async function generateContent(
  req: GenerateContentRequest
): Promise<GenerateContentResponse> {
  return piFetch("/brand/content/generate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function approveContent(id: string): Promise<ContentAsset> {
  return piFetch(`/brand/content/${id}/approve`, { method: "POST" });
}

export async function rejectContent(id: string): Promise<ContentAsset> {
  return piFetch(`/brand/content/${id}/reject`, { method: "POST" });
}

export async function scheduleContent(
  id: string,
  scheduled_for: string
): Promise<ContentAsset> {
  return piFetch(`/brand/content/${id}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduled_for }),
  });
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function getLeads(params?: {
  status?: string;
}): Promise<RecruitmentLead[]> {
  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return piFetch(`/brand/leads${qs}`);
}

export async function createLead(
  data: Omit<RecruitmentLead, "id" | "created_at">
): Promise<RecruitmentLead> {
  return piFetch("/brand/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLead(
  id: string,
  data: Partial<RecruitmentLead>
): Promise<RecruitmentLead> {
  return piFetch(`/brand/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
