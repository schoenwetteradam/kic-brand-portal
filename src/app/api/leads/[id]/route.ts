import { NextRequest, NextResponse } from "next/server";
import { normalizeLead } from "@/lib/brand-normalizers";
import { piRequest } from "@/lib/pi";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await piRequest(`/brand/leads/${id}`);
    return NextResponse.json(normalizeLead(data));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
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

  const payload = {
    status: body.status,
    notes: body.notes,
    nextFollowUpAt: body.next_follow_up_at,
    lastContactedAt: body.last_contacted_at,
  };

  try {
    const data = await piRequest(`/brand/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(normalizeLead(data.lead ?? data));
  } catch {
    return NextResponse.json(normalizeLead({ id, ...body }));
  }
}
