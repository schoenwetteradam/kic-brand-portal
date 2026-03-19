import { NextRequest, NextResponse } from "next/server";
import type { RoleType } from "@/src/types/brand";

type AgentMode = "strategy" | "research" | "content" | "schedule";

type AgentCommandRequest = {
  message?: string;
  mode?: AgentMode;
  role?: RoleType | "general";
  location?: string;
};

type CampaignBrief = {
  title: string;
  channel: string;
  goal: string;
  notes: string;
};

type ScheduleItem = {
  day: string;
  platform: string;
  content_type: string;
  theme: string;
  cta: string;
};

type AgentCommandResponse = {
  mode: AgentMode;
  summary: string;
  priorities: string[];
  recommendations: string[];
  campaigns: CampaignBrief[];
  content_plan: ScheduleItem[];
  next_actions: string[];
};

const ROLE_LABELS: Record<string, string> = {
  cosmetologist: "cosmetologists",
  esthetician: "estheticians",
  massage_therapist: "massage therapists",
  lash_artist: "lash artists",
  nail_tech: "nail technicians",
  general: "beauty professionals",
};

const DEFAULT_LOCATION = "Dodge County, WI";
const DEFAULT_CTA = "DM us 'BOOTH' or book a tour to learn about booth rentals";

function buildFallbackResponse({
  mode,
  role,
  location,
  message,
}: Required<Pick<AgentCommandRequest, "mode" | "role" | "location">> & { message: string }): AgentCommandResponse {
  const audience = ROLE_LABELS[role] || ROLE_LABELS.general;
  const locationName = location || DEFAULT_LOCATION;

  const commonCampaigns: CampaignBrief[] = [
    {
      title: `Local ${audience} spotlight campaign`,
      channel: "Instagram + Facebook",
      goal: "Attract qualified local beauty pros into a tour funnel",
      notes: `Showcase booth quality, culture, flexible terms, and why ${locationName} professionals should choose Keeping It cUte.`,
    },
    {
      title: "Referral booster campaign",
      channel: "Instagram stories + in-salon signage",
      goal: "Turn current clients and stylists into referral sources",
      notes: "Ask your network to tag or refer professionals who may want a better salon home.",
    },
    {
      title: "Tour conversion follow-up",
      channel: "SMS + DM + email",
      goal: "Move warm leads from interested to tour booked to signed",
      notes: "Use timed follow-ups, FAQ replies, and proof of business upside.",
    },
  ];

  const contentPlan: ScheduleItem[] = [
    {
      day: "Monday",
      platform: "Instagram Reel",
      content_type: "reel_script",
      theme: "Salon walk-through and booth reveal",
      cta: DEFAULT_CTA,
    },
    {
      day: "Tuesday",
      platform: "Facebook Post",
      content_type: "post",
      theme: "Why independent beauty pros choose KIC",
      cta: DEFAULT_CTA,
    },
    {
      day: "Wednesday",
      platform: "Instagram Stories",
      content_type: "story_sequence",
      theme: "Behind-the-scenes manager Q&A",
      cta: "Reply BOOTH for pricing and tour openings",
    },
    {
      day: "Thursday",
      platform: "Email",
      content_type: "email_template",
      theme: "Professional invitation to local renters",
      cta: "Book a salon tour this week",
    },
    {
      day: "Friday",
      platform: "Instagram Post",
      content_type: "post",
      theme: "Testimonial or culture highlight",
      cta: DEFAULT_CTA,
    },
  ];

  const modeSummary: Record<AgentMode, string> = {
    strategy: `The agent should focus on building a repeatable booth-renter funnel for ${audience} in ${locationName}, with manager approvals around publishing and outreach.`,
    research: `The agent needs a research pipeline for ${audience} in ${locationName}: competitor monitoring, local talent discovery, warm-lead scoring, and outreach-ready notes.`,
    content: `The agent should operate as a recruiting content studio for ${audience} in ${locationName}, producing conversion-focused posts, reels, stories, and follow-up copy.`,
    schedule: `The agent should maintain a weekly recruiting cadence for ${audience} in ${locationName}, balancing awareness posts, social proof, offers, and direct tour CTAs.`,
  };

  const recommendations: Record<AgentMode, string[]> = {
    strategy: [
      "Treat Vercel as the manager/admin console and orchestration layer.",
      "Treat the Pi as the always-on worker for follow-up automation, platform connectors, and long-running jobs.",
      "Add approval gates for publishing, paid ads, and external outreach.",
      "Store lead source, tour date, objections, and signed revenue so the agent can learn what converts.",
    ],
    research: [
      "Add a lead-research worker that tracks local beauty pros, salon moves, and competitor hiring activity.",
      "Create a lead score based on location, specialty, client quality, social presence, and fit for KIC.",
      "Save research findings into the lead record so managers see why a prospect is promising.",
      "Let admins trigger research batches from the portal by role and city.",
    ],
    content: [
      "Generate content in weekly batches, not one-off posts, so managers can approve a pipeline.",
      "Tie every piece of content to a campaign, role target, location, and CTA.",
      "Add direct publishing support for Meta and queue anything requiring tokens on the Pi.",
      "Track which hooks and offers produce actual tours and signed renters.",
    ],
    schedule: [
      "Use a recurring weekly posting schedule with local recruiting focus.",
      "Include at least two direct-response opportunities each week.",
      "Build reminder alerts for stale drafts, unscheduled approved content, and empty weeks.",
      "Expose schedule control to managers from one calendar-style interface.",
    ],
  };

  return {
    mode,
    summary: `${modeSummary[mode]}${message ? ` Manager request: ${message}` : ""}`,
    priorities: [
      `Increase qualified ${audience} leads`,
      "Improve tour booking conversion",
      "Shorten time from inquiry to follow-up",
      "Measure which campaigns produce signed renters",
    ],
    recommendations: recommendations[mode],
    campaigns: commonCampaigns,
    content_plan: contentPlan,
    next_actions: [
      "Build persistent agent settings and manager roles",
      "Add platform publishing connectors and approval workflow",
      "Add Pi-side autonomous workers for research, follow-up, and scheduling",
      "Track revenue impact from signed booth renters back to campaigns",
    ],
  };
}

