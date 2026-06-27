import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "content-assets";

// POST: HeyGen署名付きURLの動画をSupabase Storageに永続保存
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, title, tags } = await req.json() as {
      videoUrl: string;
      title: string;
      tags?: string[];
    };

    if (!videoUrl || !title) {
      return NextResponse.json({ error: "videoUrl and title are required" }, { status: 400 });
    }

    // HeyGenから動画をダウンロード（サーバーサイドで実行）
    const dlRes = await fetch(videoUrl);
    if (!dlRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch video from HeyGen: ${dlRes.status}` },
        { status: 502 }
      );
    }
    const videoBuffer = await dlRes.arrayBuffer();
    const sizeBytes = videoBuffer.byteLength;

    // ファイル名をサニタイズ
    const safeName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9._-]/g, "_")}.mp4`;

    // Supabase Storageにアップロード
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(safeName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(safeName);

    // content_assetsにメタデータ保存
    const { data, error: dbError } = await supabaseAdmin
      .from("content_assets")
      .insert({
        title,
        type: "video",
        url: publicData.publicUrl,
        storage_path: safeName,
        size_bytes: sizeBytes,
        tags: tags ?? [],
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, asset: data });
  } catch (err) {
    console.error("[archive-heygen] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
