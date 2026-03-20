import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/pi-client";

export async function GET() {
  try {
    const data = await getMetrics();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
