import { NextRequest, NextResponse } from "next/server";
import { normalizeLead } from "@/src/lib/brand-normalizers";
import { piRequest } from "@/src/lib/pi";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await piRequest(`/brand/leads${qs}`);
    return NextResponse.json((Array.isArray(data) ? data : []).map(normalizeLead));
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

  if (!body.full_name || !body.role_type) {
    return NextResponse.json(
      { error: "full_name and role_type are required" },
      { status: 400 }
    );
  }

  const payload = {
    campaignId: body.campaign_id ?? null,
    fullName: body.full_name,
    email: body.email ?? null,
    phone: body.phone ?? null,
    roleType: body.role_type,
    specialty: body.specialty ?? null,
    city: body.city ?? null,
    source: body.source ?? "manual",
    notes: body.notes ?? null,
    status: body.status ?? "new",
  };

  try {
    const data = await piRequest("/brand/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(normalizeLead(data.lead ?? data), { status: 201 });
  } catch {
    return NextResponse.json(
      normalizeLead({
        ...body,
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }
}
