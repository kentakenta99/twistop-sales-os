import { NextRequest, NextResponse } from "next/server";
import { classifyReply } from "@/lib/claude";

// Resend webhook — receives reply events
export async function POST(req: NextRequest) {
  const payload = await req.json();
  const { type, data } = payload;

  if (type === "email.bounced" || type === "email.complained") {
    // TODO: add to optout_list in Supabase
    console.log(`[webhook] ${type} — adding to suppression list:`, data?.to);
    return NextResponse.json({ ok: true });
  }

  if (type === "email.opened") {
    // TODO: update outreach_sequences.opened_at in Supabase
    return NextResponse.json({ ok: true });
  }

  if (type === "email.replied") {
    const replyBody: string = data?.text ?? data?.html ?? "";

    if (process.env.ANTHROPIC_API_KEY && replyBody) {
      const classification = await classifyReply(replyBody);
      console.log("[webhook] reply classified:", classification);
      // TODO: update deal stage in Supabase based on classification
      // if classification.classification === "interested" → send Cal.com link
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
