import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildFallbackContent, buildOpenAIPrompt } from "@/src/lib/brand-prompts";
import type { ContentType, Platform, RoleType } from "@/src/types/brand";

const WEEKLY_BRIEF: Array<{
  content_type: ContentType;
  platform: Platform;
  audience: RoleType;
  theme: string;
}> = [
  { content_type: "post", platform: "instagram", audience: "cosmetologist", theme: "private suite" },
  { content_type: "post", platform: "facebook", audience: "esthetician", theme: "be your own boss" },
  { content_type: "reel_script", platform: "instagram", audience: "lash_artist", theme: "grow your clientele" },
  { content_type: "ad_copy", platform: "facebook", audience: "general", theme: "upscale environment" },
  { content_type: "post", platform: "instagram", audience: "nail_tech", theme: "community and culture" },
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const PI_BASE_URL = process.env.PI_BASE_URL;
  const PI_API_KEY = process.env.PI_API_KEY;
  const DEFAULT_CTA = "DM us 'BOOTH' or apply through the link in bio";

  const generated: unknown[] = [];
  const errors: string[] = [];

  for (const brief of WEEKLY_BRIEF) {
    const req_body = {
      ...brief,
      location: "Dodge County, WI",
      tone: "Warm and welcoming",
      cta: DEFAULT_CTA,
    };

    let content: Record<string, unknown> | null = null;

    // Try Pi backend
    if (PI_BASE_URL && PI_API_KEY) {
      try {
        const res = await fetch(`${PI_BASE_URL}/brand/content/generate`, {
          method: "POST",
          headers: {
            "x-brand-api-key": PI_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify(req_body),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          content = { ...(await res.json()), ...brief };
        }
      } catch {
        // Fall through
      }
    }

    // Try Claude for AI-generated content
    if (!content && process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const prompt = buildOpenAIPrompt(req_body);
        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });
        const text =
          message.content[0].type === "text" ? message.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const raw = JSON.parse(jsonMatch[0]);
          content = { ...raw, ...brief, location: "Dodge County, WI" };
        }
      } catch {
        // Fall through to template
      }
    }

    // Fallback to template generation
    if (!content) {
      const fallback = buildFallbackContent(req_body);
      content = { ...fallback, ...brief, location: "Dodge County, WI" };
    }

    // Save to Pi as draft
    if (PI_BASE_URL && PI_API_KEY) {
      try {
        await fetch(`${PI_BASE_URL}/brand/content`, {
          method: "POST",
          headers: {
            "x-brand-api-key": PI_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({ ...content, approval_status: "pending" }),
          signal: AbortSignal.timeout(10000),
        });
      } catch (err: unknown) {
        errors.push(`Save failed for ${brief.content_type}/${brief.audience}: ${err}`);
      }
    }

    generated.push(content);
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    generated: generated.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
