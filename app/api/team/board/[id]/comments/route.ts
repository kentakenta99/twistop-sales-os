import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("board_comments")
    .select("*, author:author_id(id,name,avatar_color)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content, author_id } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("board_comments")
    .insert({ post_id: id, content, author_id })
    .select("*, author:author_id(id,name,avatar_color)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
