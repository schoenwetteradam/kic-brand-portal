import { NextRequest, NextResponse } from "next/server";
import { normalizeContent } from "@/src/lib/brand-normalizers";
import { piRequest } from "@/src/lib/pi";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.scheduled_for) {
    return NextResponse.json({ error: "scheduled_for is required" }, { status: 400 });
  }

  try {
    const data = await piRequest(`/brand/content/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledFor: body.scheduled_for }),
    });
    return NextResponse.json(
      normalizeContent({
        id,
        status: data.content?.status || "scheduled",
        scheduledFor: data.content?.scheduledFor || body.scheduled_for,
      })
    );
  } catch {
    return NextResponse.json({ error: "Could not schedule content." }, { status: 503 });
  }
}
