import { NextRequest, NextResponse } from "next/server";

// Enrichlayer: LinkedIn URLからリードのプロフィールデータを取得
export async function POST(req: NextRequest) {
  const apiKey = process.env.ENRICHLAYER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ENRICHLAYER_API_KEY not configured" }, { status: 503 });
  }

  const { linkedin_url } = await req.json();
  if (!linkedin_url) {
    return NextResponse.json({ error: "linkedin_url is required" }, { status: 400 });
  }

  const url = new URL("https://enrichlayer.com/api/v1/linkedin/person");
  url.searchParams.set("linkedin_url", linkedin_url);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Enrichlayer error: ${err}` }, { status: res.status });
  }

  const data = await res.json();

  return NextResponse.json({
    full_name: data.full_name ?? data.name ?? null,
    headline: data.headline ?? null,
    occupation: data.occupation ?? data.title ?? null,
    summary: data.summary ?? null,
    company_name: data.company ?? data.experiences?.[0]?.company ?? null,
    company_employee_count: data.company_size ?? null,
    industry: data.industry ?? null,
    follower_count: data.follower_count ?? data.connections ?? null,
    profile_pic_url: data.profile_pic_url ?? data.photo ?? null,
  });
}
