import { NextResponse } from "next/server";
import { getLowStock } from "@/src/lib/pi-client";

export async function GET() {
  try {
    const data = await getLowStock();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Request failed" },
      { status: 500 }
    );
  }
}
