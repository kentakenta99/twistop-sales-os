import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const CALCOM_URL = process.env.CALCOM_BOOKING_URL ?? "https://cal.com/twistop/demo";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }

  try {
    const { to, subject, body, company, contact } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject, body are required" }, { status: 400 });
    }

    const htmlBody = body
      .split("\n\n")
      .map((p: string) => `<p style="margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#1e293b;padding:24px 32px">
      <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.5px">TwisTop</div>
      <div style="color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:2px">spirit + mixers</div>
    </div>
    <div style="padding:32px;color:#334155;font-size:15px;line-height:1.7">
      ${htmlBody}
      <div style="margin:32px 0 0;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
        <a href="${CALCOM_URL}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px">
          Book a 20-min call →
        </a>
      </div>
    </div>
    <div style="background:#f1f5f9;padding:16px 32px;font-size:11px;color:#94a3b8;text-align:center">
      TwisTop · hello@twistop.com<br>
      <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#94a3b8">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `TwisTop <${FROM}>`,
      to: [to],
      subject,
      html,
      text: body,
      tags: [
        { name: "company", value: (company ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) },
        { name: "contact", value: (contact ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) },
      ],
    });

    if (error) {
      console.error("[send] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messageId: data?.id });
  } catch (err) {
    console.error("[send] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
