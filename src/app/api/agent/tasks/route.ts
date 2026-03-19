import { NextRequest, NextResponse } from "next/server";
import { PI_BASE_URL, PI_API_KEY, isPiConfigured } from "@/src/lib/pi";

export async function GET() {
  if (!isPiConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(`${PI_BASE_URL}/brand/agent/tasks`, {
      headers: {
        "x-api-key": PI_API_KEY,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error("Failed to load agent tasks");
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!isPiConfigured()) {
    return NextResponse.json({ error: "Pi backend not configured" }, { status: 503 });
  }

  try {
    const body = await req.text();
    const response = await fetch(`${PI_BASE_URL}/brand/agent/tasks`, {
      method: "POST",
      headers: {
        "x-api-key": PI_API_KEY,
        "content-type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to create agent task" }, { status: 500 });
  }
}
