import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com";

function heygenHeaders() {
  return {
    "X-Api-Key": process.env.HEYGEN_API_KEY ?? "",
    "Content-Type": "application/json",
  };
}

// GET /api/studio/heygen?action=avatars|voices|status&video_id=xxx
export async function GET(request: NextRequest) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HEYGEN_API_KEY not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "ping") {
    // 軽量チェック：アカウント情報のみ取得
    return NextResponse.json({ ok: true });
  }

  if (action === "avatars") {
    const res = await fetch(`${HEYGEN_BASE}/v2/avatars`, { headers: heygenHeaders() });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === "voices") {
    const res = await fetch(`${HEYGEN_BASE}/v2/voices`, { headers: heygenHeaders() });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === "status") {
    const videoId = searchParams.get("video_id");
    if (!videoId) return NextResponse.json({ error: "video_id required" }, { status: 400 });
    const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
      headers: heygenHeaders(),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// POST /api/studio/heygen — submit video generation job
export async function POST(request: NextRequest) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HEYGEN_API_KEY not configured" }, { status: 503 });
  }

  const { script, avatarId, voiceId, aspectRatio, language } = await request.json();

  if (!script) return NextResponse.json({ error: "script is required" }, { status: 400 });

  // Kenta's custom avatar + voice as defaults
  const DEFAULT_AVATAR_ID = "f8007fcb9b2945449f778ef222f15313";
  const DEFAULT_VOICE_ID  = "9603c8bb0efd4e4db7cde507f4506903";

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId || DEFAULT_AVATAR_ID,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId || DEFAULT_VOICE_ID,
          speed: 1.0,
        },
        background: {
          type: "color",
          value: "#1e293b",
        },
      },
    ],
    dimension:
      aspectRatio === "16:9"
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 },
    aspect_ratio: aspectRatio || "9:16",
  };

  const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.message || "HeyGen API error" }, { status: res.status });
  }

  return NextResponse.json({ video_id: data?.data?.video_id ?? data?.video_id });
}
