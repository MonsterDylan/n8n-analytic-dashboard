import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables"
  );
}

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
    );
  }
  return supabase;
}
