import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors";
import { resolveSupabaseConfig } from "./supabase-config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase client is only available in the browser");
  }

  if (client) return client;

  const config = resolveSupabaseConfig();
  if (!config) {
    throw new AppError("missingSupabase");
  }

  client = createClient(config.url, config.key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return resolveSupabaseConfig() !== null;
}
