import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prefs: data });
}

export async function PUT(req: NextRequest) {
  const { user_id, tasks_enabled, calendar_enabled, board_enabled } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert({
      user_id,
      tasks_enabled,
      calendar_enabled,
      board_enabled,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prefs: data });
}
