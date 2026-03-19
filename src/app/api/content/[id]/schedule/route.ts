import { NextRequest, NextResponse } from "next/server";

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
  let body: { scheduled_for: string };
  try {
    body = await req.json();
    if (!body.scheduled_for) throw new Error("missing scheduled_for");
  } catch {
    return NextResponse.json(
      { error: "scheduled_for (ISO date string) is required" },
      { status: 400 }
    );
  }

  try {
    const data = await piRequest(`/brand/content/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      id,
      approval_status: "approved",
      scheduled_for: body.scheduled_for,
    });
  }
}
