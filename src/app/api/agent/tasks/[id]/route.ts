import { NextRequest, NextResponse } from "next/server";
import { PI_BASE_URL, PI_API_KEY, isPiConfigured } from "@/src/lib/pi";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isPiConfigured()) {
    return NextResponse.json({ error: "Pi backend not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const body = await req.text();
    const response = await fetch(`${PI_BASE_URL}/brand/agent/tasks/${id}`, {
      method: "PATCH",
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
    return NextResponse.json({ error: "Failed to update agent task" }, { status: 500 });
  }
}
