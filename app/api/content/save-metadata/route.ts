import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, type, url, storage_path, size_bytes, tags } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("content_assets")
    .insert({ title, type, url, storage_path, size_bytes, tags })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, asset: data });
}
