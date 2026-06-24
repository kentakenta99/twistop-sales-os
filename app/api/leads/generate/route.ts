import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const AXIS_A_SEGMENTS = [
  "Music Festival",
  "Nightclub / Bar",
  "Corporate Events",
  "Sports Events",
  "Esports Events",
  "Food & Beverage Festival",
];

const AXIS_B_SEGMENTS = [
  "Spirits Distributor",
  "Beverage Wholesaler",
  "Travel Retail",
  "Hospitality Supply",
];

function buildPrompt(axis: string, region: string, segment: string, count: number) {
  const axisDesc =
    axis === "A"
      ? "End-user event companies that would purchase TwisTop in bulk for their events"
      : "Distribution partners (wholesalers, distributors, travel retail) who would resell TwisTop across a territory";

  return `You are a world-class B2B sales researcher specializing in the spirits, events, and nightlife industry.

TwisTop is an innovative device that attaches to any standard beverage can (Coke, sparkling water, Monster Energy, etc.) and dispenses a measured shot of spirits directly into it — creating an instant, on-the-spot cocktail. Think: Nikka whisky + Wilkinson sparkling water can = highball in seconds. No bar setup needed. Huge visual impact. Perfect for events, festivals, nightlife.

YOUR TASK: Find exactly ${count} REAL, verifiable target companies for TwisTop B2B outreach.

Target type: ${axisDesc}
Region: ${region}
Segment: ${segment}

STRICT RULES:
1. Only suggest REAL companies that actually exist and can be verified
2. Provide accurate country, website, and realistic email format
3. Score 0-100 based on: event scale, beverage sponsor history, audience fit, decision-maker accessibility
4. Be specific — not generic names like "Event Co." but real brands like "Goldenvoice" or "Secret Garden Party"
5. Focus on companies where TwisTop's visual novelty and ease-of-use creates immediate value

Return ONLY a valid JSON array, no other text, no markdown:
[
  {
    "company": "Exact Company Name",
    "country": "Country Name",
    "flag": "🇺🇸",
    "contact": "Likely decision-maker title (e.g. Event Director, GM, Procurement Manager)",
    "email": "realistic@companydomain.com",
    "website": "https://www.website.com",
    "segment": "${segment}",
    "score": 85,
    "reasoning": "Specific reason why this company is a strong TwisTop target in 1-2 sentences.",
    "axis": "${axis}"
  }
]`;
}

export async function POST(request: NextRequest) {
  try {
    const { axis, region, segment, count } = await request.json();

    if (!axis || !region || !segment || !count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = buildPrompt(axis, region, segment, Math.min(count, 20));

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const leads = JSON.parse(jsonMatch[0]);

    // Assign unique IDs
    const withIds = leads.map((lead: Record<string, unknown>, i: number) => ({
      ...lead,
      id: `gen_${Date.now()}_${i}`,
      lastContacted: "",
      notes: lead.reasoning || "",
      generated: true,
    }));

    return NextResponse.json({ leads: withIds, count: withIds.length });
  } catch (error) {
    console.error("Lead generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
