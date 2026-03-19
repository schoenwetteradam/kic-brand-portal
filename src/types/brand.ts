export type ContentType =
  | "post"
  | "reel_script"
  | "ad_copy"
  | "email_template"
  | "dm_template"
  | "landing_page_copy";

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google_business"
  | "email"
  | "sms";

export type RoleType =
  | "cosmetologist"
  | "esthetician"
  | "massage_therapist"
  | "lash_artist"
  | "nail_tech"
  | "general";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "tour_scheduled"
  | "interviewed"
  | "pending_decision"
  | "signed"
  | "lost";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface ContentAsset {
  id: string;
  campaign_id?: string;
  content_type: ContentType;
  platform: Platform;
  title: string;
  caption: string;
  script?: string;
  cta: string;
  hashtags: string[];
  media_url?: string;
  approval_status: ApprovalStatus;
  scheduled_for?: string;
  published_at?: string;
  external_post_id?: string;
  audience: RoleType;
  location?: string;
  theme?: string;
  created_at: string;
}

export interface RecruitmentLead {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role_type: RoleType;
  specialty?: string;
  source: string;
  campaign_id?: string;
  city?: string;
  status: LeadStatus;
  notes?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  objective: string;
  target_roles: RoleType[];
  target_locations: string[];
  budget?: number;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  posts_per_week?: number;
  created_at: string;
}

export interface BrandMetrics {
  new_leads_7d: number;
  tours_booked: number;
  signed_renters: number;
  active_campaigns: number;
  pending_approvals: number;
  scheduled_posts: number;
}

export interface GenerateContentRequest {
  content_type: ContentType;
  platform: Platform;
  audience: RoleType;
  location: string;
  tone: string;
  theme: string;
  cta: string;
  offer?: string;
}

export interface GenerateContentResponse {
  title: string;
  caption: string;
  script?: string;
  hashtags: string[];
  cta: string;
  content_type: ContentType;
  platform: Platform;
  audience: RoleType;
  location: string;
}
