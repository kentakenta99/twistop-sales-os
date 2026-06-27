import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyAssignee } from "@/lib/sendNotification";
import { KNOWN_USERS } from "@/lib/currentUser";

// PATCH: ステータス更新 or CRM Pipeline化
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // ── CRM Pipeline化 ─────────────────────────────────────────────────────────
  if (body.action === "convert_to_lead") {
    const { data: signal } = await supabaseAdmin
      .from("social_signals")
      .select("*")
      .eq("id", id)
      .single();

    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });

    // CRM Contactを作成（重複はignore）
    const contactName  = signal.commenter_name || signal.commenter_handle || "Unknown";
    const platformTag  = `@${signal.commenter_handle || "unknown"} (${signal.platform})`;

    const contactInsert = await supabaseAdmin
      .from("contacts")
      .insert({
        name:       contactName,
        company:    null,
        email:      null,
        axis:       signal.signal_type === "partnership_inquiry" ? "B" : "A",
        stage:      "Cold",
        source:     "social",
        notes:      `Social Signal: "${signal.comment_text.slice(0, 200)}" — ${platformTag}`,
        created_by: null,
      })
      .select()
      .single();
    const contact = contactInsert.data;

    // シグナルを更新
    const { data: updated } = await supabaseAdmin
      .from("social_signals")
      .update({
        status:         "converted",
        contact_id:     contact?.id ?? null,
        pipeline_stage: "Cold",
        updated_at:     new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    // Damonへ通知
    const damon = KNOWN_USERS.find(u => u.name === "Damon");
    if (damon) {
      const typeLabel = signal.signal_type === "partnership_inquiry" ? "Partnership inquiry" : "Buying intent";
      await notifyAssignee({
        assigneeId: damon.id,
        subject:    `[TwisTop Signal] ${typeLabel} on ${signal.platform}`,
        body:       `A new ${typeLabel.toLowerCase()} was detected on ${signal.platform}.\n\n` +
                    `Comment: "${signal.comment_text}"\n` +
                    `Handle: @${signal.commenter_handle || "unknown"}\n` +
                    `Keywords: ${signal.keywords_matched?.join(", ")}\n\n` +
                    `A new CRM contact "${contactName}" has been created and added to the Pipeline.`,
      });
    }

    return NextResponse.json({ signal: updated, contact });
  }

  // ── 汎用ステータス更新 ──────────────────────────────────────────────────────
  const allowed = ["status", "reply_sent", "reply_text", "auto_replied_at"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("social_signals")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signal: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("social_signals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
