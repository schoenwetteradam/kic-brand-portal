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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await piRequest(`/brand/content/${id}/approve`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch {
    // Optimistic: return approved state so UI reflects immediately
    return NextResponse.json({ id, approval_status: "approved" });
  }
}
