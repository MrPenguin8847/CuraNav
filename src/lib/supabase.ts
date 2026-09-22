import { createClient } from "@supabase/supabase-js";

// Server-side client (uses service role key for API routes).
// Never import this in client components — use the anon client below for those.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anon client for public read-only usage (safe to use in both server and client contexts).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
