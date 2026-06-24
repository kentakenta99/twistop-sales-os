import { NextRequest, NextResponse } from "next/server";
import { generateOutreachSequence } from "@/lib/claude";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { company, contact, country, segment, axis, notes } = body;

  if (!company || !contact || !axis) {
    return NextResponse.json({ error: "company, contact, axis are required" }, { status: 400 });
  }

  const sequence = await generateOutreachSequence({ company, contact, country, segment, axis, notes: notes ?? "" });
  return NextResponse.json(sequence);
}
