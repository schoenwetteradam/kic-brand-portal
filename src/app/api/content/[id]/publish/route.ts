import { NextRequest, NextResponse } from "next/server";
import { publishContent, isMetaConfigured } from "@/src/lib/meta-client";
import type { ContentAsset } from "@/src/types/brand";

const PI_BASE_URL = process.env.PI_BASE_URL;
const PI_API_KEY = process.env.PI_API_KEY;

async function piRequest(path: string, options?: RequestInit) {
  if (!PI_BASE_URL || !PI_API_KEY) throw new Error("Pi not configured");
  const res = await fetch(`${PI_BASE_URL}${path}`, {
    ...options,
    headers: {
      "x-brand-api-key": PI_API_KEY,
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Pi ${res.status}`);
  return res.json();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch content from Pi (or from request body if Pi unavailable)
  let content: Partial<ContentAsset>;
  try {
    content = await piRequest(`/brand/content/${id}`);
  } catch {
    try {
      content = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Could not load content to publish" },
        { status: 404 }
      );
    }
  }

  if (!isMetaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Meta not configured. Add META_ACCESS_TOKEN and META_PAGE_ID / INSTAGRAM_USER_ID to your environment variables in Settings.",
      },
      { status: 503 }
    );
  }

  const platform = content.platform;
  if (platform !== "instagram" && platform !== "facebook") {
    return NextResponse.json(
      {
        error: `Direct publish only supports instagram and facebook. Platform "${platform}" must be published manually.`,
      },
      { status: 422 }
    );
  }

  const caption =
    content.caption ||
    `${content.title}\n\n${(content.hashtags ?? []).map((h) => `#${h}`).join(" ")}`;

  try {
    const result = await publishContent({
      platform,
      caption,
      imageUrl: content.media_url,
    });

    // Record published state in Pi
    if (PI_BASE_URL && PI_API_KEY) {
      await piRequest(`/brand/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          approval_status: "approved",
          published_at: new Date().toISOString(),
          external_post_id: result.external_post_id,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      external_post_id: result.external_post_id,
      permalink: result.permalink,
      platform: result.platform,
      published_at: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
