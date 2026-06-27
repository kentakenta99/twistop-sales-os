import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { notifyAll } from "@/lib/sendNotification";
import { KNOWN_USERS } from "@/lib/currentUser";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("board_posts")
    .select("*, author:author_id(id,name,avatar_color), reactions:board_reactions(id,emoji,user_id)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { title, content, author_id } = await req.json();
  const { data, error } = await supabaseAdmin
    .from("board_posts")
    .insert({ title, content, author_id })
    .select("*, author:author_id(id,name,avatar_color), reactions:board_reactions(id,emoji,user_id)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const author = KNOWN_USERS.find((u) => u.id === author_id);
  notifyAll({
    module: "board",
    subject: `[TwisTop Axis] New board post: "${title}"`,
    body: `A new post has been shared on the team board.\n\nTitle: ${title}\n\n${content}\n\nPosted by: ${author?.name ?? "Team"}`,
    excludeUserId: author_id ?? undefined,
  }).catch(() => {});

  return NextResponse.json({ post: data });
}
