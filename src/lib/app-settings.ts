export type AppSettings = {
  integrations: {
    pi_base_url: string;
    pi_api_key: string;
    openai_enabled: boolean;
    twilio_from_number: string;
    wix_rental_form_url: string;
  };
  automation: {
    auto_generate_daily: boolean;
    auto_followup_stale_leads: boolean;
    followup_after_days: number;
    auto_post_approved: boolean;
    weekly_campaign_summary: boolean;
    instant_lead_response: boolean;
    require_manager_approval: boolean;
    daily_content_goal: number;
  };
  brand: {
    salon_name: string;
    default_location: string;
    service_areas: string;
    default_cta: string;
    default_tone: string;
    instagram_handle: string;
    facebook_page: string;
  };
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  integrations: {
    pi_base_url: process.env.PI_BASE_URL || process.env.PI_API_BASE_URL || "",
    pi_api_key: process.env.PI_API_KEY || "",
    openai_enabled: Boolean(process.env.OPENAI_API_KEY),
    twilio_from_number: process.env.TWILIO_FROM_NUMBER || "",
    wix_rental_form_url: process.env.WIX_RENTAL_FORM_URL || "",
  },
  automation: {
    auto_generate_daily: true,
    auto_followup_stale_leads: true,
    followup_after_days: 2,
    auto_post_approved: false,
    weekly_campaign_summary: true,
    instant_lead_response: true,
    require_manager_approval: true,
    daily_content_goal: 4,
  },
  brand: {
    salon_name: "Keeping It cUte Salon & Spa",
    default_location: "Dodge County, WI",
    service_areas: "Juneau, Beaver Dam, Watertown, Dodge County",
    default_cta: "DM us 'BOOTH' or apply through the link in bio",
    default_tone: "Warm and welcoming",
    instagram_handle: "@keepingitcutesalon",
    facebook_page: "Keeping It Cute Salon",
  },
};

export function mergeSettings(input?: Partial<AppSettings>): AppSettings {
  return {
    integrations: {
      ...DEFAULT_APP_SETTINGS.integrations,
      ...(input?.integrations ?? {}),
    },
    automation: {
      ...DEFAULT_APP_SETTINGS.automation,
      ...(input?.automation ?? {}),
    },
    brand: {
      ...DEFAULT_APP_SETTINGS.brand,
      ...(input?.brand ?? {}),
    },
  };
}
