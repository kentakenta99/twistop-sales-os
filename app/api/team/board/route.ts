import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

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
  return NextResponse.json({ post: data });
}
