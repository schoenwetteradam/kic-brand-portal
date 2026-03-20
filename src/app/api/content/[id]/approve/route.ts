import { NextResponse } from "next/server";
import { normalizeContent } from "@/lib/brand-normalizers";
import { piRequest } from "@/lib/pi";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await piRequest(`/brand/content/${id}/approve`, { method: "POST" });
    return NextResponse.json(normalizeContent({ id, status: data.content?.status || "approved" }));
  } catch {
    return NextResponse.json({ error: "Could not approve content." }, { status: 503 });
  }
}
