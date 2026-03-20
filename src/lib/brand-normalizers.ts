import type {
  Campaign,
  ContentAsset,
  ContentType,
  Platform,
  RecruitmentLead,
  RoleType,
} from "@/types/brand";

type LooseRecord = Record<string, unknown>;

function normalizeRoleType(value?: string): RoleType {
  const key = (value || "general").toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, RoleType> = {
    cosmetologist: "cosmetologist",
    esthetician: "esthetician",
    massage_therapist: "massage_therapist",
    lash_artist: "lash_artist",
    nail_tech: "nail_tech",
    general: "general",
  };
  return map[key] || "general";
}

function normalizePlatform(value?: string): Platform {
  const key = (value || "instagram").toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, Platform> = {
    instagram: "instagram",
    facebook: "facebook",
    tiktok: "tiktok",
    google_business: "google_business",
    email: "email",
    sms: "sms",
  };
  return map[key] || "instagram";
}

function normalizeContentType(value?: string): ContentType {
  const key = (value || "post").toLowerCase();
  const map: Record<string, ContentType> = {
    post: "post",
    reel: "reel_script",
    reel_script: "reel_script",
    ad: "ad_copy",
    ad_copy: "ad_copy",
    email: "email_template",
    email_template: "email_template",
    sms: "dm_template",
    dm_template: "dm_template",
    landing_page_copy: "landing_page_copy",
  };
  return map[key] || "post";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : undefined;
}

export function normalizeCampaign(campaign: LooseRecord): Campaign {
  return {
    id: asString(campaign.id) || `local_${Date.now()}`,
    name: asString(campaign.name) || "Untitled campaign",
    type: asString(campaign.type) || "social",
    objective: asString(campaign.objective) || "",
    target_roles: asStringArray(campaign.audience).map((role) => normalizeRoleType(role)),
    target_locations: asStringArray(campaign.locations).length
      ? asStringArray(campaign.locations)
      : asStringArray(campaign.target_locations),
    budget: asNumber(campaign.budget),
    status: (asString(campaign.status) as Campaign["status"]) || "draft",
    start_date: asString(campaign.startDate) || asString(campaign.start_date),
    end_date: asString(campaign.endDate) || asString(campaign.end_date),
    posts_per_week: asNumber(campaign.posts_per_week),
    created_at: asString(campaign.createdAt) || asString(campaign.created_at) || new Date().toISOString(),
  };
}

export function normalizeLead(lead: LooseRecord): RecruitmentLead {
  return {
    id: asString(lead.id) || `local_${Date.now()}`,
    full_name: asString(lead.fullName) || asString(lead.full_name) || "Unknown lead",
    email: asString(lead.email) || "",
    phone: asString(lead.phone),
    role_type: normalizeRoleType(asString(lead.roleType) || asString(lead.role_type)),
    specialty: asString(lead.specialty),
    source: asString(lead.source) || "manual",
    campaign_id: asString(lead.campaignId) || asString(lead.campaign_id),
    city: asString(lead.city),
    status: (asString(lead.status) as RecruitmentLead["status"]) || "new",
    notes: asString(lead.notes),
    last_contacted_at: asString(lead.lastContactedAt) || asString(lead.last_contacted_at),
    next_follow_up_at: asString(lead.nextFollowUpAt) || asString(lead.next_follow_up_at),
    created_at: asString(lead.createdAt) || asString(lead.created_at) || new Date().toISOString(),
  };
}

export function normalizeContent(content: LooseRecord): ContentAsset {
  return {
    id: asString(content.id) || `local_${Date.now()}`,
    campaign_id: asString(content.campaignId) || asString(content.campaign_id),
    content_type: normalizeContentType(asString(content.contentType) || asString(content.content_type)),
    platform: normalizePlatform(asString(content.platform)),
    title: asString(content.title) || "Untitled content",
    caption: asString(content.caption) || "",
    script: asString(content.script) || "",
    cta: asString(content.cta) || "",
    hashtags: asStringArray(content.hashtags),
    media_url: asString(content.mediaUrl) || asString(content.media_url),
    approval_status: (asString(content.status) || asString(content.approval_status) || "draft") as ContentAsset["approval_status"],
    scheduled_for: asString(content.scheduledFor) || asString(content.scheduled_for),
    published_at: asString(content.publishedAt) || asString(content.published_at),
    external_post_id: asString(content.externalPostId) || asString(content.external_post_id),
    audience: normalizeRoleType(asString(content.audience)),
    location: asString(content.city) || asString(content.location),
    theme: asString(content.hook) || asString(content.theme),
    created_at: asString(content.createdAt) || asString(content.created_at) || new Date().toISOString(),
  };
}

export function normalizeGenerateResponse(content: LooseRecord) {
  const normalized = normalizeContent(content);
  return {
    id: normalized.id,
    title: normalized.title,
    caption: normalized.caption,
    script: normalized.script,
    hashtags: normalized.hashtags,
    cta: normalized.cta,
    content_type: normalized.content_type,
    platform: normalized.platform,
    audience: normalized.audience,
    location: normalized.location || "Dodge County, WI",
    approval_status: normalized.approval_status,
    scheduled_for: normalized.scheduled_for,
    created_at: normalized.created_at,
  };
}
