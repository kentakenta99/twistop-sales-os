import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { notifyAll } from "@/lib/sendNotification";
import { KNOWN_USERS } from "@/lib/currentUser";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, event_date, event_type, description, all_day, start_time, end_time, updated_by } = body;
  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .update({ title, event_date, event_type, description, all_day, start_time, end_time })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updater = KNOWN_USERS.find((u) => u.id === updated_by);
  notifyAll({
    module: "calendar",
    subject: `[TwisTop Axis] Event updated: "${title}" on ${event_date}`,
    body: `A calendar event has been updated.\n\nEvent: ${title}\nDate: ${event_date}${description ? `\n\n${description}` : ""}\nUpdated by: ${updater?.name ?? "Team"}`,
    excludeUserId: updated_by ?? undefined,
  }).catch(() => {});

  return NextResponse.json({ event: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("calendar_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
