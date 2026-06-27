import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("content_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("content_jobs")
    .insert({
      created_by:     body.created_by ?? null,
      content_type:   body.content_type,
      platforms:      body.platforms,
      tone:           body.tone,
      duration:       body.duration,
      language:       body.language,
      key_message:    body.key_message,
      script:         body.script,
      caption_tiktok:     body.caption_tiktok,
      caption_youtube:    body.caption_youtube,
      caption_instagram:  body.caption_instagram,
      caption_linkedin:   body.caption_linkedin,
      hashtags:       body.hashtags,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data }, { status: 201 });
}
