import { NextRequest, NextResponse } from "next/server";

// Unipile: LinkedIn DM送信（接続済みアカウントから送る）
export async function POST(req: NextRequest) {
  const apiKey = process.env.UNIPILE_API_KEY;
  const accountId = process.env.UNIPILE_ACCOUNT_ID;
  const dsn = process.env.UNIPILE_DSN ?? "api4.unipile.com:13454";

  if (!apiKey || !accountId) {
    return NextResponse.json(
      { error: "UNIPILE_API_KEY / UNIPILE_ACCOUNT_ID not configured" },
      { status: 503 }
    );
  }

  const { linkedin_url, message, contact, company } = await req.json();

  if (!linkedin_url || !message) {
    return NextResponse.json({ error: "linkedin_url and message are required" }, { status: 400 });
  }

  // Unipile: 新規スレッドを開いてDM送信
  const res = await fetch(`https://${dsn}/api/v1/chats`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_id: accountId,
      attendees_profiles_urls: [linkedin_url],
      text: message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[linkedin-dm] Unipile error:", err);
    return NextResponse.json({ error: `Unipile error: ${err}` }, { status: res.status });
  }

  const data = await res.json();
  console.log(`[linkedin-dm] Sent to ${contact} @ ${company} — chat_id: ${data.id}`);

  return NextResponse.json({ ok: true, chat_id: data.id });
}
