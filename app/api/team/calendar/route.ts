import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let query = supabaseAdmin
    .from("calendar_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (year && month) {
    const pad = String(month).padStart(2, "0");
    const from = `${year}-${pad}-01`;
    const nextM = parseInt(month) === 12
      ? `${parseInt(year) + 1}-01-01`
      : `${year}-${String(parseInt(month) + 1).padStart(2, "0")}-01`;
    query = query.gte("event_date", from).lt("event_date", nextM);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, event_date, event_type, description, all_day, start_time, end_time, created_by } = body;
  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .insert({
      title,
      event_date,
      event_type,
      description: description ?? null,
      all_day: all_day ?? true,
      start_time: all_day ? null : (start_time ?? null),
      end_time: all_day ? null : (end_time ?? null),
      created_by: created_by ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
