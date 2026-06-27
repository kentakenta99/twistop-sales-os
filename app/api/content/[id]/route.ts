import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "content-assets";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // storage_path を取得してからストレージファイルも削除
  const { data: asset, error: fetchErr } = await supabaseAdmin
    .from("content_assets")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (asset?.storage_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([asset.storage_path]);
  }

  const { error } = await supabaseAdmin.from("content_assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