function coerceMode(value: unknown): AgentMode {
  return value === "research" || value === "content" || value === "schedule"
    ? value
    : "strategy";
}

function coerceRole(value: unknown): RoleType | "general" {
  return typeof value === "string" &&
    ["cosmetologist", "esthetician", "massage_therapist", "lash_artist", "nail_tech", "general"].includes(value)
    ? (value as RoleType | "general")
    : "general";
}

function buildOpenAIPrompt(input: Required<Pick<AgentCommandRequest, "mode" | "role" | "location">> & { message: string }) {
  return `You are the autonomous growth agent for Keeping It cUte Salon & Spa.

Business goal:
- Attract more booth-rental leads
- Increase booth-rental conversions
- Help the salon make more money
- Support salon managers/admins with guided actions

Requested mode: ${input.mode}
Primary audience: ${ROLE_LABELS[input.role] || ROLE_LABELS.general}
Primary location: ${input.location}
Manager request: ${input.message || "No extra request provided"}

Return only valid JSON with this shape:
{
  "mode": "strategy | research | content | schedule",
  "summary": "string",
  "priorities": ["string"],
  "recommendations": ["string"],
  "campaigns": [
    {
      "title": "string",
      "channel": "string",
      "goal": "string",
      "notes": "string"
    }
  ],
  "content_plan": [
    {
      "day": "string",
      "platform": "string",
      "content_type": "string",
      "theme": "string",
      "cta": "string"
    }
  ],
  "next_actions": ["string"]
}

Focus on practical execution for a salon manager. Keep it concrete, revenue-oriented, and local-market aware.`;
}

export async function POST(req: NextRequest) {
  let body: AgentCommandRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mode = coerceMode(body.mode);
  const role = coerceRole(body.role);
  const location = body.location?.trim() || DEFAULT_LOCATION;
  const message = body.message?.trim() || "";

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.5,
          messages: [
            {
              role: "user",
              content: buildOpenAIPrompt({ mode, role, location, message }),
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content) as AgentCommandResponse;
        return NextResponse.json({
          ...parsed,
          mode,
        } satisfies AgentCommandResponse);
      }
    } catch {
      // Fall back to deterministic local response
    }
  }

  return NextResponse.json(
    buildFallbackResponse({ mode, role, location, message })
  );
}
