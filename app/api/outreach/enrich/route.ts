import { NextRequest, NextResponse } from "next/server";

// Proxycurl: LinkedIn プロフィールURLからリードデータを補完する
export async function POST(req: NextRequest) {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "PROXYCURL_API_KEY not configured" }, { status: 503 });
  }

  const { linkedin_url } = await req.json();
  if (!linkedin_url) {
    return NextResponse.json({ error: "linkedin_url is required" }, { status: 400 });
  }

  const url = new URL("https://nubela.co/proxycurl/api/v2/linkedin");
  url.searchParams.set("url", linkedin_url);
  url.searchParams.set("skills", "include");
  url.searchParams.set("extra", "include");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Proxycurl error: ${err}` }, { status: res.status });
  }

  const data = await res.json();

  // Axisが必要とするフィールドだけ返す
  return NextResponse.json({
    full_name: data.full_name ?? null,
    headline: data.headline ?? null,
    occupation: data.occupation ?? null,
    summary: data.summary ?? null,
    company_name: data.experiences?.[0]?.company ?? null,
    company_employee_count: data.company?.company_size?.[1] ?? null,
    industry: data.industry ?? null,
    follower_count: data.follower_count ?? null,
    profile_pic_url: data.profile_pic_url ?? null,
  });
}
