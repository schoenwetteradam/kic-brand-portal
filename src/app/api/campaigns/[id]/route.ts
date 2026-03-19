import { NextRequest, NextResponse } from "next/server";
import { normalizeCampaign } from "@/src/lib/brand-normalizers";
import { piRequest } from "@/src/lib/pi";

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
    name: body.name,
    objective: body.objective,
    audience: body.target_roles,
    locations: body.target_locations,
    budget: body.budget,
    status: body.status,
    startDate: body.start_date,
    endDate: body.end_date,
  };

  try {
    const data = await piRequest(`/brand/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(normalizeCampaign(data.campaign ?? data));
  } catch {
    return NextResponse.json(normalizeCampaign({ id, ...body }));
  }
}
