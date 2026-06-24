import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "content-assets";

export async function POST(req: NextRequest) {
  const { filename } = await req.json();
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(safeName);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(safeName);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: safeName,
    publicUrl: publicData.publicUrl,
  });
}
