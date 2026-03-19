/* eslint-disable @typescript-eslint/no-require-imports */
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ROLE_LABELS = {
  cosmetologist: "cosmetologists",
  esthetician: "estheticians",
  massage_therapist: "massage therapists",
  lash_artist: "lash artists",
  nail_tech: "nail technicians",
  general: "beauty professionals",
};

const DEFAULT_LOCATION = "Juneau, WI";
const DEFAULT_CTA = "DM us 'BOOTH' or book a tour to learn more about booth rental opportunities";

function buildFallbackResponse({ mode, role, location, message }) {
  const audience = ROLE_LABELS[role] || ROLE_LABELS.general;
  const locationName = location || DEFAULT_LOCATION;

  return {
    mode,
    summary: `Keeping It Cute should use ${mode} planning to attract ${audience} in ${locationName} and move them toward tours and signed booth rentals.${message ? ` Manager request: ${message}` : ""}`,
    priorities: [
      `Increase qualified ${audience} leads in ${locationName}`,
      "Book more tours from warm inquiries",
      "Improve follow-up speed and consistency",
      "Track which campaigns create signed renters",
    ],
    recommendations: [
      "Center every campaign on vegan-based, elevated, growth-focused salon positioning.",
      "Use local proof, salon culture, and business opportunity language in recruiting content.",
      "Create manager approval gates for public posts, ads, and personalized outreach.",
      "Measure leads, tours, and signed renters by role, platform, and theme.",
    ],
    campaigns: [
      {
        title: `Join Keeping It Cute in ${locationName}`,
        channel: "Instagram + Facebook",
        goal: "Drive local booth-renter awareness and tour bookings",
        notes: "Show salon space, clean beauty positioning, and business growth upside.",
      },
      {
        title: "Booth renter spotlight pipeline",
        channel: "Instagram Reels + Stories",
        goal: "Create interest with real culture and behind-the-scenes content",
        notes: "Feature lifestyle, work environment, and what a renter gains by joining.",
      },
      {
        title: "Warm lead conversion follow-up",
        channel: "SMS + email + DM",
        goal: "Move interested professionals from inquiry to scheduled tour",
        notes: "Answer objections and keep the salon top of mind.",
      },
    ],
    content_plan: [
      {
        day: "Monday",
        platform: "Instagram Reel",
        content_type: "reel_script",
        theme: "Vegan-based salon tour and booth reveal",
        cta: DEFAULT_CTA,
      },
      {
        day: "Tuesday",
        platform: "Facebook Post",
        content_type: "post",
        theme: "Why independent beauty pros choose Keeping It Cute",
        cta: DEFAULT_CTA,
      },
      {
        day: "Wednesday",
        platform: "Instagram Stories",
        content_type: "story_sequence",
        theme: "Manager Q&A on booth rental life",
        cta: "Reply BOOTH for pricing and tour openings",
      },
      {
        day: "Thursday",
        platform: "Email",
        content_type: "email_template",
        theme: "Invitation to local beauty professionals",
        cta: "Book a booth rental tour this week",
      },
      {
        day: "Friday",
        platform: "Instagram Post",
        content_type: "post",
        theme: "Salon culture and opportunity spotlight",
        cta: DEFAULT_CTA,
      },
    ],
    next_actions: [
      "Approve the strongest campaign angle",
      "Convert the best content ideas into drafts",
      "Queue follow-up messaging for warm leads",
      "Review lead and tour outcomes next week",
    ],
  };
}

function buildPrompt({ mode, role, location, message }) {
  return `You are the autonomous recruiting agent for Keeping It Cute Salon & Spa in Juneau, Wisconsin.

The salon is a thriving vegan-based salon and spa. The goal is to attract booth renters, increase conversions, and grow revenue.

Requested mode: ${mode}
Primary audience: ${ROLE_LABELS[role] || ROLE_LABELS.general}
Primary location: ${location || DEFAULT_LOCATION}
Manager request: ${message || "No extra request provided"}

Return only valid JSON with this shape:
{
  "mode": "strategy | research | content | schedule",
  "summary": "string",
  "priorities": ["string"],
  "recommendations": ["string"],
  "campaigns": [{ "title": "string", "channel": "string", "goal": "string", "notes": "string" }],
  "content_plan": [{ "day": "string", "platform": "string", "content_type": "string", "theme": "string", "cta": "string" }],
  "next_actions": ["string"]
}

Keep the response practical for salon managers. Focus on booth renter recruiting, local marketing, follow-up, and conversion.`;
}

async function generateAgentTaskResult(input) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5",
        input: buildPrompt(input),
      });

      const text = response.output_text || "";
      const parsed = JSON.parse(text);
      return {
        ...parsed,
        mode: input.mode,
      };
    } catch (error) {
      console.error("generateAgentTaskResult OpenAI fallback:", error.message);
    }
  }

  return buildFallbackResponse(input);
}

module.exports = {
  generateAgentTaskResult,
  buildFallbackResponse,
};
