import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./supabase-config";

export function getServerSupabase() {
  const config = resolveSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured");
  }
  return createClient(config.url, config.key);
}
