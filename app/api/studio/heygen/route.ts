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

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId || "Abigail_expressive_20230713",
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId || "2d5b0e6cf36f460aa7fc47e3eee4ba54",
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
