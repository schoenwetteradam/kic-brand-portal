import { NextRequest, NextResponse } from "next/server";
import { buildFallbackContent, buildOpenAIPrompt } from "@/src/lib/brand-prompts";
import type { GenerateContentRequest, GenerateContentResponse } from "@/src/types/brand";

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

  // 1. Try Pi backend first
  const PI_BASE_URL = process.env.PI_BASE_URL;
  const PI_API_KEY = process.env.PI_API_KEY;

  if (PI_BASE_URL && PI_API_KEY) {
    try {
      const piRes = await fetch(`${PI_BASE_URL}/brand/content/generate`, {
        method: "POST",
        headers: {
          "x-brand-api-key": PI_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      if (piRes.ok) {
        const data = await piRes.json();
        return NextResponse.json({
          ...data,
          content_type,
          platform,
          audience,
          location: location || "Dodge County, WI",
        } satisfies GenerateContentResponse);
      }
    } catch {
      // Fall through to OpenAI or template fallback
    }
  }

  // 2. Try OpenAI directly
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

  // 3. Template-based fallback — always works, no external deps
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
