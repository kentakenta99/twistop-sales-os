import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side (respects RLS)
export const supabase = createClient(url, anon);

// Server-side API routes only — bypasses RLS
export const supabaseAdmin = createClient(url, service);

export type Prospect = {
  id: string;
  company: string;
  country: string;
  flag: string | null;
  contact: string;
  email: string;
  website: string | null;
  segment: string;
  axis: "A" | "B";
  stage: string;
  score: number;
  notes: string | null;
  last_contacted: string | null;
  source: "manual" | "ai_generated" | "import";
  created_at: string;
  updated_at: string;
};

export type OutreachPlan = {
  id: string;
  prospect_id: string;
  steps: { day: number; subject: string; body: string }[];
  status: "draft" | "approved" | "sent";
  created_at: string;
  updated_at: string;
};

export type ContentAsset = {
  id: string;
  title: string;
  type: "video" | "pdf" | "image" | "gif";
  url: string;
  storage_path: string | null;
  size_bytes: number | null;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
};
