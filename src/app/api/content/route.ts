import { NextRequest, NextResponse } from "next/server";
import { normalizeContent } from "@/src/lib/brand-normalizers";
import { piRequest } from "@/src/lib/pi";

const STATUS_MAP: Record<string, string> = {
  drafts: "draft",
  approved: "approved",
  scheduled: "scheduled",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") ?? "";
  const status = STATUS_MAP[rawStatus] || rawStatus;

  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await piRequest(`/brand/content${qs}`);
    return NextResponse.json((Array.isArray(data) ? data : []).map(normalizeContent));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const payload = {
    campaignId: body.campaign_id ?? null,
    title: body.title,
    contentType: body.content_type,
    platform: body.platform,
    audience: body.audience,
    city: body.location,
    hook: body.theme,
    caption: body.caption ?? "",
    script: body.script ?? "",
    cta: body.cta,
    hashtags: body.hashtags ?? [],
    status: body.approval_status ?? "draft",
  };

  try {
    const data = await piRequest("/brand/content", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(normalizeContent(data.content ?? data), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save content. Connect Pi backend." },
      { status: 503 }
    );
  }
}
