import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzggzyngzbodwkrqdoad.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_wbT4UP6OahoojLUe-9OIsw_yguV9BV5";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
