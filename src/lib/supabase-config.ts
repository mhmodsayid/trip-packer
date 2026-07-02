function getSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function isPlaceholderKey(key: string): boolean {
  return (
    key.includes("your-anon") ||
    key.includes("your-publishable") ||
    key.includes("PASTE_")
  );
}

function isPlaceholderUrl(url: string): boolean {
  return url.includes("your-project");
}

export function resolveSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key || isPlaceholderUrl(url) || isPlaceholderKey(key)) {
    return null;
  }

  return { url, key };
}
