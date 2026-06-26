import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, company, role, email, phone, axis, stage, notes, source, created_by } = body;
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      name,
      company: company ?? null,
      role: role ?? null,
      email: email ?? null,
      phone: phone ?? null,
      axis: axis ?? null,
      stage: stage ?? null,
      notes: notes ?? null,
      source: source ?? "manual",
      created_by: created_by ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
