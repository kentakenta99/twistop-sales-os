import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "content-assets";

function detectType(mime: string): "video" | "pdf" | "image" | "gif" {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("video/")) return "video";
  return "image";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string) || file?.name || "Untitled";
    const tagsRaw = (form.get("tags") as string) || "";
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const type = detectType(file.type);

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(safeName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(safeName);

    // Save metadata to DB
    const { data, error: dbError } = await supabaseAdmin
      .from("content_assets")
      .insert({
        title,
        type,
        url: publicData.publicUrl,
        storage_path: safeName,
        size_bytes: file.size,
        tags,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, asset: data });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
