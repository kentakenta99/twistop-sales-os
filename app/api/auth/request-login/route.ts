import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_EMAILS = ["kenta_yagi@wishbone.tokyo", "damonj@acuver.com", "kentakenta99@gmail.com"];

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const normalized = (email ?? "").trim().toLowerCase();

  if (!ALLOWED_EMAILS.includes(normalized)) {
    return NextResponse.json({ error: "This email is not authorized." }, { status: 403 });
  }

  // Supabase Admin APIでマジックリンクを生成（メール送信しない）
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://twistop-sales-os.vercel.app"}/auth/callback`,
    },
  });

  if (error || !data?.properties?.action_link) {
    console.error("[request-login] generateLink error:", error);
    return NextResponse.json({ error: "Failed to generate login link." }, { status: 500 });
  }

  const magicLink = data.properties.action_link;

  // Resend APIで直接送信（Supabase SMTPを完全バイパス）
  const { error: sendError } = await resend.emails.send({
    from: "Axis <onboarding@resend.dev>",
    to: normalized,
    subject: "Your Axis login link",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Sign in to TwisTop Axis</h2>
        <p style="color:#475569;margin-bottom:24px;">Click the button below to sign in. This link expires in 1 hour.</p>
        <a href="${magicLink}"
           style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px;">
          Sign in to Axis
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
          If you didn't request this, you can safely ignore it.
        </p>
      </div>
    `,
  });

  if (sendError) {
    console.error("[request-login] Resend error:", sendError);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
