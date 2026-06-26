import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { post_id, user_id, emoji } = await req.json();
  // Toggle: delete if exists, insert if not
  const { data: existing } = await supabaseAdmin
    .from("board_reactions")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user_id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("board_reactions").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("board_reactions").insert({ post_id, user_id, emoji });
  }
  return NextResponse.json({ ok: true });
}
