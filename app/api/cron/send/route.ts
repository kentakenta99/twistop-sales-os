import { NextRequest, NextResponse } from "next/server";

// Vercel Cron calls this every day at 9am JST (00:00 UTC)
// vercel.json: { "crons": [{ "path": "/api/cron/send", "schedule": "0 0 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: replace with Supabase query when SUPABASE_URL is configured
  // const { data: due } = await supabase
  //   .from("outreach_sequences")
  //   .select("*, prospects(*)")
  //   .eq("status", "scheduled")
  //   .lte("scheduled_at", new Date().toISOString())
  //   .limit(50);

  // TODO: send via Resend
  // for (const seq of due) {
  //   await resend.emails.send({ from, to, subject, html });
  //   await supabase.from("outreach_sequences").update({ status: "sent", sent_at: new Date() }).eq("id", seq.id);
  // }

  return NextResponse.json({
    ok: true,
    message: "Cron endpoint ready — connect Supabase + Resend to activate",
    sent: 0,
    timestamp: new Date().toISOString(),
  });
}
