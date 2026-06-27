import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const TWISTOP_CONTEXT = `TwisTop is a patented device that clamps onto any standard beverage can (Coke, sparkling water, Monster Energy, etc.) and dispenses a perfectly measured shot of spirits directly into it — creating an instant, on-the-spot cocktail.

Example: Nikka whisky + Wilkinson sparkling water can = perfect highball in seconds. No bar setup, no pouring mess. Huge visual impact. The device is reusable, pocket-sized, and dishwasher safe.

Key selling points:
- Patent-protected mechanism — first of its kind globally
- Works with any can brand worldwide
- Instant premium cocktail at events, concerts, festivals, travel
- IP holder: Australian entrepreneur Damon — seeking global distribution partners
- Target markets: music festivals, nightclubs, corporate events, travel retail, sports events
- B2B target: event organizers (Axis A) and distribution partners like spirits companies, hospitality wholesalers (Axis B)`;

const PLATFORM_SPECS: Record<string, string> = {
  tiktok:        "TikTok (vertical 9:16, 15-60s, hook in first 3s, trend-aware, Gen Z/Millennial, entertainment-first)",
  youtube_short: "YouTube Shorts (vertical 9:16, up to 60s, SEO-relevant title, broad appeal)",
  youtube:       "YouTube (horizontal 16:9, 2-5min, educational + storytelling, SEO-optimized, longer CTA)",
  instagram:     "Instagram Reels (vertical 9:16, 15-90s, aesthetic, strong visual cues, IG-native slang)",
  linkedin:      "LinkedIn (square 1:1 or 4:5, 1-3min, professional tone, B2B focused, ROI messaging)",
};

const CONTENT_TYPE_BRIEFS: Record<string, string> = {
  brand_story:    "Introduce TwisTop's origin story, the problem it solves, and the vision. Emotional, inspirational arc.",
  product_demo:   "Show exactly how TwisTop works step-by-step. The 'wow' moment of the pour. Clear before/after contrast.",
  partner_pitch:  "Pitch to potential distribution partners (spirits brands, wholesalers, event companies). ROI and market opportunity focused.",
  event:          "Capture TwisTop in action at a real event. Social proof, energy, FOMO-driven.",
  testimonial:    "First-person style: a customer or partner speaking about their TwisTop experience. Authentic, specific.",
};

const DURATION_SPECS: Record<string, string> = {
  short:  "under 60 seconds",
  medium: "1-3 minutes",
  long:   "3-5 minutes",
};

function buildPrompt(params: {
  contentType: string;
  platforms: string[];
  tone: string;
  duration: string;
  language: string;
  keyMessage: string;
}) {
  const platformList = params.platforms.map(p => PLATFORM_SPECS[p] || p).join("\n- ");
  const durationDesc = DURATION_SPECS[params.duration] || params.duration;
  const contentBrief = CONTENT_TYPE_BRIEFS[params.contentType] || params.contentType;

  return `You are a world-class social media content strategist and scriptwriter specializing in viral product marketing.

PRODUCT:
${TWISTOP_CONTEXT}

YOUR TASK: Write a complete video content package for TwisTop.

CONTENT TYPE: ${contentBrief}
TONE: ${params.tone}
TARGET DURATION: ${durationDesc}
LANGUAGE: ${params.language === "en" ? "English" : params.language === "ja" ? "Japanese" : params.language === "fr" ? "French" : params.language}
KEY MESSAGE FROM CLIENT: ${params.keyMessage || "General TwisTop promotion"}

TARGET PLATFORMS:
- ${platformList}

DELIVER exactly this JSON structure (no markdown, no extra text):
{
  "script": "Full production script including [VISUAL: description] markers, [PAUSE], stage directions, and SPEAKER lines — for the human director's reference.",
  "heygen_input": "ONLY the spoken words for the HeyGen avatar to read aloud. No stage directions, no [VISUAL:] tags, no [PAUSE], no brackets of any kind. Pure conversational spoken text, natural rhythm, as if talking to camera. This is sent directly to text-to-speech synthesis.",
  "hook": "The opening 3-5 seconds. Must stop the scroll.",
  "captions": {
    ${params.platforms.map(p => `"${p}": "Platform-optimized caption. Include native platform formatting (line breaks, emojis where appropriate). 150-300 chars for short-form, up to 500 for YouTube/LinkedIn."`).join(",\n    ")}
  },
  "hashtags": {
    "core": ["brand hashtags — max 5"],
    "trend": ["trending/popular hashtags relevant to content — max 8"],
    "niche": ["niche discovery hashtags — max 5"]
  },
  "title_youtube": "SEO-optimized YouTube title (if youtube in platforms, else null)",
  "thumbnail_prompt": "Detailed prompt for generating a thumbnail image. Describe colors, text overlay, subject clearly.",
  "parrot_tip": "One sentence on how Parrot AI could enhance this video (e.g. translate to Japanese, clone voice for multilingual)",
  "production_notes": "2-3 key notes for the HeyGen avatar — pacing, expression, hand gestures, energy level"
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, platforms, tone, duration, language, keyMessage } = body;

    if (!contentType || !platforms?.length) {
      return NextResponse.json({ error: "contentType and platforms are required" }, { status: 400 });
    }

    const prompt = buildPrompt({ contentType, platforms, tone, duration, language, keyMessage });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI response parse failed" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[studio/script] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Script generation failed" },
      { status: 500 }
    );
  }
}
