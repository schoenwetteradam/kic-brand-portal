import { NextRequest, NextResponse } from "next/server";
import { buildFallbackContent, buildOpenAIPrompt } from "@/lib/brand-prompts";
import { normalizeGenerateResponse } from "@/lib/brand-normalizers";
import { isPiConfigured, PI_BASE_URL, PI_API_KEY } from "@/lib/pi";
import type { GenerateContentRequest, GenerateContentResponse } from "@/types/brand";

const CONTENT_TYPE_MAP: Record<string, string> = {
  post: "post",
  reel_script: "reel",
  ad_copy: "ad",
  email_template: "email",
  dm_template: "sms",
  landing_page_copy: "post",
};

function buildPiPayload(body: GenerateContentRequest) {
  return {
    audience: body.audience.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase()),
    city: body.location,
    platform: body.platform.charAt(0).toUpperCase() + body.platform.slice(1).replace(/_/g, " "),
    contentType: CONTENT_TYPE_MAP[body.content_type] || "post",
    hook: body.theme || "Because You Deserve Better",
    cta: body.cta,
  };
}

export async function POST(req: NextRequest) {
  let body: GenerateContentRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { content_type, platform, audience, location, tone, theme, cta, offer } = body;

  if (!content_type || !platform || !audience) {
    return NextResponse.json(
      { error: "content_type, platform, and audience are required" },
      { status: 400 }
    );
  }

  if (isPiConfigured()) {
    try {
      const piRes = await fetch(`${PI_BASE_URL}/brand/content/generate`, {
        method: "POST",
        headers: {
          "x-api-key": PI_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(buildPiPayload(body)),
        signal: AbortSignal.timeout(15000),
      });

      if (piRes.ok) {
        const data = await piRes.json();
        return NextResponse.json(
          normalizeGenerateResponse(data.content ?? data.generated ?? data),
        );
      }
    } catch {
      // Fall through to OpenAI or template fallback
    }
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (OPENAI_API_KEY) {
    try {
      const prompt = buildOpenAIPrompt(body);
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (oaiRes.ok) {
        const oaiData = await oaiRes.json();
        const raw = JSON.parse(oaiData.choices[0].message.content);
        return NextResponse.json({
          title: raw.title ?? "",
          caption: raw.caption ?? "",
          script: raw.script ?? "",
          hashtags: raw.hashtags ?? [],
          cta: raw.cta ?? cta,
          content_type,
          platform,
          audience,
          location: location || "Dodge County, WI",
        } satisfies GenerateContentResponse);
      }
    } catch {
      // Fall through to template fallback
    }
  }

  const fallback = buildFallbackContent({
    content_type,
    platform,
    audience,
    location: location || "Dodge County, WI",
    tone: tone || "Warm and welcoming",
    theme: theme || "private suite",
    cta: cta || "DM us 'BOOTH' or apply through the link in bio",
    offer,
  });

  return NextResponse.json({
    ...fallback,
    content_type,
    platform,
    audience,
    location: location || "Dodge County, WI",
  } satisfies GenerateContentResponse);
}
