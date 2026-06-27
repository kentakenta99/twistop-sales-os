import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { detectSignal } from "@/lib/signalDetector";

// YouTube / Instagram / TikTok の Webhook 受信エンドポイント
// 各プラットフォームのWebhook設定でこのURLを登録する:
//   https://your-domain.com/api/social/webhook
//
// YouTube:   PubSubHubbub + YouTube Data API comments polling
// Instagram: Graph API Webhook (comments on media)
// TikTok:    TikTok for Developers Webhook (when available)

// Instagram Webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.SOCIAL_WEBHOOK_SECRET ?? "twistop_webhook_verify";
  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge ?? "ok", { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

// Webhook payload受信 (POST)
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.SOCIAL_WEBHOOK_SECRET ?? "twistop_webhook_verify";

  // 秘密トークン検証（簡易版 — 本番ではHMAC署名検証を追加すること）
  if (secret && secret !== expectedSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Instagram Graph API形式
  if (body.object === "instagram") {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === "comments") {
          const v = change.value;
          await ingestComment({
            platform:         "instagram",
            post_id:          v.media?.id,
            comment_id:       v.id,
            commenter_handle: v.from?.username,
            commenter_name:   v.from?.name,
            comment_text:     v.text,
          });
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  // YouTube / generic形式
  if (body.platform && body.comment_text) {
    await ingestComment(body);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, note: "unrecognized format, ignored" });
}

async function ingestComment(comment: {
  platform: string;
  post_id?: string;
  post_url?: string;
  comment_id?: string;
  commenter_handle?: string;
  commenter_name?: string;
  comment_text: string;
}) {
  const detection = detectSignal(comment.comment_text);
  if (!detection.shouldCapture) return;

  await supabaseAdmin.from("social_signals").insert({
    platform:         comment.platform,
    post_id:          comment.post_id ?? null,
    post_url:         comment.post_url ?? null,
    comment_id:       comment.comment_id ?? null,
    commenter_handle: comment.commenter_handle ?? null,
    commenter_name:   comment.commenter_name ?? null,
    comment_text:     comment.comment_text,
    signal_type:      detection.signalType,
    signal_score:     detection.score,
    keywords_matched: detection.keywordsMatched,
    status:           "new",
  });
}
