import { NextRequest, NextResponse } from "next/server";
import { normalizeCampaign } from "@/lib/brand-normalizers";
import { piRequest } from "@/lib/pi";

export async function GET() {
  try {
    const data = await piRequest("/brand/campaigns");
    return NextResponse.json((Array.isArray(data) ? data : []).map(normalizeCampaign));
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

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const payload = {
    name: body.name,
    objective: body.objective || "",
    audience: body.target_roles || [],
    locations: body.target_locations || [],
    budget: body.budget ?? null,
    status: body.status ?? "draft",
    startDate: body.start_date || null,
    endDate: body.end_date || null,
  };

  try {
    const data = await piRequest("/brand/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(normalizeCampaign(data.campaign ?? data), { status: 201 });
  } catch {
    return NextResponse.json(
      normalizeCampaign({
        ...payload,
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }
}
