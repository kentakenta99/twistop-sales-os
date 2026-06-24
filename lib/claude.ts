import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface EmailStep {
  step: number;
  send_at_days: number;
  subject_a: string;
  subject_b: string;
  body: string;
  channel: "email";
}

export interface GeneratedSequence {
  emails: EmailStep[];
  research_summary: string;
}

export async function generateOutreachSequence(prospect: {
  company: string;
  contact: string;
  country: string;
  segment: string;
  axis: "A" | "B";
  notes: string;
}): Promise<GeneratedSequence> {
  const axisContext =
    prospect.axis === "A"
      ? "Sell TwisTop in bulk lots (minimum 500 units) for use at their events. The pitch is about enhancing event experience and SNS virality."
      : "Establish a distribution partnership (exclusive or non-exclusive) for their territory. The pitch is about a new premium category and territory rights.";

  const prompt = `You are a world-class B2B sales copywriter for TwisTop — a revolutionary device that attaches to standard beverage cans and dispenses spirits, instantly creating cocktails at events.

Product: TwisTop (spirit + mixers device)
Key benefits: No bar setup needed, Instagram-worthy, works with any standard can (Monster, Wilkinson, Coca-Cola etc.), spirits loaded on top

PROSPECT BRIEF:
Company: ${prospect.company}
Contact: ${prospect.contact}
Country: ${prospect.country}
Business type: ${prospect.segment}
Goal: ${axisContext}
Extra context: ${prospect.notes || "none"}

TASK: Generate a 3-step cold email sequence. Return ONLY valid JSON, no markdown fences.

Rules:
- Each email body: MAXIMUM 120 words. Conversational, never salesy.
- Open with something specific about THEIR business (research their segment)
- One clear, punchy TwisTop benefit per email
- CTA must include [CALENDAR_LINK] placeholder
- Footer must include [UNSUBSCRIBE_LINK] placeholder
- Subject A/B: two variants per email, curiosity-driven, under 8 words each
- Email 3 is the "breakup" email with light FOMO
- Axis A tone: exciting, event-focused, experiential
- Axis B tone: business-forward, territory, ROI-focused

Return this exact JSON structure:
{
  "research_summary": "2-sentence summary of why this company is a good fit",
  "emails": [
    {
      "step": 1,
      "send_at_days": 0,
      "subject_a": "...",
      "subject_b": "...",
      "body": "Hi [FIRST_NAME],\\n\\n[email body]\\n\\n[CALENDAR_LINK]\\n\\n--\\n[YOUR_NAME] | TwisTop\\n[UNSUBSCRIBE_LINK]",
      "channel": "email"
    },
    {
      "step": 2,
      "send_at_days": 5,
      "subject_a": "...",
      "subject_b": "...",
      "body": "...",
      "channel": "email"
    },
    {
      "step": 3,
      "send_at_days": 8,
      "subject_a": "...",
      "subject_b": "...",
      "body": "...",
      "channel": "email"
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as GeneratedSequence;
}

export async function classifyReply(replyBody: string): Promise<{
  classification: "interested" | "info_request" | "declined" | "other";
  confidence: number;
  suggested_action: string;
}> {
  const prompt = `Classify this email reply into one of these categories:
- "interested": wants to learn more, schedule a call, or has positive intent
- "info_request": asking for specific information (pricing, specs, samples)
- "declined": not interested, too busy, not the right time
- "other": auto-reply, out-of-office, unclear

Reply to classify:
---
${replyBody.slice(0, 500)}
---

Return JSON only: {"classification": "...", "confidence": 0.0-1.0, "suggested_action": "one sentence on what to do next"}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text.trim());
}
