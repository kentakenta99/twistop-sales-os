import { createClient } from "@supabase/supabase-js";

// Client-side only — uses NEXT_PUBLIC vars, never imports service role key
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
