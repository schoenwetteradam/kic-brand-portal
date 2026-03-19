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

export async function GET() {
  try {
    const data = await piRequest("/brand/campaigns");
    return NextResponse.json(data);
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

  try {
    const data = await piRequest("/brand/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch {
    // Pi not connected — return optimistic response
    return NextResponse.json(
      {
        ...body,
        id: `local_${Date.now()}`,
        status: body.status ?? "draft",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }
}
