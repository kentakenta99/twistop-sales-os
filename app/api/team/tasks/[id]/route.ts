import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { notifyAssignee } from "@/lib/sendNotification";
import { KNOWN_USERS } from "@/lib/currentUser";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch previous state to detect assignee change
  const { data: prev } = await supabaseAdmin.from("tasks").select("assignee_id, title").eq("id", id).single();

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update(body)
    .eq("id", id)
    .select("*, assignee:assignee_id(id,name,avatar_color), creator:creator_id(id,name,avatar_color)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newAssigneeId: string | undefined = body.assignee_id;
  const taskTitle: string = data.title ?? prev?.title ?? "Task";

  // Notify on new assignment or reassignment
  if (newAssigneeId && newAssigneeId !== prev?.assignee_id) {
    const updater = KNOWN_USERS.find((u) => u.id === body.updated_by);
    notifyAssignee({
      assigneeId: newAssigneeId,
      subject: `[TwisTop Axis] Task assigned to you: "${taskTitle}"`,
      body: `A task has been assigned to you.\n\nTask: ${taskTitle}\nAssigned by: ${updater?.name ?? "Team"}`,
    }).catch(() => {});
  }

  // Notify on status change (fire to assignee if different from updater)
  if (body.status && prev && newAssigneeId && newAssigneeId !== body.updated_by) {
    const updater = KNOWN_USERS.find((u) => u.id === body.updated_by);
    notifyAssignee({
      assigneeId: newAssigneeId,
      subject: `[TwisTop Axis] Task updated: "${taskTitle}"`,
      body: `A task assigned to you has been updated.\n\nTask: ${taskTitle}\nNew status: ${body.status}\nUpdated by: ${updater?.name ?? "Team"}`,
    }).catch(() => {});
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
