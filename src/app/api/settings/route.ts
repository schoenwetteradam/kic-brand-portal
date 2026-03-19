import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_APP_SETTINGS, mergeSettings, type AppSettings } from "@/src/lib/app-settings";
import { getSupabaseAdmin } from "@/src/lib/supabase-admin";

const APP_ID = "kic-brand-portal";

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      settings: DEFAULT_APP_SETTINGS,
      persisted: false,
      provider: "env",
    });
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("settings")
    .eq("app_id", APP_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to load settings from Supabase",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    settings: mergeSettings((data?.settings as Partial<AppSettings> | undefined) ?? {}),
    persisted: Boolean(data),
    provider: "supabase",
  });
}

export async function PUT(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase is not configured for settings persistence.",
      },
      { status: 503 }
    );
  }

  let body: { settings?: Partial<AppSettings> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const settings = mergeSettings(body.settings);

  const { error } = await supabase.from("app_settings").upsert(
    {
      app_id: APP_ID,
      settings,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "app_id",
    }
  );

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to save settings",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    settings,
    persisted: true,
    provider: "supabase",
  });
}
