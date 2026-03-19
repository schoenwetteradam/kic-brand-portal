import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { RecruitmentLead } from "@/src/types/brand";

const ROLE_LABELS: Record<string, string> = {
  cosmetologist: "cosmetologist",
  esthetician: "esthetician",
  massage_therapist: "massage therapist",
  lash_artist: "lash artist",
  nail_tech: "nail tech",
  general: "beauty professional",
};

const STAGE_CONTEXT: Record<string, string> = {
  new: "This is their first follow-up — they just inquired. Keep it warm and inviting.",
  contacted: "We've reached out once before. Gently check in and keep the door open.",
  interested: "They've shown interest. Move them toward scheduling a tour.",
  tour_scheduled: "They have a tour coming up. Send a friendly confirmation and build excitement.",
  interviewed: "They've toured or interviewed. Nudge toward making a decision.",
  pending_decision: "They're deciding. Address any hesitation and reaffirm the opportunity.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch lead data from body (passed by client) or from Pi
  let lead: Partial<RecruitmentLead>;
  try {
    lead = await req.json();
  } catch {
    return NextResponse.json({ error: "Lead data required in request body" }, { status: 400 });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    // Template fallback
    const role = ROLE_LABELS[lead.role_type ?? "general"] ?? "beauty professional";
    return NextResponse.json({
      id,
      dm_message: `Hi ${lead.full_name?.split(" ")[0] ?? "there"}! Just checking in — we'd love to tell you more about booth rental opportunities at Keeping It Cute. Would you be available for a quick tour this week?`,
      email_subject: `Still interested in joining Keeping It Cute, ${lead.full_name?.split(" ")[0] ?? ""}?`,
      email_body: `Hi ${lead.full_name?.split(" ")[0] ?? "there"},\n\nI wanted to follow up on your interest in our ${role} booth rental at Keeping It Cute Salon & Spa.\n\nWe'd love to have you come in for a tour and see the space! It's a great fit for ${role}s who want a professional, upscale environment with a supportive community.\n\nWould any time this week or next work for you?\n\nWarm regards,\nThe KIC Team`,
      generated_by: "template",
    });
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const role = ROLE_LABELS[lead.role_type ?? "general"] ?? "beauty professional";
  const stageNote = STAGE_CONTEXT[lead.status ?? "new"] ?? STAGE_CONTEXT.new;
  const firstName = lead.full_name?.split(" ")[0] ?? "there";

  const prompt = `You are a friendly, professional recruiter for Keeping It Cute Salon & Spa in Dodge County, Wisconsin.
You are writing follow-up messages to a potential booth renter named ${lead.full_name} who is a ${role}.

Lead details:
- Name: ${lead.full_name}
- Role: ${role}
- City: ${lead.city ?? "local area"}
- Source: ${lead.source ?? "unknown"}
- Current stage: ${lead.status ?? "new"}
- Notes: ${lead.notes ?? "none"}

Follow-up context: ${stageNote}

Write two messages:
1. A short, warm DM/text message (2-4 sentences max). Conversational, not salesy.
2. A professional email (subject + body). Friendly but polished.

Salon key points to weave in naturally (not all at once):
- Private, beautifully designed booth/suite spaces
- Flexible scheduling and lease terms
- Supportive community of experienced beauty professionals
- Established local brand with walk-in traffic
- Located in Dodge County, WI

Return ONLY a JSON object:
{
  "dm_message": "...",
  "email_subject": "...",
  "email_body": "..."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      id,
      dm_message: parsed.dm_message ?? "",
      email_subject: parsed.email_subject ?? `Following up — ${firstName}`,
      email_body: parsed.email_body ?? "",
      generated_by: "claude",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
