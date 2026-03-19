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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await piRequest(`/brand/content/${id}`);
    return NextResponse.json(data);
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    const data = await piRequest(`/brand/content/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ id, ...body });
  }
}
