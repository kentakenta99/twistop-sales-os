import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { leadId, company, contact, email, country, segment, axis, score, notes } =
      await req.json();

    if (!leadId || !company || !axis) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const axisContext =
      axis === "A"
        ? "an event organizer / end-user who would bulk-order TwisTop units for their events"
        : "a spirits distributor or beverage partner who would carry TwisTop as an area distribution partner";

    const prompt = `You are a B2B sales specialist for TwisTop, a revolutionary device that attaches to beverage cans to dispense spirits, instantly creating cocktails (e.g., attach to a Wilkinson soda can with Nikka Whisky = highball; attach to Monster Energy with Grey Goose = vodka energy cocktail).

Target lead:
- Company: ${company}
- Contact title: ${contact}
- Country: ${country}
- Segment: ${segment}
- Axis: ${axis === "A" ? "A (End User)" : "B (Distribution Partner)"}
- Context: ${axisContext}
- Lead score: ${score}/100
- Notes: ${notes || "none"}

Write a 3-email cold outreach sequence to ${email}. Each email should:
1. Be concise, compelling, and personalized to their specific business context
2. Reference TwisTop's core value prop naturally (instant cocktails, no bartender needed, works with any can + spirit)
3. Progress logically: intro → social proof / curiosity → CTA for a meeting or sample order

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {
    "day": 0,
    "subject": "...",
    "body": "..."
  },
  {
    "day": 3,
    "subject": "...",
    "body": "..."
  },
  {
    "day": 7,
    "subject": "...",
    "body": "..."
  }
]

Each body should be plain text (no HTML), 80-120 words. Subject lines should be punchy, under 60 characters. Do not use placeholders — write the actual personalized content.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: "Failed to parse email sequence from Claude" }, { status: 500 });
    }

    const steps = JSON.parse(match[0]);

    return NextResponse.json({
      plan: {
        leadId,
        company,
        contact,
        email,
        axis,
        steps,
        createdAt: new Date().toISOString(),
        status: "draft",
      },
    });
  } catch (err) {
    console.error("Outreach plan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
