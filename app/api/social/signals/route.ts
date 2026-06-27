import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { detectSignal } from "@/lib/signalDetector";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("social_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signals: data });
}

// 手動 or Webhook からシグナルを登録
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { platform, post_id, post_url, comment_id, commenter_handle, commenter_name, comment_text } = body;

  if (!comment_text || !platform) {
    return NextResponse.json({ error: "comment_text and platform are required" }, { status: 400 });
  }

  // シグナル検知
  const detection = detectSignal(comment_text);

  // スコアが低すぎるものは記録しない（スパム対策）
  if (!detection.shouldCapture && platform !== "manual") {
    return NextResponse.json({ captured: false, reason: "score too low", score: detection.score });
  }

  const { data, error } = await supabaseAdmin
    .from("social_signals")
    .insert({
      platform,
      post_id:          post_id ?? null,
      post_url:         post_url ?? null,
      comment_id:       comment_id ?? null,
      commenter_handle: commenter_handle ?? null,
      commenter_name:   commenter_name ?? null,
      comment_text,
      signal_type:      detection.signalType,
      signal_score:     detection.score,
      keywords_matched: detection.keywordsMatched,
      status:           "new",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ captured: true, signal: data }, { status: 201 });
}
