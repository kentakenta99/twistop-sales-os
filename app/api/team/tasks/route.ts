import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { notifyAssignee } from "@/lib/sendNotification";
import { KNOWN_USERS } from "@/lib/currentUser";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*, assignee:assignee_id(id,name,avatar_color), creator:creator_id(id,name,avatar_color)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, priority, assignee_id, creator_id, due_date } = body;
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({ title, description, priority: priority ?? "medium", assignee_id, creator_id, due_date })
    .select("*, assignee:assignee_id(id,name,avatar_color), creator:creator_id(id,name,avatar_color)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (assignee_id && assignee_id !== creator_id) {
    const creator = KNOWN_USERS.find((u) => u.id === creator_id);
    const dueLine = due_date ? `\nDue: ${due_date}` : "";
    notifyAssignee({
      assigneeId: assignee_id,
      subject: `[TwisTop Axis] New task assigned: "${title}"`,
      body: `You have been assigned a new task.\n\nTask: ${title}${description ? `\n\n${description}` : ""}${dueLine}\nPriority: ${priority ?? "medium"}\nAssigned by: ${creator?.name ?? "Team"}`,
    }).catch(() => {});
  }

  return NextResponse.json({ task: data });
}
