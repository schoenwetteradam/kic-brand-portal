import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: "Weekly ideas cron is reachable.",
    ranAt: new Date().toISOString(),
  });
}
